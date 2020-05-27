import Component from '@Component';
import dataManagementTemplate from './data-management.hbs';
import fileListTemplate from './file-list.hbs';
import formFileTemplate from './form-file.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import { Filters, FilterType } from '@Filters';
import Search from '@Search';
import ModalHelper from '@ModalHelper';
import StringHelper from '@StringHelper';

let fileModels;
let fileInputs;
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
    const fileModelStore = Store.get('admin-file-models');
    const fileInputStore = Store.get('admin-file-inputs');

    if (this.reload || (fileModelStore === undefined && fileInputStore === undefined)) {
      this.initView(true);
      getFiles('/files?type=models', this.context).then(response => {
        if (response) {
          Store.add({
            id: 'admin-file-models',
            data: response.data
          });

          fileModels = response.data;

          getFiles('/files?type=inputs', this.context).then(response => {
            if (response) {
              Store.add({
                id: 'admin-file-inputs',
                data: response.data
              });

              fileInputs = response.data;
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
      totalInput: fileInputs === undefined ? 0 : fileInputs.length
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
      files = value === 'models' ? fileModels : fileInputs;

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

      this.setActions();

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
          const fileModelStore = Store.get('admin-file-models');

          if (!(fileModelStore === undefined)) {
            Store.remove('admin-file-models');
          }
          // eslint-disable-next-line no-new
          new DataManagement(true, 'models');
        }

        Search.addSearchListener(fileModels, ['filename'], data => {
          fileModels = data;
          this.buildFileList('models');
        });
        break;
      case 'inputs':
        if (search.value.trim() !== '') {
          search.value = '';

          const fileInputStore = Store.get('admin-file-inputs');

          if (!(fileInputStore === undefined)) {
            Store.remove('admin-file-inputs');
          }
          // eslint-disable-next-line no-new
          new DataManagement(true, 'inputs');
        }

        Search.addSearchListener(fileInputs, ['filename'], data => {
          fileInputs = data;
          this.buildFileList('inputs');
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

  setActions() {
    this.renameAction();
    this.deleteAction();
  }

  renameAction() {
    const buttons = this.context.querySelectorAll('button#rename');

    buttons.forEach(button => {
      const item = button.closest('#file-infos');
      const filename = item
        .querySelector('h3')
        .textContent.trim()
        .toLowerCase();

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const content = formFileTemplate({
          filename: filename.split('.')[0]
        });

        const elems = ['filename'];
        ModalHelper.edit('Rename File', content, 'rename', elems).then(result => {
          if (result.value) {
            const data = {
              oldFilename: filename,
              newFilename: result.value.filename + '.' + filename.split('.').pop(),
              fileType: this.fileType
            };
            renameFunction('/files/rename', data, this.context).then(response => {
              if (response) {
                ModalHelper.notification('success', response.message);
                // eslint-disable-next-line no-new
                new DataManagement(true, this.fileType);
              }
            });
          }
        });

        const filenameInput = document.querySelector('input#filename');
        this.inputListener(filenameInput);
      });
    });
  }

  inputListener(input) {
    input.addEventListener(
      'focusout',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        switch (input.id) {
          case 'filename':
            input.value = StringHelper.toSlug(input.value.toLowerCase(), '_');
            break;
        }
      },
      false
    );
  }

  deleteAction() {
    const buttons = this.context.querySelectorAll('button#delete');
    buttons.forEach(button => {
      const item = button.closest('#file-infos');
      const filename = item
        .querySelector('h3')
        .textContent.trim()
        .toLowerCase();

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const askTitle = 'Delete File ?';
        const askMessage = filename + ' will be permanently deleted.';
        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            const data = {
              filename: filename,
              fileType: this.fileType
            };
            deleteFunction('/files', data, this.context).then(response => {
              if (response) {
                ModalHelper.notification('success', response.message);
                // eslint-disable-next-line no-new
                new DataManagement(true, this.fileType);
              }
            });
          }
        });
      });
    });
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

async function renameFunction(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

async function deleteFunction(url, data, context) {
  try {
    const response = await axios.delete(url, {
      headers: APIHelper.setAuthHeader(),
      data: data
    });
    return response.data;
  } catch (error) {
    if (error) {
      APIHelper.errorsHandler(error, context);
    }
  }
}

export default DataManagement;
