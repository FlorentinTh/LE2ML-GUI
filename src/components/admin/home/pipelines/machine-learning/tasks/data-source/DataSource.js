import Task from '../Task';
import dataSourceTemplate from './data-source.hbs';
import FileList from '@FileList';
import websocketTemplate from './websocket.hbs';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';
import URLHelper from '@URLHelper';
import SelectProcess from '../select-process/SelectProcess';
import Windowing from '../windowing/Windowing';
import Learning from '../learning/Learning';

let inputContent;

class DataSource extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.title = 'Input Source';
    this.make();
  }

  makeInputWs() {
    inputContent.innerHTML = websocketTemplate();
    super.disableSection('websocket');

    sessionStorage.setItem('input-type', 'ws');

    const content = this.context.querySelector('input#ws-addr').value;

    if (URLHelper.removeProtocol(content) === '') {
      super.toggleNavBtnEnable('next', false);
      super.toggleNavItemsEnabled(['windowing', 'feature-extraction', 'process'], false);
    } else {
      sessionStorage.setItem('input-content', content);
    }
  }

  initFileList(filename, inputType) {
    const fileList = new FileList(
      inputContent,
      inputType === 'raw' ? 'Existing Raw Datasets' : 'Existing Features Datasets',
      [],
      'input-content',
      filename || null
    );

    const storedDataSource = sessionStorage.getItem('data-source');

    getFiles(`/files?source=${storedDataSource}&type=${inputType}`, this.context).then(
      response => {
        if (response) {
          const dataStore = Store.get(inputType + '-file-data');

          if (!(dataStore === undefined)) {
            Store.remove(inputType + '-file-data');
          }

          Store.add({
            id: inputType + '-file-data',
            data: response.data
          });

          fileList.setData(response.data);
          fileList.make();
        }
      }
    );

    return fileList;
  }

  containsSelected() {
    const files = this.context.querySelectorAll('.file-list table tbody tr');
    for (let i = 0; i < files.length; ++i) {
      const file = files[i];
      if (file.className.includes('selected')) {
        return true;
      }
    }
    return false;
  }

  makeInputFile(inputType) {
    const file = sessionStorage.getItem('input-content');

    if (inputType === 'raw') {
      sessionStorage.setItem('input-type', 'raw-file');
      super.clearNavButton('next');
      super.initNavBtn('next', { label: 'windowing', Task: Windowing });

      if (sessionStorage.getItem('only-learning')) {
        sessionStorage.removeItem('only-learning');
      }
    } else {
      sessionStorage.setItem('input-type', 'features-file');
      sessionStorage.setItem('only-learning', true);
      super.clearNavButton('next');
      super.initNavBtn('next', { label: 'process', Task: Learning });
    }

    const dataStore = Store.get(inputType + '-file-data');

    let filename;
    if (!(file === null)) {
      filename = file.split('.')[0];
    }

    let fileList;
    if (dataStore === undefined) {
      fileList = this.initFileList(filename, inputType);
      fileList.on('build', result => {
        if (result) {
          if (this.containsSelected()) {
            if (inputType === 'features') {
              super.toggleNavItemsEnabled(['process'], true);
            } else {
              const isWindowingEnable = sessionStorage.getItem('windowing-enabled');
              const isWindowLengthValid = sessionStorage.getItem('windowing-length') > 0;

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
            }
            super.toggleNavBtnEnable('next', true);
          } else {
            super.toggleNavBtnEnable('next', false);
            super.toggleNavItemsEnabled(
              ['windowing', 'feature-extraction', 'process'],
              false
            );

            if (!(sessionStorage.getItem('input-content') === null)) {
              sessionStorage.removeItem('input-content');
            }
          }
        }
      });
    } else {
      fileList = new FileList(
        inputContent,
        inputType === 'raw' ? 'Existing Raw Datasets' : 'Existing Features Datasets',
        dataStore.data,
        'input-content',
        filename || null,
        false
      );

      if (this.containsSelected()) {
        if (inputType === 'features') {
          super.toggleNavItemsEnabled(['process'], true);
        } else {
          const isWindowingEnable = sessionStorage.getItem('windowing-enabled');
          const isWindowLengthValid = sessionStorage.getItem('windowing-length') > 0;

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
        }
        super.toggleNavBtnEnable('next', true);
      } else {
        super.toggleNavBtnEnable('next', false);
        super.toggleNavItemsEnabled(
          ['windowing', 'feature-extraction', 'process'],
          false
        );

        if (!(sessionStorage.getItem('input-content') === null)) {
          sessionStorage.removeItem('input-content');
        }
      }
    }

    fileList.on('selected', result => {
      if (inputType === 'features') {
        super.toggleNavItemsEnabled(['process'], result);
      } else {
        if (result) {
          const isWindowingEnable = sessionStorage.getItem('windowing-enabled');
          const isWindowLengthValid = sessionStorage.getItem('windowing-length') > 0;

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
          super.toggleNavItemsEnabled(
            ['windowing', 'feature-extraction', 'process'],
            result
          );
        }
      }
      super.toggleNavBtnEnable('next', result);
    });
  }

  switchInputContent(input) {
    switch (input) {
      case 'raw-file':
        this.makeInputFile('raw');
        break;
      case 'features-file':
        this.makeInputFile('features');
        break;
      case 'ws':
        this.makeInputWs();
        break;
    }
  }

  inputSwitchHandler(event) {
    event.stopImmediatePropagation();
    if (event.target.checked) {
      inputContent.innerHTML = '';
      const value = event.target.value;
      this.switchInputContent(value);
    }
  }

  make() {
    this.context.innerHTML = dataSourceTemplate({
      title: this.title
    });

    super.initNavBtn('previous', { label: 'select-process', Task: SelectProcess });

    inputContent = this.context.querySelector('.input-content');

    const inputTypeSwitch = this.context.querySelectorAll('.switch-group input');

    const storedProcess = sessionStorage.getItem('process-type');

    let storedInput = sessionStorage.getItem('input-type');

    if (storedProcess === 'none') {
      inputTypeSwitch[1].setAttribute('disabled', true);

      const label = this.context.querySelector('label[for=switch-feature-file]');
      label.classList.add('disabled');

      if (storedInput) {
        sessionStorage.removeItem('input-type');
        storedInput = sessionStorage.getItem('input-type');
      }
    }

    if (!storedInput) {
      inputTypeSwitch[0].setAttribute('checked', true);
    }

    for (let i = 0; i < inputTypeSwitch.length; ++i) {
      const radio = inputTypeSwitch[i];

      if (storedInput) {
        if (radio.value === storedInput) {
          radio.setAttribute('checked', true);
        }
      }

      radio.addEventListener('change', this.inputSwitchHandler.bind(this), false);

      if (radio.checked) {
        this.switchInputContent(radio.value);
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

export default DataSource;
