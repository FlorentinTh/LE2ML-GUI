import Component from '@Component';
import dataManagementTemplate from './data-management.hbs';
import fileListTemplate from './file-list.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import { Filters, FilterType } from '@Filters';
import Search from '@Search';

let fileModels;
let fileDatasets;
let fileFilters;

class DataManagement extends Component {
  constructor(reload = false, fileType = 'models', context = null) {
    super(context);
    this.isFiltersDisabled = false;
    this.reload = reload;
    this.fileType = fileType;
    this.title = 'Manage Data Files';
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('data');
    this.initData();
  }

  initData() {
    const fileModelStore = Store.get('file-models');
    const fileDatasetStore = Store.get('file-datasets');

    if (this.reload || (fileModelStore === undefined && fileDatasetStore === undefined)) {
      this.initView(true);
      getFiles('/files?type=models', this.context).then(response => {
        if (response) {
          Store.add({
            id: 'file-models',
            data: response.data
          });

          fileModels = response.data;

          getFiles('/files?type=inputs', this.context).then(response => {
            if (response) {
              Store.add({
                id: 'file-datasets',
                data: response.data
              });

              fileDatasets = response.data;
              this.render();
            }
          });
        }
      });
    } else {
      this.render();
    }
  }

  initView(loading = false) {
    this.context.innerHTML = dataManagementTemplate({
      title: this.title,
      totalModel: fileModels === undefined ? 0 : fileModels.length,
      totalDataset: fileDatasets === undefined ? 0 : fileDatasets.length
    });

    const filters = this.context.querySelectorAll('.filters span.filter');
    fileFilters = new Filters(filters, FilterType.FILES);

    if (loading) {
      this.buildFileList(this.fileType, { defaultSort: false, loading: loading });
    }
  }

  fileTypeSwitchHandler(event) {
    event.stopImmediatePropagation();
    if (event.target.checked) {
      const value = event.target.value;
      this.switchFileTypeContent(value);
    }
  }

  buildFileList(value, opts = { defaultSort: true, loading: false }) {
    const container = document.querySelector('.grid-files');

    let files;
    if (opts.loading) {
      files = [];
      container.innerHTML = fileListTemplate({
        files: files,
        loading: opts.loading
      });

      if (!this.isFiltersDisabled) {
        fileFilters.disableFilters(false);
      }
    } else {
      files = value === 'models' ? fileModels : fileDatasets;

      if (this.isFiltersDisabled) {
        this.isFiltersDisabled = false;
        fileFilters.enableFilters();
      }

      if (opts.defaultSort) {
        files = fileFilters.setDefaultSort(files);
      }

      container.innerHTML = fileListTemplate({
        files: files,
        loading: opts.loading
      });
      //   this.setActions(files);

      if (files === undefined || files.length <= 1) {
        this.isFiltersDisabled = true;
        fileFilters.disableFilters();
      }
    }
  }

  switchFileTypeContent(fileType) {
    const search = this.context.querySelector('#search');
    this.fileType = fileType;

    switch (fileType) {
      case 'models':
        if (search.value.trim() !== '') {
          search.value = '';
          const fileModelStore = Store.get('file-models');

          if (!(fileModelStore === undefined)) {
            Store.remove('file-models');
          }
          // eslint-disable-next-line no-new
          new DataManagement(true, 'models');
        }

        Search.addSearchListener(fileModels, ['filename'], data => {
          fileModels = data;
          this.buildFileList('models');
        });
        break;
      case 'datasets':
        if (search.value.trim() !== '') {
          search.value = '';

          const fileDatasetStore = Store.get('file-datasets');

          if (!(fileDatasetStore === undefined)) {
            Store.remove('file-datasets');
          }
          // eslint-disable-next-line no-new
          new DataManagement(true, 'datasets');
        }

        Search.addSearchListener(fileDatasets, ['filename'], data => {
          fileDatasets = data;
          this.buildFileList('datasets');
        });
        break;
    }

    this.buildFileList(fileType);
  }

  render() {
    this.initView();
    fileFilters.addFilterClickListener(() => {
      this.buildFileList(this.fileType);
    });

    const fileTypeSwitchInputs = this.context.querySelectorAll('.switch-group input');

    for (let i = 0; i < fileTypeSwitchInputs.length; ++i) {
      const radio = fileTypeSwitchInputs[i];

      if (radio.value === this.fileType) {
        radio.setAttribute('checked', true);
      }

      radio.addEventListener('change', this.fileTypeSwitchHandler.bind(this), false);

      if (radio.checked) {
        this.switchFileTypeContent(radio.value);
      }
    }
  }
}

async function getFiles(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context, true);
  }
}

export default DataManagement;
