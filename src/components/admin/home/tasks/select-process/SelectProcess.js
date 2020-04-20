import Task from '../Task';
import selectProcessTemplate from './select-process.hbs';
import FileList from '@FileList';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';

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

      getFiles('/files?type=model', this.context).then(response => {
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

  importFileInputListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    // const file = this.files[0];
  }

  make() {
    this.context.innerHTML = selectProcessTemplate({
      title: 'Process to Achieve'
    });

    const importFileInput = this.context.querySelector('input#import-config');
    importFileInput.addEventListener('change', this.importFileInputListener, false);

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
    APIHelper.errorsHandler(error, context);
  }
}

export default SelectProcess;
