import learningTemplate from './learning.hbs';
import algoListTemplate from './algo-list.hbs';
import Task from '../Task';
import Features from '../features/Features';
import StringHelper from '@StringHelper';
import APIHelper from '@APIHelper';
import FileHelper from '@FileHelper';
import Store from '@Store';
import axios from 'axios';

let process;
let algoSelect;
let supervisedAlgos;
let unsupervisedAlgos;

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

    const select = event.target;
    const selected = select.options[select.selectedIndex].value;

    sessionStorage.setItem('algorithm', selected);
  }

  initAlgoSelect() {
    const storedValue = sessionStorage.getItem('algorithm');
    const options = algoSelect.options;

    for (let i = 1; i < options.length; ++i) {
      const option = options[i];
      if (storedValue && storedValue === option.value) {
        option.selected = true;
      }
    }

    if (!storedValue) {
      options[0].selected = true;
    }
  }

  make() {
    this.renderView(false);

    super.initNavBtn('previous', { label: 'feature-extraction', Task: Features });

    algoSelect = this.context.querySelector('select#algo');
    this.initAlgoSelect();
    algoSelect.addEventListener('change', this.algoChangeListener.bind(this), false);

    /**
     * TODO
     * Make session storage a JSON File
     * API CALL
     * RECEIVE YML
     * INIT DOWNLOAD
     */
    // const downloadConfBtn = this.context.querySelector('#download-config');
    // FileHelper.downloadAsJson(downloadConfBtn, { test: 'test', prout: 'prout' }, 'test');
  }
}

async function getAlgorithms(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context, true);
  }
}

export default Learning;
