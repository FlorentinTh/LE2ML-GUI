import Component from '@Component';
import fileUploadTemplate from './file-upload.hbs';
import axios from 'axios';
import APIHelper from '@APIHelper';
import StringHelper from '@StringHelper';
import ModalHelper from '@ModalHelper';
import Store from '@Store';

let fileUploadContainer;
let fileUploadForm;
let fileUploadEventChange;
let fileUploadEventDrop;
let fileUploadEventSubmit;
let cancelUploadEventClick;

class FileUpload extends Component {
  constructor(context = null) {
    super(context);

    this.cancelToken = undefined;
    this.source = undefined;

    this.context.innerHTML = fileUploadTemplate({
      title: 'File Upload'
    });

    this.run();
  }

  resetFileUpload() {
    const input = this.context.querySelector('input');
    const label = this.context.querySelector('label');
    const cancelBtn = label.querySelector('p#cancel a');
    const text = label.querySelector('p');

    cancelBtn.removeEventListener(...cancelUploadEventClick);
    input.removeAttribute('disabled');
    input.value = '';
    fileUploadForm.removeEventListener(...fileUploadEventSubmit);
    label.classList.remove('filled');
    label.classList.remove('uploading');
    text.innerHTML = 'Drag and drop or click to upload a file';
  }

  uploadFile(data, override) {
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
      .post('/files?type=input&override=' + override, data, {
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

          Store.update('file-upload', {
            filename: filename,
            size: size,
            progress: progressValue
          });
        }
      })
      .then(response => {
        if (response) {
          Store.updateEnd('file-upload');

          const dataStore = Store.get('input-data');

          if (!(dataStore === undefined)) {
            Store.remove('input-data');
          }

          const filename = response.data.data;
          ModalHelper.notification('success', filename + ' successfully uploaded.');

          this.resetFileUpload();
        }
      })
      .catch(error => {
        if (axios.isCancel(error)) {
          ModalHelper.notification('warning', 'The upload was canceled');
        } else {
          APIHelper.errorsHandler(error, this.context);
        }
        Store.updateEnd('file-upload');
        this.resetFileUpload();
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
    const texts = fileUploadForm.querySelectorAll('p');

    texts[0].innerHTML = StringHelper.truncateLength(file.name, 26);
    texts[1].innerHTML = `(${StringHelper.convertBytesToHuman(file.size)})`;
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

    if (!(event.target.value === '')) {
      this.displayFile(file[0]);
    } else {
      const label = this.context.querySelector('label');
      if (label.classList.contains('filled')) {
        const text = label.querySelector('p');
        label.classList.remove('filled');
        text.innerHTML = 'Drag and drop or click to upload a file';
      }
    }
  }

  resumeFileUpload(data) {
    const label = this.context.querySelector('label');
    const input = this.context.querySelector('input');
    const texts = this.context.querySelectorAll('.infos p');
    const value = label.querySelector('p#value');
    const cancelBtn = label.querySelector('p#cancel a');
    const progressBar = label.querySelector('progress');

    texts[0].innerHTML = StringHelper.truncateLength(data.filename, 26);
    texts[1].innerHTML = `(${StringHelper.convertBytesToHuman(data.size)})`;
    value.innerHTML = data.progress + '%';
    progressBar.value = data.progress;

    label.classList.add('uploading');
    input.setAttribute('disabled', 'disabled');

    cancelBtn.addEventListener(...cancelUploadEventClick);

    Store.on('update', upload => {
      const data = upload.data;
      value.innerHTML = data.progress + '%';
      progressBar.value = data.progress;
    });

    Store.on('updateEnd', () => {
      // eslint-disable-next-line no-new
      new FileUpload();
    });
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

  run() {
    fileUploadContainer = this.context.querySelector('.file-upload-container');

    const dataStore = Store.get('file-upload');
    if (!(dataStore === undefined)) {
      this.resumeFileUpload(dataStore.data);
    } else {
      this.initFileUpload(fileUploadContainer);
    }
  }
}

export default FileUpload;
