import Component from '@Component';
import fileContentTemplate from './file-content.hbs';
import fileListTemplate from './file-list.hbs';
import formFileTemplate from './form-file.hbs';
import formDownloadTemplate from './form-download.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import { Filters, FilterType } from '@Filters';
import Search from '@Search';

let fileModels;
let fileRaw;
let fileFeatures;
let fileFilters;

class FileContent extends Component {
  constructor(dataSource, reload = false, fileType = 'models', context = null) {
    super(context);
    this.dataSource = dataSource;
    this.reload = reload;
    this.fileType = fileType;
    this.isFiltersDisabled = false;
    this.mount();
  }

  mount() {
    this.initData();
  }

  initData() {
    const fileModelStore = Store.get('admin-file-models');
    const fileRawStore = Store.get('admin-file-raw');
    const fileFeatureStore = Store.get('admin-file-features');
    if (
      this.reload ||
      fileModelStore === undefined ||
      fileRawStore === undefined ||
      fileFeatureStore === undefined
    ) {
      this.initView(true);
      getFiles(`/files?source=${this.dataSource}&type=models`, this.context).then(
        response => {
          if (response) {
            Store.add({
              id: 'admin-file-models',
              data: response.data
            });
            fileModels = response.data;
            getFiles(`/files?source=${this.dataSource}&type=raw`, this.context).then(
              response => {
                if (response) {
                  Store.add({
                    id: 'admin-file-raw',
                    data: response.data
                  });
                  fileRaw = response.data;
                  getFiles(
                    `/files?source=${this.dataSource}&type=features`,
                    this.context
                  ).then(response => {
                    if (response) {
                      Store.add({
                        id: 'admin-file-features',
                        data: response.data
                      });
                      fileFeatures = response.data;
                      this.render();
                    }
                  });
                }
              }
            );
          }
        }
      );
    } else {
      this.render();
    }
  }

  initView(loading = false) {
    this.context.innerHTML = fileContentTemplate({
      title: `${this.fileType} for ${this.dataSource} data source`,
      totalModel: fileModels === undefined ? 0 : fileModels.length,
      totalRaw: fileRaw === undefined ? 0 : fileRaw.length,
      totalFeature: fileFeatures === undefined ? 0 : fileFeatures.length
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
      if (value === 'models') {
        files = fileModels;
      } else if (value === 'raw') {
        files = fileRaw;
      } else if (value === 'features') {
        files = fileFeatures;
      }
      if (this.isFiltersDisabled) {
        this.isFiltersDisabled = false;
        fileFilters.enableFilters();
      }
      if (opts.defaultSort) {
        files = fileFilters.setDefaultSort(files);
      }
      container.innerHTML = fileListTemplate({
        files: files,
        fileType: value,
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
          new FileContent(this.dataSource, true, 'models', '#file-content');
        }
        Search.addSearchListener(fileModels, ['filename'], data => {
          fileModels = data;
          this.buildFileList('models');
        });
        break;
      case 'raw':
        if (search.value.trim() !== '') {
          search.value = '';
          const fileRawStore = Store.get('admin-file-raw');
          if (!(fileRawStore === undefined)) {
            Store.remove('admin-file-raw');
          }
          // eslint-disable-next-line no-new
          new FileContent(this.dataSource, true, 'raw', '#file-content');
        }
        Search.addSearchListener(fileRaw, ['filename'], data => {
          fileRaw = data;
          this.buildFileList('raw');
        });
        break;
      case 'features':
        if (search.value.trim() !== '') {
          search.value = '';
          const fileFeatureStore = Store.get('admin-file-features');
          if (!(fileFeatureStore === undefined)) {
            Store.remove('admin-file-features');
          }
          // eslint-disable-next-line no-new
          new FileContent(this.dataSource, true, 'features', '#file-content');
        }
        Search.addSearchListener(fileFeatures, ['filename'], data => {
          fileFeatures = data;
          this.buildFileList('features');
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
    this.downloadAction();
    this.renameAction();
    this.deleteAction();
  }

  downloadAction() {
    const buttons = this.context.querySelectorAll('button#download');
    buttons.forEach(button => {
      const item = button.closest('#file-infos');
      const filename = item
        .querySelector('h3')
        .textContent.trim()
        .toLowerCase();
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const content = formDownloadTemplate();
        const elems = ['format'];
        ModalHelper.edit(
          `Download File ${filename.split('.')[0]}`,
          content,
          'download',
          elems
        ).then(result => {
          if (result.value) {
            const fileFormat = filename
              .split('.')
              .pop()
              .toLowerCase();
            const selectedFormat = result.value.format.toLowerCase();
            if (selectedFormat === 'none') {
              ModalHelper.error('You must select a format to download the file.');
            } else {
              const loader = ModalHelper.loading(
                'Preparing Download...',
                'Your download will begin automatically'
              );
              downloadFile(
                `/files/${filename}/download?source=${this.dataSource}&type=${this.fileType}&from=${fileFormat}&to=${selectedFormat}`,
                this.context
              ).then(response => {
                if (response) {
                  loader.close();
                  window.open(
                    new URL(window.env.FILE_SERVER_URL + '/' + response.data),
                    '_blank'
                  );
                }
              });
            }
          }
        });
      });
    });
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
          filename: filename.split('.').slice(0, -1)
        });
        const elems = ['filename'];
        ModalHelper.edit('Rename File', content, 'rename', elems).then(result => {
          if (result.value) {
            const data = {
              oldFilename: filename,
              newFilename: result.value.filename + '.' + filename.split('.').pop(),
              fileType: this.fileType
            };
            renameFile(
              `/files/rename?source=${this.dataSource}`,
              data,
              this.context
            ).then(response => {
              if (response) {
                ModalHelper.notification('success', response.message);
                if (this.fileType === 'raw') {
                  const rawStore = Store.get('raw-files');
                  if (!(rawStore === undefined)) {
                    Store.remove('raw-files');
                  }
                } else if (this.fileType === 'features') {
                  const featuredStore = Store.get('features-files');
                  if (!(featuredStore === undefined)) {
                    Store.remove('features-files');
                  }
                }
                // eslint-disable-next-line no-new
                new FileContent(this.dataSource, true, this.fileType, '#file-content');
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
      'input',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        switch (input.id) {
          case 'filename':
            input.value = input.value.replace(/[^0-9a-zA-Z_]/gi, '_').toLowerCase();
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
            deleteFile(`/files?source=${this.dataSource}`, data, this.context).then(
              response => {
                if (response) {
                  ModalHelper.notification('success', response.message);
                  if (this.fileType === 'raw') {
                    const rawStore = Store.get('raw-files');
                    if (!(rawStore === undefined)) {
                      Store.remove('raw-files');
                    }
                  } else if (this.fileType === 'features') {
                    const featuredStore = Store.get('features-files');
                    if (!(featuredStore === undefined)) {
                      Store.remove('features-files');
                    }
                  }
                  // eslint-disable-next-line no-new
                  new FileContent(this.dataSource, true, this.fileType, '#file-content');
                }
              }
            );
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
    APIHelper.errorsHandler(error, true);
  }
}

async function downloadFile(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function renameFile(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function deleteFile(url, data, context) {
  try {
    const response = await axios.delete(url, {
      headers: APIHelper.setAuthHeader(),
      data: data
    });
    return response.data;
  } catch (error) {
    if (error) {
      APIHelper.errorsHandler(error, true);
    }
  }
}

export default FileContent;
