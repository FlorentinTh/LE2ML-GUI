import Component from '@Component';
import windowingManagementTemplate from './windowing-management.hbs';
import funcListTemplate from './func-list.hbs';
import formFuncTemplate from './form-func.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import StringHelper from '@StringHelper';
import SortHelper from '@SortHelper';

let allWindowFunctions;
let filters;
let filerClickListener;

class WindowingManagement extends Component {
  constructor(reload = false, context = null) {
    super(context);
    this.title = 'Manage Window Functions';
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
    const funcStore = Store.get('window-functions');

    if (this.reload || funcStore === undefined) {
      this.initView(true);
      getFunctions('/windows', this.context).then(response => {
        if (response) {
          Store.add({
            id: 'window-functions',
            data: response.data
          });
          allWindowFunctions = response.data;
          this.render();
        }
      });
    } else {
      this.render();
    }
  }

  initView(loading = false) {
    const total = allWindowFunctions === undefined ? 0 : allWindowFunctions.total;
    this.context.innerHTML = windowingManagementTemplate({
      title: this.title,
      total: total
    });

    filters = this.context.querySelectorAll('.filters span.filter');

    if (loading) {
      this.buildFuncList('#functions', { defaultSort: false, loading: loading });
    }
  }

  render() {
    this.initView();

    this.addFilterClickListener();
    this.buildFuncList('#functions');

    const addBtn = this.context.querySelector('#add');
    addBtn.addEventListener('click', this.addBtnListener.bind(this), false);

    super.addSearchListener(allWindowFunctions.functions, ['slug'], data => {
      allWindowFunctions.functions = data;
      this.buildFuncList('#functions');
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
        this.buildFuncList('#functions');
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

  buildFuncList(id, opts = { defaultSort: true, loading: false }) {
    const container = document.querySelector(id + ' > .grid-functions');

    let windowFunctions;
    if (opts.loading) {
      windowFunctions = [];
      container.innerHTML = funcListTemplate({
        functions: windowFunctions,
        loading: opts.loading
      });

      if (!this.isFiltersDisabled) {
        this.disableFilters(false);
      }
    } else {
      windowFunctions = allWindowFunctions.functions;

      if (this.isFiltersDisabled) {
        this.isFiltersDisabled = false;
        this.enableFilters();
      }

      if (opts.defaultSort) {
        windowFunctions = this.setDefaultSort(id, windowFunctions);
      }

      container.innerHTML = funcListTemplate({
        functions: windowFunctions,
        loading: opts.loading
      });

      this.setActions(windowFunctions);

      if (windowFunctions.length <= 1) {
        this.isFiltersDisabled = true;
        this.disableFilters();
      }
    }
  }

  removeTaskWindowTypeStore() {
    const windowTypeStored = Store.get('window-type');
    if (!(windowTypeStored === undefined)) {
      Store.remove('window-type');
    }
  }

  addBtnListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const content = formFuncTemplate();
    const elems = ['label', 'enabled', 'container'];

    ModalHelper.edit('Add a new window function', content, 'add', elems).then(result => {
      if (result.value) {
        const data = {
          label: result.value.label.toLowerCase(),
          container: StringHelper.toSlug(result.value.container, '-'),
          enabled: result.value.enabled === 'true'
        };

        addFunction('/windows', data, this.context).then(response => {
          if (response) {
            ModalHelper.notification(
              'success',
              response.data.label + ' successfully created.'
            );
            this.removeTaskWindowTypeStore();
            // eslint-disable-next-line no-new
            new WindowingManagement(true);
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

  setActions(windowFunctions) {
    this.editAction(windowFunctions);
    this.grantOrRevokeAction(windowFunctions);
    this.deleteAction(windowFunctions);
  }

  editAction(windowFunctions) {
    const buttons = this.context.querySelectorAll('button#edit');

    buttons.forEach(button => {
      const funcId = button.closest('#func-infos').dataset.func;
      const func = windowFunctions.find(elem => elem._id === funcId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const content = formFuncTemplate({
          label: func.label.toLowerCase(),
          container: StringHelper.toSlug(func.container, '-'),
          enabled: func.enabled
        });

        const elems = ['label', 'container', 'enabled'];
        ModalHelper.edit('Edit window function', content, 'update', elems).then(
          result => {
            if (result.value) {
              const data = result.value;
              updateFunction('/windows/' + funcId, data, this.context).then(response => {
                if (response) {
                  ModalHelper.notification(
                    'success',
                    response.data.function.label + ' successfully updated.'
                  );
                  this.removeTaskWindowTypeStore();
                  // eslint-disable-next-line no-new
                  new WindowingManagement(true);
                }
              });
            }
          }
        );

        const labelInput = document.querySelector('input#label');
        const containerInput = document.querySelector('input#container');

        this.inputListener(labelInput);
        this.inputListener(containerInput);
      });
    });
  }

  grantOrRevokeAction(windowFunctions) {
    const buttons = this.context.querySelectorAll('button#state');

    buttons.forEach(button => {
      const funcId = button.closest('#func-infos').dataset.func;
      const func = windowFunctions.find(elem => elem._id === funcId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const data = {
          label: func.label,
          container: func.container,
          enabled: !func.enabled
        };

        const askTitle = func.enabled
          ? 'Disable window function'
          : 'Enable window function';

        const askMessage = func.enabled
          ? func.label + ' will be disabled.'
          : func.label + ' will be enabled.';

        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            const confirmMessage = func.enabled
              ? func.label + ' is now disabled.'
              : func.label + ' is now enabled.';
            updateState('/windows/state/' + funcId, data, this.context).then(response => {
              if (response) {
                ModalHelper.notification('success', confirmMessage);
                this.removeTaskWindowTypeStore();
                // eslint-disable-next-line no-new
                new WindowingManagement(true);
              }
            });
          }
        });
      });
    });
  }

  deleteAction(windowFunctions) {
    const buttons = this.context.querySelectorAll('button#delete');
    buttons.forEach(button => {
      const funcId = button.closest('#func-infos').dataset.func;
      const func = windowFunctions.find(elem => elem._id === funcId);
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const askTitle = 'Delete ' + func.label + ' ?';
        const askMessage = func.label + ' will be permanently deleted.';

        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            deleteFunction('/windows/' + funcId, this.context).then(response => {
              if (response) {
                ModalHelper.notification(
                  'success',
                  func.label + ' successfully deleted.'
                );
                this.removeTaskWindowTypeStore();
                // eslint-disable-next-line no-new
                new WindowingManagement(true);
              }
            });
          }
        });
      });
    });
  }
}

async function getFunctions(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context, true);
  }
}

async function addFunction(url, data, context) {
  try {
    const response = await axios.put(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

async function updateFunction(url, data, context) {
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

async function deleteFunction(url, context) {
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

export default WindowingManagement;
