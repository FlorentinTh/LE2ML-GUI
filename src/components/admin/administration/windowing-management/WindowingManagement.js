import Component from '@Component';
import windowingManagementTemplate from './windowing-management.hbs';
import funcListTemplate from './func-list.hbs';
import formFuncTemplate from './form-func.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import StringHelper from '@StringHelper';
import { Filters, FilterType } from '@Filters';
import Search from '@Search';

let allWindowFunctions;
let windowFuncFilters;

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

    const filters = this.context.querySelectorAll('.filters span.filter');
    windowFuncFilters = new Filters(filters, FilterType.DEFAULT);

    if (loading) {
      this.buildFuncList('#functions', { defaultSort: false, loading: loading });
    }
  }

  render() {
    this.initView();

    windowFuncFilters.addFilterClickListener(() => {
      this.buildFuncList('#functions');
    });
    this.buildFuncList('#functions');

    const addBtn = this.context.querySelector('#add');
    addBtn.addEventListener('click', this.addBtnListener.bind(this), false);

    Search.addSearchListener(allWindowFunctions.functions, ['slug'], data => {
      allWindowFunctions.functions = data;
      this.buildFuncList('#functions');
    });
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
        windowFuncFilters.disableFilters(false);
      }
    } else {
      windowFunctions = allWindowFunctions.functions;

      if (this.isFiltersDisabled) {
        this.isFiltersDisabled = false;
        windowFuncFilters.enableFilters();
      }

      if (opts.defaultSort) {
        windowFunctions = windowFuncFilters.setDefaultSort(windowFunctions);
      }

      container.innerHTML = funcListTemplate({
        functions: windowFunctions,
        loading: opts.loading
      });

      this.setActions(windowFunctions);

      if (windowFunctions === undefined || windowFunctions.length <= 1) {
        this.isFiltersDisabled = true;
        windowFuncFilters.disableFilters();
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
