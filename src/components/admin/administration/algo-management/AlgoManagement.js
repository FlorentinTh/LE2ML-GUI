import Component from '@Component';
import algoManagementTemplate from './algo-management.hbs';
import algoListTemplate from './algo-list.hbs';
import formAlgoTemplate from './form-algo.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import StringHelper from '@StringHelper';
import { Filters, FilterType } from '@Filters';
import Search from '@Search';

let allAlgorithms;
let algoFilters;

class AlgoManagement extends Component {
  constructor(reload = false, context = null) {
    super(context);
    this.title = 'Manage Algorithms';
    this.isFiltersDisabled = false;
    this.reload = reload;
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');
    this.initData();
  }

  initData() {
    const algoStore = Store.get('algorithms');

    if (this.reload || algoStore === undefined) {
      this.initView(true);
      getAlgorithms('/algos', this.context).then(response => {
        if (response) {
          Store.add({
            id: 'algorithms',
            data: response.data
          });
          allAlgorithms = response.data;
          this.render();
        }
      });
    } else {
      this.render();
    }
  }

  initView(loading = false) {
    const total = allAlgorithms === undefined ? 0 : allAlgorithms.total;
    this.context.innerHTML = algoManagementTemplate({
      title: this.title,
      total: total
    });

    const filters = this.context.querySelectorAll('.filters span.filter');
    algoFilters = new Filters(filters, FilterType.DEFAULT);

    if (loading) {
      this.buildAlgoList('#algorithms', { defaultSort: false, loading: loading });
    }
  }

  render() {
    this.initView();

    algoFilters.addFilterClickListener(() => {
      this.buildAlgoList('#algorithms');
    });
    this.buildAlgoList('#algorithms');

    const addBtn = this.context.querySelector('#add');
    addBtn.addEventListener('click', this.addBtnListener.bind(this), false);

    Search.addSearchListener(allAlgorithms.algorithms, ['slug'], data => {
      allAlgorithms.algorithms = data;
      this.buildAlgoList('#algorithms');
    });
  }

  buildAlgoList(id, opts = { defaultSort: true, loading: false }) {
    const container = document.querySelector(id + ' > .grid-algos');

    let algorithms;
    if (opts.loading) {
      algorithms = [];
      container.innerHTML = algoListTemplate({
        algorithms: algorithms,
        loading: opts.loading
      });

      if (!this.isFiltersDisabled) {
        algoFilters.disableFilters(false);
      }
    } else {
      algorithms = allAlgorithms.algorithms;

      if (this.isFiltersDisabled) {
        this.isFiltersDisabled = false;
        algoFilters.enableFilters();
      }

      if (opts.defaultSort) {
        algorithms = algoFilters.setDefaultSort(algorithms);
      }

      container.innerHTML = algoListTemplate({
        algorithms: algorithms,
        loading: opts.loading
      });

      this.setActions(algorithms);

      if (algorithms === undefined || algorithms.length <= 1) {
        this.isFiltersDisabled = true;
        algoFilters.disableFilters();
      }
    }
  }

  removeTaskAlgoListStore() {
    const supervisedAlgoStored = Store.get('supervised-algos');
    const unsupervisedAlgoStored = Store.get('unsupervised-algos');

    if (!(supervisedAlgoStored === undefined)) {
      Store.remove('supervised-algos');
    }

    if (!(unsupervisedAlgoStored === undefined)) {
      Store.remove('unsupervised-algos');
    }
  }

  addBtnListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const content = formAlgoTemplate();
    const elems = ['label', 'type', 'enabled', 'container'];

    ModalHelper.edit('Add a new algorithm', content, 'add', elems).then(result => {
      if (result.value) {
        const data = {
          label: result.value.label.toLowerCase(),
          type: result.value.type,
          container: StringHelper.toSlug(result.value.container, '-'),
          enabled: result.value.enabled === 'true'
        };

        addAlgo('/algos', data, this.context).then(response => {
          if (response) {
            ModalHelper.notification(
              'success',
              response.data.label + ' successfully created.'
            );
            this.removeTaskAlgoListStore();
            // eslint-disable-next-line no-new
            new AlgoManagement(true);
          }
        });
      }
    });

