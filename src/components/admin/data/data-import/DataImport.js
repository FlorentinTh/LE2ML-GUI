import Component from '@Component';
import dataImportTemplate from './data-import.hbs';
import sourceListTemplate from './source-list.hbs';
import inertialInfoTemplate from './inertial-data/info.hbs';
import defaultInfoTemplate from './default/info.hbs';
import importContentTemplate from './import-content.hbs';
import axios from 'axios';
import APIHelper from '@APIHelper';
import StringHelper from '@StringHelper';
import ModalHelper from '@ModalHelper';
import Store from '@Store';

let allSources;
let sourceSelect;
let fileUploadContainer;
let fileUploadForm;
let fileUploadEventChange;
let fileUploadEventDrop;
let fileUploadEventSubmit;
let cancelUploadEventClick;
let fileType;

class DataImport extends Component {
  constructor(context = null) {
    super(context);
    this.title = 'Import Datasets';
    this.cancelToken = undefined;
    this.source = undefined;
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('data');
    this.initData();
  }

  initData() {
    const storedSources = Store.get('import-data-sources');

    if (storedSources === undefined) {
      this.render(true);

      getSources('/sources', this.context)
        .then(response => {
          if (response) {
            allSources = response.data.sources;

            Store.add({
              id: 'import-data-sources',
              data: allSources
            });

            this.make();
          }
        })
        .catch(error => {
          ModalHelper.notification('error', error);
        });
    } else {
      allSources = storedSources.data;
      this.make();
    }
  }

  render(loading = true) {
    this.context.innerHTML = dataImportTemplate({
      title: this.title
    });

    this.buildSourceList('#sources', loading);
  }

  buildSourceList(id, loading = true) {
    const select = this.context.querySelector(id);
    select.innerHTML += sourceListTemplate({
      sources: allSources,
      loading: loading
    });
  }

  make() {
    this.render(false);

    sourceSelect = this.context.querySelector('#sources');
    this.dataSource = sourceSelect.options[sourceSelect.selectedIndex].value;
    this.buildImportContent();
  }

  buildImportContent() {
    const importContent = this.context.querySelector('#import-content');
    importContent.innerHTML = importContentTemplate();

    sourceSelect.addEventListener('change', this.sourceChangeListener.bind(this), false);

    this.printInfo();

    fileUploadContainer = this.context.querySelector('.file-upload-container');

    const dataStore = Store.get('file-upload');

    if (!(dataStore === undefined)) {
      this.resumeFileUpload(dataStore.data);
    } else {
      this.initFileUpload(fileUploadContainer);
    }

    const fileTypeSwitchInputs = this.context.querySelectorAll('.switch-group input');

    for (let i = 0; i < fileTypeSwitchInputs.length; ++i) {
      const radio = fileTypeSwitchInputs[i];

      if (radio.checked) {
        fileType = radio.value;
      }

      radio.addEventListener('change', this.fileTypeSwitchHandler.bind(this), false);
    }
  }

  printInfo() {
    const container = document.querySelector('.description');
    switch (this.dataSource) {
      case 'inertial':
        container.innerHTML = inertialInfoTemplate();
        break;
      default:
        container.innerHTML = defaultInfoTemplate();
        break;
    }
  }

  sourceChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.dataSource = event.target.value;
    this.printInfo();
  }

  initFileUpload(container) {
    fileUploadForm = container.querySelector('form');

    fileUploadEventChange = ['change', this.fileUploadListener.bind(this), false];
    fileUploadEventDrop = ['drop', this.fileUploadListener.bind(this), false];

    container.addEventListener(...fileUploadEventChange);
    container.addEventListener('dragover', this.fileUploadDragListener, false);
    container.addEventListener('dragleave', this.fileUploadDragListener, false);
    container.addEventListener(...fileUploadEventDrop);
  }

  resumeFileUpload(data) {
    const label = this.context.querySelector('#file-upload-label');
    const input = this.context.querySelector('#file-input');
    const texts = label.querySelectorAll('.infos p');
    const value = label.querySelector('p#value');
    const cancelBtn = label.querySelector('p#cancel a');
    const progressBar = label.querySelector('progress');

    texts[0].innerHTML = StringHelper.truncateLength(data.filename, 26, '_');
    texts[1].innerHTML = `(${StringHelper.convertBytesToHuman(data.size)})`;

    if (data.progress === 100) {
      value.innerHTML = 'Processing file...';
      cancelBtn.style.visibility = 'hidden';
    } else {
      value.innerHTML = data.progress + '%';
    }

    progressBar.value = data.progress;

    label.classList.add('filled', 'uploading');
    input.setAttribute('disabled', 'disabled');

    cancelBtn.addEventListener(...cancelUploadEventClick);

    Store.on('update', upload => {
      const data = upload.data;
      value.innerHTML = data.progress + '%';
      progressBar.value = data.progress;
    });

    Store.on('updateEnd', () => {
      // eslint-disable-next-line no-new
      new DataImport();
    });
  }

  fileTypeSwitchHandler(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    fileType = event.target.value;
  }

  removeStoredFiles(type) {
    Store.remove(type + '-file-data');
    Store.remove('admin-file-' + type);
    Store.remove(type + '-files');
  }

  resetFileUpload() {
    const input = this.context.querySelector('#file-input');
    const label = this.context.querySelector('#file-upload-label');
    const text = label.querySelector('p');

    input.removeAttribute('disabled');
    input.value = '';
    fileUploadForm.removeEventListener(...fileUploadEventSubmit);
    label.classList.remove('filled');
    label.classList.remove('uploading');
    text.innerHTML = 'Drag and drop or click to upload a file';
  }

  uploadFile(data, override = false) {
    const label = fileUploadForm.querySelector('label');
    const input = fileUploadForm.querySelector('input');
    const value = label.querySelector('p#value');
    const cancelBtn = label.querySelector('p#cancel a');
    const progressBar = label.querySelector('progress');

    this.cancelToken = axios.CancelToken;
    this.source = this.cancelToken.source();

    const file = Object.values(Object.fromEntries(data))[0];

    Store.add({
      id: 'file-upload',
      data: {
        filename: file.name,
        size: file.size,
        progress: 0
      }
    });

    cancelUploadEventClick = [
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.source.cancel();
      },
      false
    ];

    cancelBtn.addEventListener(...cancelUploadEventClick);

    axios
      .post(
        `/files/${this.dataSource}/upload/?type=${fileType}&override=${override}`,
        data,
        {
          headers: APIHelper.setAuthHeader(),
          cancelToken: this.source.token,
          onUploadProgress: progress => {
            const progressValue = APIHelper.getUploadProgress(progress);

            label.classList.add('uploading');
            input.setAttribute('disabled', 'disabled');
            value.innerHTML = progressValue + '%';
            progressBar.value = progressValue;

            const data = Store.get('file-upload').data;
            const filename = data.filename;
            const size = data.size;

            if (progressValue === 100) {
              value.innerHTML = 'Processing file...';
              cancelBtn.style.visibility = 'hidden';
            }

            Store.update('file-upload', {
              filename: filename,
              size: size,
              progress: progressValue
            });
          }
        }
      )
      .then(response => {
        if (response) {
          Store.updateEnd('file-upload');

          const dataStore = Store.get('input-data');

          if (!(dataStore === undefined)) {
            Store.remove('input-data');
          }

          const filename = response.data.data;
          ModalHelper.notification('success', filename + ' successfully uploaded');
          cancelBtn.removeEventListener(...cancelUploadEventClick);
          this.resetFileUpload();
          this.removeStoredFiles(fileType);
        }
      })
      .catch(error => {
        if (axios.isCancel(error)) {
          ModalHelper.notification('warning', 'The upload was canceled');
        } else {
          if (error.request.status === 404) {
            ModalHelper.error(
              `File upload for ${this.dataSource} data source is currently not available.`
            );
          } else {
            ModalHelper.error(
              'The file is not valid. It will automatically be removed. Please try again'
            );
          }
        }

        Store.updateEnd('file-upload');
        cancelBtn.removeEventListener(...cancelUploadEventClick);
        this.resetFileUpload();
      });
  }

  uploadFormSubmitListener() {
    event.preventDefault();
    event.stopImmediatePropagation();

    const formData = new FormData(fileUploadForm);

    formData.delete('file-input');
    formData.append('file-input', event.currentTarget.file);

    const filename = Object.values(Object.fromEntries(formData))[0].name;

    axios
      .get(`/files/${filename}/exists?source=${this.dataSource}&type=${fileType}`, {
        headers: APIHelper.setAuthHeader()
      })
      .then(response => {
        if (response) {
          if (response.data.data) {
            const title = response.data.message;
            const message = 'Do you want to override it ?';

            ModalHelper.confirm(title, message)
              .then(result => {
                if (result.value) {
                  this.uploadFile(formData, true);
                } else {
                  this.resetFileUpload();
                }
              })
              .catch(error => {
                ModalHelper.notification('error', error);
              });
          } else {
            this.uploadFile(formData);
          }
        }
      })
      .catch(error => {
        APIHelper.errorsHandler(error, true);
        this.resetFileUpload();
      });
  }

  displayFile(file) {
    const label = fileUploadForm.querySelector('label');
    const texts = fileUploadForm.querySelectorAll('p');

    const filename = file.name
      .split('.')
      .slice(0, -1)
      .join('_')
      .replace(/[^0-9a-zA-Z_]/gi, '_')
      .toLowerCase();

    const ext = file.name.split('.').pop().toLowerCase();

    texts[0].innerHTML = StringHelper.truncateLength(`${filename}.${ext}`, 26, '_');
    texts[1].innerHTML = `(${StringHelper.convertBytesToHuman(file.size)})`;

    label.classList.add('filled');

    fileUploadEventSubmit = ['submit', this.uploadFormSubmitListener.bind(this), false];
    fileUploadForm.file = file;
    fileUploadForm.addEventListener(...fileUploadEventSubmit);
  }

  fileUploadDragListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const label = this.querySelector('label');

    switch (event.type) {
      case 'dragover':
        label.classList.add('hover');
        break;
      case 'dragleave':
        label.classList.remove('hover');
        break;
    }
  }

  fileUploadListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const files = event.target.files || event.dataTransfer.files;

    if (!(event.target.value === '')) {
      this.displayFile(files[0]);
    } else {
      const label = this.context.querySelector('label');

      if (label.classList.contains('filled')) {
        const text = label.querySelector('p');
        label.classList.remove('filled');
        text.innerHTML = 'Drag and drop or click to upload a file';
      }
    }
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

export default DataImport;
