import dataSourceTemplate from './data-source.hbs';
import Task from '../Task';
import FileList from '@FileList';
import fileUploadTemplate from './file-upload.hbs';
import websocketTemplate from './websocket.hbs';
import axios from 'axios';
import APIHelper from '@APIHelper';
import StringHelper from '@StringHelper';
import Store from '@Store';
import ModalHelper from '@ModalHelper';

let existingFilesContainer;

let fileUploadSection;
let fileUploadForm;

let fileUploadEventChange;
let fileUploadEventDrop;
let fileUploadEventSubmit;

class DataSource extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.make();
  }

  initWebSocketSection(container) {
    container.insertAdjacentHTML('beforeend', websocketTemplate());
    super.disableSection('websocket');
  }

  resetFileUpload() {
    const input = fileUploadForm.querySelector('input');
    const label = fileUploadForm.querySelector('label');
    const text = fileUploadForm.querySelector('p');

    input.value = '';
    fileUploadForm.removeEventListener(...fileUploadEventSubmit);
    label.classList.remove('filled');
    label.classList.remove('uploading');
    text.innerHTML = 'Select or drag a file here';
  }

  uploadFile(data, override) {
    const label = fileUploadForm.querySelector('label');
    const progressBar = label.querySelector('progress');

    axios
      .post('/files?type=input&override=' + override, data, {
        headers: APIHelper.setAuthHeader(),
        onUploadProgress: progress => {
          label.classList.add('uploading');
          progressBar.value = APIHelper.getUploadProgress(progress);
        }
      })
      .then(response => {
        if (response) {
          const filename = response.data.data;
          ModalHelper.notification('success', filename + ' successfully uploaded.');

          this.resetFileUpload();
          this.initFileList();
        }
      })
      .catch(error => {
        this.resetFileUpload();
        APIHelper.errorsHandler(error, this.context);
      });
  }

  uploadFormSubmitListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const formData = new FormData(fileUploadForm);

    const filenameData = {
      filename: Object.values(Object.fromEntries(formData))[0].name
    };

    axios
      .post('/files?type=input', filenameData, {
        headers: APIHelper.setAuthHeader()
      })
      .then(response => {
        if (response) {
          if (response.data.data) {
            const title = response.data.message;
            const message = 'Do you want to override it ?';

            ModalHelper.confirm(title, message).then(result => {
              if (result.value) {
                this.uploadFile(formData, true);
              } else {
                this.resetFileUpload();
              }
            });
          } else {
            this.uploadFile(formData, true);
          }
        }
      })
      .catch(error => {
        this.resetFileUpload();
        APIHelper.errorsHandler(error, this.context);
      });
  }

  displayFile(file) {
    const label = fileUploadForm.querySelector('label');
    const text = fileUploadForm.querySelector('p');

    text.innerHTML = `${file.name} (${StringHelper.convertBytesToHuman(file.size)})`;
    label.classList.add('filled');

    fileUploadEventSubmit = ['submit', this.uploadFormSubmitListener.bind(this), false];
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
    const file = event.target.files || event.dataTransfer.files;
    this.displayFile(file[0]);
  }

  initFileUploadSection(container) {
    container.insertAdjacentHTML('beforeend', fileUploadTemplate());
    fileUploadSection = this.context.querySelector('#file-upload');
    fileUploadForm = fileUploadSection.querySelector('form');

    fileUploadEventChange = ['change', this.fileUploadListener.bind(this), false];
    fileUploadEventDrop = ['drop', this.fileUploadListener.bind(this), false];

    fileUploadSection.addEventListener(...fileUploadEventChange);
    fileUploadSection.addEventListener('dragover', this.fileUploadDragListener, false);
    fileUploadSection.addEventListener('dragleave', this.fileUploadDragListener, false);
    fileUploadSection.addEventListener(...fileUploadEventDrop);
  }

  initFileList() {
    const fileList = new FileList(
      existingFilesContainer,
      'Existing Data Files',
      [],
      'data'
    );

    getFiles('/files?type=input', this.context).then(response => {
      if (response) {
        const dataStore = Store.get('input-data');

        if (!(dataStore === undefined)) {
          Store.remove('input-data');
        }

        Store.add({
          id: 'input-data',
          data: response.data
        });

        fileList.setData(response.data);
        fileList.make();
      }
    });

    return fileList;
  }

  initExistingFilesSection() {
    const dataStore = Store.get('input-data');

    if (dataStore === undefined) {
      this.initFileList();
    } else {
      // eslint-disable-next-line no-new
      new FileList(
        existingFilesContainer,
        'Existing Data Files',
        dataStore.data,
        'data',
        false
      );
    }
  }

  make() {
    this.context.innerHTML = dataSourceTemplate({
      title: 'Data Source'
    });

    existingFilesContainer = this.context.querySelector('#existing-files');
    this.initExistingFilesSection();

    const sectionsContainer = existingFilesContainer.parentNode;

    this.initFileUploadSection(sectionsContainer);
    this.initWebSocketSection(sectionsContainer);
  }
}

async function getFiles(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

export default DataSource;
