import Component from '@Component';
import sourceManagementTemplate from './source-management.hbs';
import sourceListTemplate from './source-list.hbs';
import formSourceTemplate from './form-source.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';

let allSources;

class SourceManagement extends Component {
  constructor(reload = false, context = null) {
    super(context);
    this.title = 'Manage Data Sources';
    this.reload = reload;
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');
    this.initData();
  }

  initData() {
    const storedSources = Store.get('data-sources');

    if (this.reload || storedSources === undefined) {
      this.initView(true);
      getSources('/sources', this.context).then(response => {
        if (response) {
          Store.add({
            id: 'data-sources',
            data: response.data
          });
          allSources = response.data;
          this.render();
        }
      });
    } else {
      this.render();
    }
  }

  initView(loading = false) {
    const total = allSources === undefined ? 0 : allSources.total;
    this.context.innerHTML = sourceManagementTemplate({
      title: this.title,
      total: total
    });

    if (loading) {
      this.buildSourceList('#sources', { loading: loading });
    }
  }

  render() {
    this.initView();
    this.buildSourceList('#sources');

    const addBtn = this.context.querySelector('#add');
    addBtn.addEventListener('click', this.addBtnListener.bind(this), false);
  }

  buildSourceList(id, opts = { loading: false }) {
    const container = document.querySelector(id + ' > .grid-sources');

    let dataSources;
    if (opts.loading) {
      dataSources = [];
      container.innerHTML = sourceListTemplate({
        sources: dataSources,
        loading: opts.loading
      });
    } else {
      dataSources = allSources.sources;

      container.innerHTML = sourceListTemplate({
        sources: dataSources,
        loading: opts.loading
      });

      this.setActions(dataSources);
    }
  }

  removeStoredDataSources() {
    let storedDataSources = Store.get('admin-data-sources');
    if (!(storedDataSources === undefined)) {
      Store.remove('admin-data-sources');
    }

    storedDataSources = Store.get('import-data-sources');
    if (!(storedDataSources === undefined)) {
      Store.remove('import-data-sources');
    }

    storedDataSources = Store.get('data-viz-sources');
    if (!(storedDataSources === undefined)) {
      Store.remove('data-viz-sources');
    }

    storedDataSources = Store.get('files-data-sources');
    if (!(storedDataSources === undefined)) {
      Store.remove('files-data-sources');
    }

    storedDataSources = Store.get('file-atts-data-sources');
    if (!(storedDataSources === undefined)) {
      Store.remove('file-atts-data-sources');
    }

    storedDataSources = Store.get('home-data-sources');
    if (!(storedDataSources === undefined)) {
      Store.remove('home-data-sources');
    }
  }

  addBtnListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const content = formSourceTemplate();
    const elems = ['label', 'enabled', 'editable-files'];

    ModalHelper.edit('Add a new data source', content, 'add', elems).then(result => {
      if (result.value) {
        const data = {
          label: result.value.label.toLowerCase(),
          enabled: result.value.enabled === 'true',
          editableFiles: result.value['editable-files']
        };

        addSource('/sources', data, this.context).then(response => {
          if (response) {
            ModalHelper.notification(
              'success',
              response.data.label + ' successfully created.'
            );
            this.removeStoredDataSources();
            // eslint-disable-next-line no-new
            new SourceManagement(true);
          }
        });
      }
    });

    const labelInput = document.querySelector('input#label');
    this.inputListener(labelInput);
  }

  inputListener(input) {
    input.addEventListener(
      'input',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        switch (input.id) {
          case 'label':
            input.value = input.value.replace(/[^0-9a-zA-Z-]/gi, '-').toLowerCase();
            break;
        }
      },
      false
    );
  }

  setActions(dataSources) {
    this.grantOrRevokeAction(dataSources);
  }

  grantOrRevokeAction(dataSources) {
    const buttons = this.context.querySelectorAll('button#state');

    buttons.forEach(button => {
      const sourceId = button.closest('#source-infos').dataset.source;
      const source = dataSources.find(elem => elem._id === sourceId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const data = {
          enabled: !source.enabled
        };

        const askTitle = source.enabled ? 'Disable data source' : 'Enable data source';
        const askMessage = source.enabled
          ? source.label + ' will be disabled.'
          : source.label + ' will be enabled.';

        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            const confirmMessage = source.enabled
              ? source.label + ' is now disabled.'
              : source.label + ' is now enabled.';

            updateState('/sources/state/' + sourceId, data, this.context).then(
              response => {
                if (response) {
                  ModalHelper.notification('success', confirmMessage);
                  this.removeStoredDataSources();
                  // eslint-disable-next-line no-new
                  new SourceManagement(true);
                }
              }
            );
          }
        });
      });
    });
  }
}

async function getSources(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function addSource(url, data, context) {
  try {
    const response = await axios.put(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function updateState(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

export default SourceManagement;