    const labelInput = document.querySelector('input#label');
    const containerInput = document.querySelector('input#container');

    this.inputListener(labelInput);
    this.inputListener(containerInput);
  }

  inputListener(input) {
    input.addEventListener(
      'focusout',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        switch (input.id) {
          case 'label':
            input.value = input.value.toLowerCase();
            break;
          case 'container':
            input.value = StringHelper.toSlug(input.value, '-');
            break;
        }
      },
      false
    );
  }

  setActions(algos) {
    this.editAction(algos);
    this.grantOrRevokeAction(algos);
    this.deleteAction(algos);
  }

  editAction(algos) {
    const buttons = this.context.querySelectorAll('button#edit');

    buttons.forEach(button => {
      const algoId = button.closest('#algo-infos').dataset.algo;
      const algo = algos.find(elem => elem._id === algoId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const content = formAlgoTemplate({
          label: algo.label.toLowerCase(),
          type: algo.type,
          container: StringHelper.toSlug(algo.container, '-'),
          enabled: algo.enabled
        });

        const elems = ['label', 'type', 'container', 'enabled'];
        ModalHelper.edit('Edit algorithm', content, 'update', elems).then(result => {
          if (result.value) {
            const data = result.value;
            updateAlgo('/algos/' + algoId, data, this.context).then(response => {
              if (response) {
                ModalHelper.notification(
                  'success',
                  response.data.algo.label + ' successfully updated.'
                );
                this.removeTaskAlgoListStore();
                // eslint-disable-next-line no-new
                new AlgoManagement(true);
              }
            });
          }
        });

        const labelInput = document.querySelector('input#label');
        const containerInput = document.querySelector('input#container');

        this.inputListener(labelInput);
        this.inputListener(containerInput);
      });
    });
  }

  grantOrRevokeAction(algos) {
    const buttons = this.context.querySelectorAll('button#state');

    buttons.forEach(button => {
      const algoId = button.closest('#algo-infos').dataset.algo;
      const algo = algos.find(elem => elem._id === algoId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const data = {
          label: algo.label,
          type: algo.type,
          container: algo.container,
          enabled: !algo.enabled
        };

        const askTitle = algo.enabled ? 'Disable algorithm' : 'Enable aglorithm';

        const askMessage = algo.enabled
          ? algo.label + ' will be disabled.'
          : algo.label + ' will be enabled.';

        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            const confirmMessage = algo.enabled
              ? algo.label + ' is now disabled.'
              : algo.label + ' is now enabled.';
            updateState('/algos/state/' + algoId, data, this.context).then(response => {
              if (response) {
                ModalHelper.notification('success', confirmMessage);
                this.removeTaskAlgoListStore();
                // eslint-disable-next-line no-new
                new AlgoManagement(true);
              }
            });
          }
        });
      });
    });
  }

  deleteAction(algos) {
    const buttons = this.context.querySelectorAll('button#delete');
    buttons.forEach(button => {
      const algoId = button.closest('#algo-infos').dataset.algo;
      const algo = algos.find(elem => elem._id === algoId);
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const askTitle = 'Delete ' + algo.label + ' ?';
        const askMessage = algo.label + ' will be permanently deleted.';

        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            deleteAlgo('/algos/' + algoId, this.context).then(response => {
              if (response) {
                ModalHelper.notification(
                  'success',
                  algo.label + ' successfully deleted.'
                );
                this.removeTaskAlgoListStore();
                // eslint-disable-next-line no-new
                new AlgoManagement(true);
              }
            });
          }
        });
      });
    });
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

async function addAlgo(url, data, context) {
  try {
    const response = await axios.put(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

async function updateAlgo(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

async function updateState(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

async function deleteAlgo(url, context) {
  try {
    const response = await axios.delete(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    if (error) {
      APIHelper.errorsHandler(error, context);
    }
  }
}

export default AlgoManagement;
