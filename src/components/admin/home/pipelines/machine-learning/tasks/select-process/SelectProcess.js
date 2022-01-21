import Task from '../Task';
import selectProcessTemplate from './select-process.hbs';
import sourceListTemplate from './source-list.hbs';
import trainingProcessTemplate from './training-process.hbs';
import FileList from '@FileList';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';
import ModalHelper from '@ModalHelper';
import DataSource from '../data-source/DataSource';
import Configuration from '@Configuration';
import dayjs from 'dayjs';

let allSources;
let processContainer;
let fileList;
let modelNameInput;
let crossValidationSwitch;

let importFileInputChange;
let importFileFormSubmit;
let processSwitchChange;

class SelectProcess extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.title = 'Learning Process to Complete';
    this.dataSource = undefined;
    this.initData();
  }

  initData() {
    const storedSources = Store.get('home-data-sources');

    if (storedSources === undefined) {
      this.render(true);

      getSources('/sources', this.context)
        .then(response => {
          if (response) {
            allSources = response.data.sources;

            Store.add({
              id: 'home-data-sources',
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
    this.context.innerHTML = selectProcessTemplate({
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

    const sourceSelect = this.context.querySelector('#sources');

    const storedDataSource = sessionStorage.getItem('data-source');
    if (storedDataSource === null) {
      this.dataSource = sourceSelect.options[sourceSelect.selectedIndex].value;
      sessionStorage.setItem('data-source', this.dataSource);
    } else {
      for (let i = 0; i < sourceSelect.options.length; ++i) {
        const option = sourceSelect.options[i];
        if (!(option === 'none') && option.value === storedDataSource) {
          option.selected = true;
          this.dataSource = option.value;
        }
      }
    }

    importFileInputChange = ['change', this.importFileInputListener.bind(this), false];
    importFileFormSubmit = ['submit', this.importFileUploadEventSubmit.bind(this), false];
    processSwitchChange = ['change', this.processSwitchHandler.bind(this), false];

    this.makeSelectProcess();

    sourceSelect.addEventListener('change', this.sourceChangeHandler.bind(this), false);
  }

  sourceChangeHandler(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.dataSource = event.target.value;
    sessionStorage.setItem('data-source', this.dataSource);

    const rawFilesStored = Store.get('raw-file-data');
    if (!(rawFilesStored === undefined)) {
      Store.remove('raw-file-data');
    }

    const featuresFilesStored = Store.get('features-file-data');
    if (!(featuresFilesStored === undefined)) {
      Store.remove('features-file-data');
    }

    const dataStore = Store.get('model-data');
    if (!(dataStore === undefined)) {
      Store.remove('model-data');
    }

    const storedFeatures = Store.get('features-source');
    if (!(storedFeatures === undefined)) {
      Store.remove('features-source');
    }

    const sessionFeatures = sessionStorage.getItem('features');
    if (!(sessionFeatures === null)) {
      sessionStorage.removeItem('features');
    }

    this.makeSelectProcess();
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

    if (selectedInput === null) {
      super.toggleNavItemsEnabled(['windowing', 'feature-extraction', 'process'], false);
    } else {
      const isWindowingEnable = sessionStorage.getItem('windowing-enabled');
      const isWindowLengthValid = sessionStorage.getItem('windowing-length') > 0;

      if (!isOnlyLearning) {
        super.toggleNavItemsEnabled(['windowing'], true);

        if (!(isWindowingEnable === null)) {
          if (
            (isWindowingEnable === 'true' && isWindowLengthValid) ||
            isWindowingEnable === 'false'
          ) {
            super.toggleNavItemsEnabled(['feature-extraction'], true);
            const isFeaturesFileSave = sessionStorage.getItem('features-save');
            const isFileNameValid = sessionStorage.getItem('features-file');

            if (!(isFeaturesFileSave === null)) {
              if (
                (isFeaturesFileSave === 'true' && !(isFileNameValid === null)) ||
                isFeaturesFileSave === 'false'
              ) {
                super.toggleNavItemsEnabled(['process'], true);
              } else {
                super.toggleNavItemsEnabled(['process'], false);
              }
            } else {
              super.toggleNavItemsEnabled(['process'], true);
            }
          } else {
            super.toggleNavItemsEnabled(['process'], false);
          }
        } else {
          super.toggleNavItemsEnabled(['feature-extraction', 'process'], false);
        }
      } else {
        super.toggleNavItemsEnabled(['process'], true);
      }
    }

    const content = this.context.querySelector('.process-options');

    content.innerHTML = trainingProcessTemplate({
      'title-model': 'New Trained Model',
      filename: model,
      'title-validation': 'Perform Cross-Validation ?'
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

          if (selectedInput === null) {
            super.toggleNavItemsEnabled(
              ['windowing', 'feature-extraction', 'process'],
              false
            );
          } else {
            const isWindowingEnable = sessionStorage.getItem('windowing-enabled');
            const isWindowLengthValid = sessionStorage.getItem('windowing-length') > 0;

            if (!isOnlyLearning) {
              super.toggleNavItemsEnabled(['windowing'], true);

              if (!(isWindowingEnable === null)) {
                if (
                  (isWindowingEnable === 'true' && isWindowLengthValid) ||
                  isWindowingEnable === 'false'
                ) {
                  super.toggleNavItemsEnabled(['feature-extraction'], true);
                  const isFeaturesFileSave = sessionStorage.getItem('features-save');
                  const isFileNameValid = sessionStorage.getItem('features-file');

                  if (!(isFeaturesFileSave === null)) {
                    if (
                      (isFeaturesFileSave === 'true' && !(isFileNameValid === null)) ||
                      isFeaturesFileSave === 'false'
                    ) {
                      super.toggleNavItemsEnabled(['process'], true);
                    } else {
                      super.toggleNavItemsEnabled(['process'], false);
                    }
                  } else {
                    super.toggleNavItemsEnabled(['process'], true);
                  }
                } else {
                  super.toggleNavItemsEnabled(['process'], false);
                }
              } else {
                super.toggleNavItemsEnabled(['feature-extraction', 'process'], false);
              }
            } else {
              super.toggleNavItemsEnabled(['process'], true);
            }
          }
        }
      },
      false
    );

    crossValidationSwitch = this.context.querySelectorAll(
      '.cross-validation input[type=radio]'
    );

    const infoBtn = this.context.querySelector('h3.infos-title i');
    infoBtn.addEventListener(
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        ModalHelper.confirm(
          'Cross-Validation',
          'A 10-fold cross-validation will be performed on the trained model in order to provide an estimation of the performance for the learning process.',
          'I understand',
          '',
          false,
          true,
          'info'
        );
      },
      false
    );

    const storedCrossValidation = sessionStorage.getItem('cross-validation');

    for (let i = 0; i < crossValidationSwitch.length; ++i) {
      const radio = crossValidationSwitch[i];

      if (!(storedCrossValidation === null)) {
        if (radio.value === storedCrossValidation) {
          radio.setAttribute('checked', true);
        }
      } else {
        if (radio.checked) {
          sessionStorage.setItem('cross-validation', radio.value);
        }
      }

      radio.addEventListener(
        'change',
        event => {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (event.target.checked) {
            sessionStorage.setItem('cross-validation', event.target.value);
          }
        },
        false
      );
    }
  }

  makeProcessTest() {
    const process = sessionStorage.getItem('process-type');
    const model = sessionStorage.getItem('process-model');
    const crossValidation = sessionStorage.getItem('cross-validation');

    if (process === 'train') {
      if (!(model === undefined)) {
        sessionStorage.removeItem('process-model');
      }

      if (!(crossValidation === undefined)) {
        sessionStorage.removeItem('cross-validation');
      }
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

      if (selectedInput === null) {
        super.toggleNavItemsEnabled(
          ['windowing', 'feature-extraction', 'process'],
          false
        );
        super.removeFromSession(['process']);
      } else {
        const isWindowingEnable = sessionStorage.getItem('windowing-enabled');
        const isWindowLengthValid = sessionStorage.getItem('windowing-length') > 0;

        if (!isOnlyLearning) {
          super.toggleNavItemsEnabled(['windowing'], true);

          if (!(isWindowingEnable === null)) {
            if (
              (isWindowingEnable === 'true' && isWindowLengthValid) ||
              isWindowingEnable === 'false'
            ) {
              super.toggleNavItemsEnabled(['feature-extraction'], true);
            }
          } else {
            super.toggleNavItemsEnabled(['feature-extraction', 'process'], false);
          }
        }
      }
    } else {
      super.toggleNavBtnEnable('next', false);
      super.toggleNavItemsEnabled(
        ['data-source', 'windowing', 'feature-extraction', 'process'],
        false
      );
      super.removeFromSession(['process']);
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

      getFiles(`/files?source=${this.dataSource}&type=models`, this.context)
        .then(response => {
          if (response) {
            Store.add({
              id: 'model-data',
              data: response.data
            });

            fileList.setData(response.data);
            fileList.make();
          }
        })
        .catch(error => {
          ModalHelper.notification('error', error);
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

      if (result) {
        super.toggleNavItemsEnabled(['data-source'], true);
        if (selectedInput === null) {
          super.toggleNavItemsEnabled(
            ['windowing', 'feature-extraction', 'process'],
            false
          );
          super.removeFromSession(['process']);
        } else {
          const isWindowingEnable = sessionStorage.getItem('windowing-enabled');
          const isWindowLengthValid = sessionStorage.getItem('windowing-length') > 0;

          if (!isOnlyLearning) {
            super.toggleNavItemsEnabled(['windowing'], true);

            if (!(isWindowingEnable === null)) {
              if (
                (isWindowingEnable === 'true' && isWindowLengthValid) ||
                isWindowingEnable === 'false'
              ) {
                super.toggleNavItemsEnabled(['feature-extraction'], true);
              }
            } else {
              super.toggleNavItemsEnabled(['feature-extraction', 'process'], false);
            }
          }
        }
      } else {
        super.toggleNavItemsEnabled(
          ['data-source', 'windowing', 'feature-extraction'],
          result
        );

        if (!result) {
          super.removeFromSession(['process']);
        }
      }
    });
  }

  switchProcessContent(process) {
    if (process === 'train') {
      this.makeProcessTrain();
    } else if (process === 'test') {
      this.makeProcessTest();
    } else if (process === 'none') {
      sessionStorage.setItem('process-type', process);

      if (sessionStorage.getItem('process-model')) {
        sessionStorage.removeItem('process-model');
      }

      if (sessionStorage.getItem('cross-validation')) {
        sessionStorage.removeItem('cross-validation');
      }
      super.toggleNavItemsEnabled(['data-source'], true);

      const isOnlyLearning = sessionStorage.getItem('only-learning');
      const selectedInput = sessionStorage.getItem('input-content');

      if (selectedInput === null) {
        super.toggleNavItemsEnabled(
          ['windowing', 'feature-extraction', 'process'],
          false
        );
      } else {
        const isWindowingEnable = sessionStorage.getItem('windowing-enabled');
        const isWindowLengthValid = sessionStorage.getItem('windowing-length') > 0;

        if (!isOnlyLearning) {
          super.toggleNavItemsEnabled(['windowing'], true);

          if (!(isWindowingEnable === null)) {
            if (
              (isWindowingEnable === 'true' && isWindowLengthValid) ||
              isWindowingEnable === 'false'
            ) {
              super.toggleNavItemsEnabled(['feature-extraction'], true);
              const isFeaturesFileSave = sessionStorage.getItem('features-save');
              const isFileNameValid = sessionStorage.getItem('features-file');

              if (!(isFeaturesFileSave === null)) {
                if (
                  (isFeaturesFileSave === 'true' && !(isFileNameValid === null)) ||
                  isFeaturesFileSave === 'false'
                ) {
                  super.toggleNavItemsEnabled(['process'], true);
                } else {
                  super.toggleNavItemsEnabled(['process'], false);
                }
              } else {
                super.toggleNavItemsEnabled(['process'], true);
              }
            } else {
              super.toggleNavItemsEnabled(['process'], false);
            }
          } else {
            super.toggleNavItemsEnabled(['feature-extraction', 'process'], false);
          }
        } else {
          super.toggleNavItemsEnabled(['process'], true);
        }
      }

      super.toggleNavItemsEnabled(['process'], false);
      super.removeFromSession(['process']);
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
    const sources = this.context.querySelector('#sources');
    for (let i = 0; i < sources.length; ++i) {
      if (sources[i].value === conf.source) {
        sources[i].selected = true;
      }
    }

    const radios = this.context.querySelectorAll('.switch-group input[type=radio]');

    for (let i = 0; i < radios.length; ++i) {
      if (radios[i].value === conf.process) {
        radios[i].click();
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
      for (let i = 0; i < crossValidationSwitch.length; ++i) {
        const radio = crossValidationSwitch[i];
        if (radio.value === conf['cross-validation'].toString()) {
          radio.setAttribute('checked', true);
        }
      }
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
      .post('/files/conf/import', data, {
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

  makeSelectProcess() {
    const importFileInput = this.context.querySelector('input#import-config');
    const importFileForm = this.context.querySelector('form');

    super.initNavBtn('next', { label: 'data-source', Task: DataSource });
    super.toggleNavBtnEnable('next', false);
    super.toggleNavItemsEnabled(
      ['data-source', 'windowing', 'feature-extraction', 'process'],
      false
    );

    importFileInput.removeEventListener(...importFileInputChange);
    importFileInput.addEventListener(...importFileInputChange);

    importFileForm.removeEventListener(...importFileFormSubmit);
    importFileForm.addEventListener(...importFileFormSubmit);

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

      radio.removeEventListener(...processSwitchChange);
      radio.addEventListener(...processSwitchChange);

      if (radio.checked) {
        this.switchProcessContent(radio.value);
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
