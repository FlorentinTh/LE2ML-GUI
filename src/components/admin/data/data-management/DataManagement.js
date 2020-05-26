import Component from '@Component';
import dataManagementTemplate from './data-management.hbs';
import fileListTemplate from './file-list.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import SortHelper from '@SortHelper';

let fileModels;
let fileDatasets;
let filters;
let filerClickListener;

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

    filters = this.context.querySelectorAll('.filters span.filter');

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
        this.disableFilters(false);
      }
    } else {
      files = value === 'models' ? fileModels : fileDatasets;

      if (this.isFiltersDisabled) {
        this.isFiltersDisabled = false;
        this.enableFilters();
      }
      if (opts.defaultSort) {
        files = this.setDefaultSort('#files', files);
      }

      container.innerHTML = fileListTemplate({
        files: files,
        loading: opts.loading
      });
      //   this.setActions(users);

      if (files.length <= 1) {
        this.isFiltersDisabled = true;
        this.disableFilters();
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

        super.addSearchListener(fileModels, ['filename'], data => {
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

        super.addSearchListener(fileDatasets, ['filename'], data => {
          fileDatasets = data;
          this.buildFileList('datasets');
        });
        break;
    }

    this.buildFileList(fileType);
  }

  render() {
    this.initView();
    this.addFilterClickListener();

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
        this.buildFileList(this.fileType);
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
      return SortHelper.sortArrayAlpha(data, 'filename', order);
    } else if (filter === 'size-sort') {
      return SortHelper.sortArrayNumber(data, 'size', order);
    } else if (filter === 'creation-sort') {
      return SortHelper.sortArrayByDate(data, 'dateCreated', order);
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
