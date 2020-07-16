import Task from '../Task';
import selectProcessTemplate from './select-process.hbs';
import trainingProcessTemplate from './training-process.hbs';
import FileList from '@FileList';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';
import ModalHelper from '@ModalHelper';
import DataSource from '../data-source/DataSource';
import Configuration from '@Configuration';
import dayjs from 'dayjs';

let processContainer;
let fileList;
let modelNameInput;

class SelectProcess extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.make();
  }

  makeProcessTest() {
    const process = sessionStorage.getItem('process-type');
    const model = sessionStorage.getItem('process-model');

    if (process === 'train' && !(model === undefined)) {
      sessionStorage.removeItem('process-model');
    }

    sessionStorage.setItem('process-type', 'test');

    const file = sessionStorage.getItem('process-model');
    let filename;

    if (!(file === null)) {
      filename = file.split('.')[0];
      super.toggleNavBtnEnable('next', true);
      super.toggleNavItemsEnabled(['data-source'], true);

      const isOnlyLearning = sessionStorage.getItem('only-learning');
      const selectedInput = sessionStorage.getItem('input-content');

      if (isOnlyLearning || selectedInput === null) {
        super.toggleNavItemsEnabled(['windowing', 'feature-extraction'], false);
      } else {
        super.toggleNavItemsEnabled(['windowing', 'feature-extraction'], true);
      }
    } else {
      super.toggleNavBtnEnable('next', false);
      super.toggleNavItemsEnabled(
        ['data-source', 'windowing', 'feature-extraction'],
        false
      );
    }

    const dataStore = Store.get('model-data');
    if (dataStore === undefined) {
      fileList = new FileList(
        processContainer,
        'Existing Trained Models',
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
        'Existing Trained Models',
        dataStore.data,
        'process-model',
        filename || null,
        false
      );
    }

    fileList.on('selected', result => {
      super.toggleNavBtnEnable('next', result);
      const isOnlyLearning = sessionStorage.getItem('only-learning');
      const selectedInput = sessionStorage.getItem('input-content');

      if (isOnlyLearning || selectedInput === null) {
        super.toggleNavItemsEnabled(['data-source'], result);
      } else {
        super.toggleNavItemsEnabled(
          ['data-source', 'windowing', 'feature-extraction'],
          result
        );
      }
    });
  }

  makeProcessTrain() {
    const process = sessionStorage.getItem('process-type');

    let model;
    if (!(process === null) && !(process === 'test' || process === 'none')) {
      model = sessionStorage.getItem('process-model');
    } else {
      model = 'model-' + dayjs().format('YYYYMMDDHHmm');
    }

    sessionStorage.setItem('process-type', 'train');
    sessionStorage.setItem('process-model', model);

    super.toggleNavBtnEnable('next', true);
    super.toggleNavItemsEnabled(['data-source'], true);

    const isOnlyLearning = sessionStorage.getItem('only-learning');
    const selectedInput = sessionStorage.getItem('input-content');
    if (isOnlyLearning || selectedInput === null) {
      super.toggleNavItemsEnabled(['windowing', 'feature-extraction'], false);
    } else {
      super.toggleNavItemsEnabled(['windowing', 'feature-extraction'], true);
    }

    const content = this.context.querySelector('.process-options');

    content.innerHTML = trainingProcessTemplate({
      title: 'New Trained Model',
      filename: model
    });

    modelNameInput = this.context.querySelector('input#model-filename');
    modelNameInput.addEventListener(
      'input',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        modelNameInput.value = modelNameInput.value
          .replace(/[^0-9a-zA-Z-]/gi, '-')
          .toLowerCase();

        if (modelNameInput.value === '') {
          sessionStorage.removeItem('process-model');
          super.toggleNavBtnEnable('next', false);
          super.toggleNavItemsEnabled(['data-source'], false);
        } else {
          sessionStorage.setItem('process-model', modelNameInput.value);
          super.toggleNavBtnEnable('next', true);
          super.toggleNavItemsEnabled(['data-source'], true);

          const isOnlyLearning = sessionStorage.getItem('only-learning');
          const selectedInput = sessionStorage.getItem('input-content');

          if (isOnlyLearning || selectedInput === null) {
            super.toggleNavItemsEnabled(['windowing', 'feature-extraction'], false);
          } else {
            super.toggleNavItemsEnabled(['windowing', 'feature-extraction'], true);
          }
        }
      },
      false
    );
  }

  switchProcessContent(process) {
    switch (process) {
      case 'test':
        this.makeProcessTest();
        break;
      case 'train':
        this.makeProcessTrain();
        break;
      case 'none':
        sessionStorage.setItem('process-type', process);

        if (sessionStorage.getItem('process-model')) {
          sessionStorage.removeItem('process-model');
        }

        if (
          !(sessionStorage.getItem('input-content') === null) &&
          !sessionStorage.getItem('only-learning')
        ) {
          super.toggleNavItemsEnabled(
            ['data-source', 'windowing', 'feature-extraction'],
            true
          );
        } else {
          super.toggleNavItemsEnabled(['data-source'], true);
        }

        super.toggleNavItemsEnabled(['process'], false);
        super.toggleNavBtnEnable('next', true);
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
    } else if (conf.process === 'train') {
      modelNameInput.value = conf.model;
    }

    const configuration = new Configuration(conf);
    const unmarshall = configuration.unmarshall();

    if (!unmarshall) {
      ModalHelper.confirm(
        'Pipeline Configuration',
        'The configuration for the pipeline will not do anything as it is right know. You should either complete the pipeline manually, or upload a new file.',
        'I understand',
        'No',
        false,
        false
      );
    } else {
      const fileType = sessionStorage.getItem('input-type');
      if (fileType === 'features-file') {
        super.toggleNavItemsEnabled(['data-source'], true);
        super.toggleNavItemsEnabled(['windowing', 'feature-extraction'], false);
      } else {
        super.toggleNavItemsEnabled(['data-source'], true);
        super.toggleNavItemsEnabled(['windowing', 'feature-extraction'], true);
      }
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
          ModalHelper.notification('success', response.data.message);
          this.applyConfigHandler(response.data.data);
        }
      })
      .catch(error => {
        input.removeAttribute('disabled');
        input.value = '';
        this.toggleLoading(false);
        APIHelper.errorsHandler(error, true);
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
      const submit = label.querySelector('button[type="submit"]');

      this.toggleLoading(true);
      submit.click();
    }
  }

  make() {
    this.context.innerHTML = selectProcessTemplate({
      title: 'Learning Process to Complete'
    });

    const importFileInput = this.context.querySelector('input#import-config');
    const importFileForm = this.context.querySelector('form');

    super.initNavBtn('next', { label: 'data-source', Task: DataSource });
    super.toggleNavBtnEnable('next', false);
    super.toggleNavItemsEnabled(
      ['data-source', 'windowing', 'feature-extraction', 'process'],
      false
    );

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
    APIHelper.errorsHandler(error, true);
  }
}

export default SelectProcess;
