import learningTemplate from './learning.hbs';
import algoListTemplate from './algo-list.hbs';
import paramsTemplate from './params.hbs';
import Task from '../Task';
import Features from '../features/Features';
import StringHelper from '@StringHelper';
import APIHelper from '@APIHelper';
import Store from '@Store';
import axios from 'axios';
import AlgoParameters from '@AlgoParameters';

let process;
let algoSelect;
let supervisedAlgos;
let unsupervisedAlgos;
let selectedAlgo;

class Learning extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.initData();
  }

  initData() {
    const supervisedStore = Store.get('supervised-algos');
    const unsupervisedStore = Store.get('unsupervised-algos');

    if (supervisedStore === undefined && unsupervisedStore === undefined) {
      this.renderView(true);

      getAlgorithms('/algos', this.context).then(response => {
        if (response) {
          const algos = response.data.algorithms;

          const supervised = algos.filter(algo => algo.type === 'supervised');
          Store.add({
            id: 'supervised-algos',
            data: supervised
          });

          supervisedAlgos = supervised;

          const unsupervised = algos.filter(algo => algo.type === 'unsupervised');
          Store.add({
            id: 'unsupervised-algos',
            data: unsupervised
          });
          unsupervisedAlgos = unsupervised;

          this.make();
        }
      });
    } else {
      supervisedAlgos = supervisedStore.data;
      unsupervisedAlgos = unsupervisedStore.data;
      this.make();
    }
  }

  renderView(loading = true) {
    process = sessionStorage.getItem('process-type');

    this.context.innerHTML = learningTemplate({
      title: StringHelper.capitalizeFirst(process) + 'ing Process'
    });

    this.buildAlgoList('#supervised-group', loading);
    this.buildAlgoList('#unsupervised-group', loading);
  }

  buildAlgoList(id, loading = true) {
    const algos = id.includes('unsupervised') ? unsupervisedAlgos : supervisedAlgos;

    const optGroup = this.context.querySelector(id);
    optGroup.innerHTML = algoListTemplate({
      algos: algos,
      loading: loading
    });
  }

  algoChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const confParamsStore = Store.get('conf-params');

    if (!(confParamsStore === undefined)) {
      Store.remove('conf-params');
    }

    const select = event.target;
    const selected = select.options[select.selectedIndex].value;

    sessionStorage.setItem('algorithm-name', selected);

    const JSONValues = JSON.parse(JSON.stringify(sessionStorage));

    Object.keys(JSONValues).filter(key => {
      if (/^algo-param-/.test(key)) {
        sessionStorage.removeItem(key);
      }
    });

    const containerInput = this.context.querySelector('#algo-container');

    selectedAlgo = this.getAlgorithmBylabel(selected);
    containerInput.value = selectedAlgo.container;

    this.applyParametersConfig(selectedAlgo.config);
  }

  initAlgoSelect() {
    const storedValue = sessionStorage.getItem('algorithm-name');
    const options = algoSelect.options;

    let selected;
    for (let i = 1; i < options.length; ++i) {
      const option = options[i];
      if (storedValue && storedValue === option.value) {
        selected = option.value;
        option.selected = true;
      }
    }

    const containerInput = this.context.querySelector('#algo-container');

    if (!(selected === undefined)) {
      selectedAlgo = this.getAlgorithmBylabel(selected);
      containerInput.value = selectedAlgo.container;
      this.applyParametersConfig(selectedAlgo.config);
    } else {
      containerInput.value = 'None';
    }

    if (!storedValue) {
      options[0].selected = true;
    }
  }

  getAlgorithmBylabel(slug) {
    if (supervisedAlgos === undefined && unsupervisedAlgos === undefined) {
      throw new Error('Empty data');
    }

    let res = supervisedAlgos.filter(algo => algo.slug === slug)[0];

    if (res === undefined) {
      res = unsupervisedAlgos.filter(algo => algo.slug === slug)[0];

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
    } else {
      if (container.classList.contains('no-conf')) {
        container.classList.remove('no-conf');
      }

      const confParamsStore = Store.get('conf-params');

      if (!(confParamsStore === undefined)) {
        const params = new AlgoParameters(confParamsStore.data, container);
        params.build(paramsTemplate);
      } else {
        getAlgoParamsConf('/algos/params/conf/' + config, this.context).then(response => {
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
    }
  }

  make() {
    this.renderView(false);

    super.initNavBtn('previous', { label: 'feature-extraction', Task: Features });

    algoSelect = this.context.querySelector('select#algo');
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
