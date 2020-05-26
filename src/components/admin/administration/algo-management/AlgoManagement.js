import Component from '@Component';
import algoManagementTemplate from './algo-management.hbs';
import algoListTemplate from './algo-list.hbs';
import formAlgoTemplate from './form-algo.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import StringHelper from '@StringHelper';
import SortHelper from '@SortHelper';

let allAlgorithms;
let filters;
let filerClickListener;

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

    filters = this.context.querySelectorAll('.filters span.filter');

    if (loading) {
      this.buildAlgoList('#algorithms', { defaultSort: false, loading: loading });
    }
  }

  render() {
    this.initView();

    this.addFilterClickListener();
    this.buildAlgoList('#algorithms');

    const addBtn = this.context.querySelector('#add');
    addBtn.addEventListener('click', this.addBtnListener.bind(this), false);

    super.addSearchListener(allAlgorithms.algorithms, ['slug'], data => {
      allAlgorithms.algorithms = data;
      this.buildAlgoList('#algorithms');
    });
  }

  enableFilters() {
    filters[0].classList.add('filter-active');

    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];

      if (filter.classList.contains('filter-disabled')) {
        filter.classList.remove('filter-disabled');
      }
      filter.addEventListener(...filerClickListener);
    }
  }

  disableFilters(isEventAdded = true) {
    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];
      if (filter.classList.contains('filter-active')) {
        filter.classList.remove('filter-active');
      }
      filter.classList.add('filter-disabled');
      if (isEventAdded) {
        filter.removeEventListener(...filerClickListener);
      }
    }
  }

  addFilterClickListener() {
    filerClickListener = [
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const filter =
          event.target.tagName === 'SPAN' ? event.target : event.target.parentNode;

        if (filter.className.includes('active')) {
          const sortIcon = filter.children[1].className;
          let className = null;
          if (sortIcon.includes('up')) {
            className = sortIcon.replace('up', 'down');
            filter.dataset.order = 'desc';
          } else {
            className = sortIcon.replace('down', 'up');
            filter.dataset.order = 'asc';
          }
          filter.children[1].className = className;
        } else {
          filters.forEach(fil => {
            if (fil.className.includes('active')) {
              const className = fil.className;
              fil.className = className
                .split(' ')
                .filter(name => name !== 'filter-active');
            }
          });
          const className = filter.className;
          filter.className = className + ' filter-active';
        }
        this.buildAlgoList('#algorithms');
      },
      true
    ];

    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];
      filter.addEventListener(...filerClickListener);
    }
  }

  setDefaultSort(id, data) {
    const elem = this.context.querySelector(id);
    const filters = elem.querySelectorAll('span.filter');

    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];
      if (filter.className.includes('active')) {
        return this.sort(filter.dataset.action, filter.dataset.order, data);
      }
    }
  }

  sort(filter, order, data) {
    if (filter === 'alpha-sort') {
      return SortHelper.sortArrayAlpha(data, 'label', order);
    } else if (filter === 'state-sort') {
      return SortHelper.sortArrayBoolean(data, 'enabled', order);
    } else if (filter === 'container-sort') {
      return SortHelper.sortArrayAlpha(data, 'container', order);
    }
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
        this.disableFilters(false);
      }
    } else {
      algorithms = allAlgorithms.algorithms;

      if (this.isFiltersDisabled) {
        this.isFiltersDisabled = false;
        this.enableFilters();
      }

      if (opts.defaultSort) {
        algorithms = this.setDefaultSort(id, algorithms);
      }

      container.innerHTML = algoListTemplate({
        algorithms: algorithms,
        loading: opts.loading
      });

      this.setActions(algorithms);

      if (algorithms.length <= 1) {
        this.isFiltersDisabled = true;
        this.disableFilters();
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
