import Task from '../Task';
import selectProcessTemplate from './select-process.hbs';
import FileList from '@FileList';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';
import ModalHelper from '@ModalHelper';

let processContainer;

class SelectProcess extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.make();
  }

  makeProcessTest() {
    let fileList;
    const dataStore = Store.get('model-data');

    if (dataStore === undefined) {
      fileList = new FileList(processContainer, 'Existing trained models', [], 'model');

      getFiles('/files?type=models', this.context).then(response => {
        if (response) {
          Store.add({
            id: 'model-data',
            data: response.data
          });

          fileList.setData(response.data);
          fileList.make();
        }
      });
    } else {
      const context = this.context.querySelector('.process-options');
      fileList = new FileList(
        context,
        'Existing trained models',
        dataStore.data,
        'model',
        false
      );
    }

    super.setProcessNavItem('Predict');
  }

  switchProcessContent(process) {
    switch (process) {
      case 'test':
        this.makeProcessTest();
        break;
      case 'train':
        super.setProcessNavItem('Training');
        break;
    }
  }

  processSwitchHandler(event) {
    event.stopImmediatePropagation();
    if (event.target.checked) {
      processContainer.innerHTML = '';
      const value = event.target.value;
      this.switchProcessContent(value);
    }
  }

  importFileUploadEventSubmit(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const form = this.context.querySelector('.import-container form');

    const data = new FormData(form);

    const input = form.querySelector('input');
    input.setAttribute('disabled', 'disabled');

    axios
      .post('/files/import/conf', data, {
        headers: APIHelper.setAuthHeader()
      })
      .then(response => {
        if (response) {
          input.removeAttribute('disabled');
          input.value = '';
          this.toggleLoading(false);
          ModalHelper.notification('success', 'Configuration successfully imported.');
        }
      })
      .catch(error => {
        input.removeAttribute('disabled');
        input.value = '';
        this.toggleLoading(false);
        APIHelper.errorsHandler(error, this.context, true);
      });
  }

  toggleLoading(toggle) {
    const label = this.context.querySelector('.import-container label');
    const icon = label.children[0];

    if (toggle) {
      label.classList.add('loading');
      icon.classList.remove('fa-file-upload');
      icon.classList.add('fa-spinner');
    } else {
      label.classList.remove('loading');
      icon.classList.remove('fa-spinner');
      icon.classList.add('fa-file-upload');
    }
  }

  importFileInputListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const file = event.target.files[0];

    if (!(file === undefined)) {
      const label = this.context.querySelector('.import-container label');
      const button = label.children[1];

      this.toggleLoading(true);
      button.click();
    }
  }

  make() {
    this.context.innerHTML = selectProcessTemplate({
      title: 'Process to Achieve'
    });

    const importFileInput = this.context.querySelector('input#import-config');
    importFileInput.addEventListener(
      'change',
      this.importFileInputListener.bind(this),
      false
    );

    const importFileForm = this.context.querySelector('form');
    importFileForm.addEventListener(
      'submit',
      this.importFileUploadEventSubmit.bind(this),
      false
    );

    processContainer = this.context.querySelector('.process-options');

    const processSwitchInputs = this.context.querySelectorAll('.switch-group input');

    for (let i = 0; i < processSwitchInputs.length; ++i) {
      const radio = processSwitchInputs[i];
      radio.addEventListener('change', this.processSwitchHandler.bind(this), false);

      if (radio.checked) {
        this.switchProcessContent(radio.value);
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

export default SelectProcess;
