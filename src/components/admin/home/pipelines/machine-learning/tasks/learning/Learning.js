import learningTemplate from './learning.hbs';
import containerListTemplate from './container-list.hbs';
import algoListTemplate from './algo-list.hbs';
import paramsTemplate from './params.hbs';
import Task from '../Task';
import Features from '../features/Features';
import StringHelper from '@StringHelper';
import APIHelper from '@APIHelper';
import Store from '@Store';
import axios from 'axios';
import AlgoParameters from '@AlgoParameters';
import ModalHelper from '@ModalHelper';
import DataSource from '../data-source/DataSource';

let allAlgos;
let allContainers;
let supervisedAlgos;
let unsupervisedAlgos;
let selectedContainer;
let containerSelect;
let selectedAlgo;
let algoSelect;
let process;

class Learning extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.initData();
  }

  initData() {
    const storedAllAlgos = Store.get('all-containers');
    if (storedAllAlgos === undefined) {
      this.renderView(true);

      getAlgorithms('/algos', this.context).then(response => {
        if (response) {
          allAlgos = response.data.algorithms;
          allContainers = Array.from(new Set(allAlgos.map(algo => algo.container)));
          this.make();
        }
      });
    } else {
      allContainers = allContainers.data;
      this.make();
    }
  }

  renderView(loading = true) {
    process = sessionStorage.getItem('process-type');

    this.context.innerHTML = learningTemplate({
      title: StringHelper.capitalizeFirst(process) + 'ing Process'
    });

    this.buildContainerList('#container', loading);
  }

  buildContainerList(id, loading = true) {
    const select = this.context.querySelector(id);
    select.innerHTML += containerListTemplate({
      containers: allContainers,
      loading: loading
    });
  }

  initContainerSelect() {
    const storedContainer = sessionStorage.getItem('algorithm-container');
    const options = containerSelect.options;
    if (storedContainer) {
      for (let i = 1; i < options.length; ++i) {
        const option = options[i];
        if (option.value === storedContainer) {
          option.selected = true;
          selectedContainer = option.value;
          this.makeAlgoList();
          this.toggleEnableAlgoSelect(true);
        }
      }
    } else {
      options[0].selected = true;
      this.toggleEnableAlgoSelect(false);
      super.toggleNavBtnEnable('finish', false);
    }
  }

  containerChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    selectedContainer = event.target.options[event.target.selectedIndex].value;
    sessionStorage.setItem('algorithm-container', selectedContainer);
    this.removeAlgoData();
    this.toggleEnableAlgoSelect(true);
    this.makeAlgoList();
  }

  makeAlgoList() {
    const selectContainer = this.context.querySelector('select#container');

    if (selectedContainer === null) {
      selectedContainer = selectContainer.options[selectContainer.selectedIndex].value;
    }

    if (!(selectedContainer === 'none')) {
      const supervised = allAlgos.filter(
        algo => algo.type === 'supervised' && algo.container === selectedContainer
      );
      const unsupervised = allAlgos.filter(
        algo => algo.type === 'unsupervised' && algo.container === selectedContainer
      );

      supervisedAlgos = supervised;
      unsupervisedAlgos = unsupervised;

      this.buildAlgoList('#supervised-group');
      this.buildAlgoList('#unsupervised-group');
    }
  }

  buildAlgoList(id) {
    const algos = id.includes('unsupervised') ? unsupervisedAlgos : supervisedAlgos;

    const optGroup = this.context.querySelector(id);
    optGroup.innerHTML = algoListTemplate({
      algos: algos
    });
  }

  toggleEnableAlgoSelect(enable) {
    if (enable) {
      if (algoSelect.parentNode.classList.contains('disabled')) {
        algoSelect.parentNode.classList.remove('disabled');
      }

      algoSelect.removeAttribute('disabled');
    } else {
      if (!algoSelect.parentNode.classList.contains('disabled')) {
        algoSelect.parentNode.classList.add('disabled');
      }

      algoSelect.setAttribute('disabled', 'disabled');
    }
  }

  initAlgoSelect() {
    const storedValue = sessionStorage.getItem('algorithm-name');
    const options = algoSelect.options;
    let selected;
    if (storedValue) {
      for (let i = 1; i < options.length; ++i) {
        const option = options[i];
        const algo = this.getAlgorithmById(option.dataset.algo);
        if (storedValue === algo.slug) {
          selected = algo;
          option.selected = true;
        }
      }
      super.toggleNavBtnEnable('finish', true);
    } else {
      options[0].selected = true;
      super.toggleNavBtnEnable('finish', false);
    }
    if (!(selected === undefined)) {
      selectedAlgo = selected;
      this.applyParametersConfig(selected.config);
    }
  }

  algoChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const confParamsStore = Store.get('conf-params');

    if (!(confParamsStore === undefined)) {
      Store.remove('conf-params');
    }

    const select = event.target;
    const id = select.options[select.selectedIndex].dataset.algo;
    const value = select.options[select.selectedIndex].value;

    selectedAlgo = this.getAlgorithmById(id);
    sessionStorage.setItem('algorithm-name', value);

    super.toggleNavBtnEnable('finish', true);
    this.applyParametersConfig(selectedAlgo.config);
  }

  getAlgorithmById(id) {
    if (supervisedAlgos === undefined && unsupervisedAlgos === undefined) {
      throw new Error('Empty data');
    }

    let res = supervisedAlgos.filter(algo => algo._id === id)[0];

    if (res === undefined) {
      res = unsupervisedAlgos.filter(algo => algo._id === id)[0];

      if (res === undefined) {
        return null;
      }
    }

    return res;
  }

  applyParametersConfig(config) {
    const container = this.context.querySelector('.params-container');

    container.innerHTML = paramsTemplate({
      config: null,
      algo: null,
      loading: true
    });

    if (!container.classList.contains('loading')) {
      container.classList.add('loading');
    }

    if (config === null) {
      if (!container.classList.contains('no-conf')) {
        if (container.classList.contains('loading')) {
          container.classList.remove('loading');
        }
        container.classList.add('no-conf');
      }
      container.innerHTML = paramsTemplate({
        config: config,
        algo: selectedAlgo,
        loading: false
      });
      super.toggleNavBtnEnable('finish', false);
    } else {
      if (container.classList.contains('no-conf')) {
        container.classList.remove('no-conf');
      }

      const confParamsStore = Store.get('conf-params');

      if (!(confParamsStore === undefined)) {
        const params = new AlgoParameters(confParamsStore.data, container);
        params.build(paramsTemplate);
      } else {
        getAlgoParamsConf(
          `/algos/params/conf/${config}?container=${selectedAlgo.container}`,
          this.context
        ).then(response => {
          if (response) {
            Store.add({
              id: 'conf-params',
              data: response.data
            });
            const params = new AlgoParameters(response.data, container);
            params.build(paramsTemplate);
          }
        });
      }

      super.toggleNavBtnEnable('finish', true);
    }
  }

  removeAlgoData() {
    const storedValue = sessionStorage.getItem('algorithm-name');
    if (!(storedValue === undefined)) {
      sessionStorage.removeItem('algorithm-name');
      algoSelect.options[0].selected = true;
    }

    const JSONValues = JSON.parse(JSON.stringify(sessionStorage));
    // eslint-disable-next-line array-callback-return
    Object.keys(JSONValues).filter(key => {
      if (/^algo-param-/.test(key)) {
        sessionStorage.removeItem(key);
      }
    });

    const paramsContainer = this.context.querySelector('.params-container');

    paramsContainer.setAttribute('class', 'params-container');
    paramsContainer.innerHTML = '';

    super.toggleNavBtnEnable('finish', false);
  }

  make() {
    this.renderView(false);

    const isOnlyProcess = sessionStorage.getItem('only-learning');
    if (isOnlyProcess) {
      super.initNavBtn('previous', { label: 'data-source', Task: DataSource });
      super.toggleNavItemsEnabled(['data-source'], true);
      super.toggleNavItemsEnabled(['windowing', 'feature-extraction'], false);
    } else {
      super.initNavBtn('previous', { label: 'features', Task: Features });
      super.toggleNavItemsEnabled(
        ['data-source', 'windowing', 'feature-extraction'],
        true
      );
    }

    super.initFinishBtn(() => {
      if (super.validateAlgoParamsFields()) {
        super.finishBtnHandler();
      } else {
        ModalHelper.error(
          'Please select an algorithm or check that all required parameters does not have missing values.'
        );
      }
    });

    this.makeAlgoList();

    containerSelect = this.context.querySelector('select#container');
    algoSelect = this.context.querySelector('select#algo');

    this.initContainerSelect();
    containerSelect.addEventListener(
      'change',
      this.containerChangeListener.bind(this),
      false
    );

    this.initAlgoSelect();
    algoSelect.addEventListener('change', this.algoChangeListener.bind(this), false);

    const downloadBtn = this.context.querySelector('#download-config');

    downloadBtn.addEventListener(
      'click',
      super.downloadBtnClickListener.bind(this),
      false
    );
  }
}

async function getAlgorithms(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function getAlgoParamsConf(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

export default Learning;
