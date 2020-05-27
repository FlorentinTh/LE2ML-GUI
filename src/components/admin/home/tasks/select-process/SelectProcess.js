import Task from '../Task';
import selectProcessTemplate from './select-process.hbs';
import FileList from '@FileList';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';
import ModalHelper from '@ModalHelper';
import DataSource from '../data-source/DataSource';
import Configuration from '@Configuration';

let processContainer;
let fileList;

class SelectProcess extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.make();
  }

  makeProcessTest() {
    const filename = sessionStorage.getItem('process-model');

    if (!filename) {
      super.toggleNextBtnEnable(false);
    }

    const dataStore = Store.get('model-data');
    if (dataStore === undefined) {
      fileList = new FileList(
        processContainer,
        'Existing trained models',
        [],
        'process-model',
        filename || null
      );

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
        'process-model',
        filename || null,
        false
      );
    }

    fileList.on('selected', result => {
      super.toggleNextBtnEnable(result);
    });
  }

  switchProcessContent(process) {
    switch (process) {
      case 'test':
        sessionStorage.setItem('process-type', process);
        super.toggleNavItemEnable('process', true);
        this.makeProcessTest();
        break;
      case 'train':
        sessionStorage.setItem('process-type', process);
        super.toggleNavItemEnable('process', true);

        if (sessionStorage.getItem('process-model')) {
          sessionStorage.removeItem('process-model');
        }

        super.toggleNextBtnEnable(true);
        break;
      case 'none':
        sessionStorage.setItem('process-type', process);

        if (sessionStorage.getItem('process-model')) {
          sessionStorage.removeItem('process-model');
        }

        super.toggleNavItemEnable('process', false);
        super.toggleNextBtnEnable(true);
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

  selectModelFileHandler(conf) {
    const models = this.context.querySelectorAll('.table-container tbody tr');
    let modelFound = false;
    for (let i = 0; i < models.length; ++i) {
      const model = models[i];
      const filename = model.children[1].textContent;
      if (filename === conf.model.split('.')[0]) {
        modelFound = true;
        if (!model.classList.contains('selected-file')) {
          model.children[1].click();
        }
      }
    }
    if (!modelFound) {
      throw new Error(`${conf.model} is not found.`);
    }
  }

  applyConfigHandler(conf) {
    const radios = this.context.querySelectorAll('.switch-group input[type=radio]');

    for (let i = 0; i < radios.length; ++i) {
      const radio = radios[i];
      if (radio.value === conf.process) {
        radio.click();
      }
    }

    if (conf.process === 'test') {
      const dataStore = Store.get('model-data');
      if (dataStore === undefined) {
        fileList.on('build', result => {
          if (result) {
            this.selectModelFileHandler(conf);
          }
        });
      } else {
        this.selectModelFileHandler(conf);
      }
    }

    const configuration = new Configuration(conf);
    configuration.unmarshall();
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
          this.applyConfigHandler(response.data.data);
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
      title: 'Learning Process to Complete'
    });

    const importFileInput = this.context.querySelector('input#import-config');
    const importFileForm = this.context.querySelector('form');

    super.initNavBtn('next', { label: 'data-source', Task: DataSource });

    importFileInput.addEventListener(
      'change',
      this.importFileInputListener.bind(this),
      false
    );

    importFileForm.addEventListener(
      'submit',
      this.importFileUploadEventSubmit.bind(this),
      false
    );

    processContainer = this.context.querySelector('.process-options');

    const processSwitchInputs = this.context.querySelectorAll('.switch-group input');

    const storedProcess = sessionStorage.getItem('process-type');
    if (!storedProcess) {
      processSwitchInputs[0].setAttribute('checked', true);
    }

    for (let i = 0; i < processSwitchInputs.length; ++i) {
      const radio = processSwitchInputs[i];

      if (storedProcess) {
        if (radio.value === storedProcess) {
          radio.setAttribute('checked', true);
        }
      }

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
