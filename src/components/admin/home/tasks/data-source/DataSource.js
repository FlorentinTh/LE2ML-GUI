import dataSourceTemplate from './data-source.hbs';
import Task from '../Task';
import FileList from '@FileList';
import websocketTemplate from './websocket.hbs';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';

// let existingFilesContainer;
let inputContent;

class DataSource extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.make();
  }

  makeInputWs() {
    inputContent.innerHTML = websocketTemplate();
    super.disableSection('websocket');
  }

  initFileList() {
    const fileList = new FileList(inputContent, 'Existing Data Files', [], 'data');

    getFiles('/files?type=inputs', this.context).then(response => {
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

  makeInputFile() {
    const dataStore = Store.get('input-data');

    if (dataStore === undefined) {
      this.initFileList();
    } else {
      // eslint-disable-next-line no-new
      new FileList(inputContent, 'Existing Data Files', dataStore.data, 'data', false);
    }
  }

  switchInputContent(input) {
    switch (input) {
      case 'file':
        this.makeInputFile();
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
      title: 'Data Source'
    });

    inputContent = this.context.querySelector('.input-content');

    const inputTypeSwitch = this.context.querySelectorAll('.switch-group input');

    for (let i = 0; i < inputTypeSwitch.length; ++i) {
      const radio = inputTypeSwitch[i];
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
    APIHelper.errorsHandler(error, context, true);
  }
}

export default DataSource;
