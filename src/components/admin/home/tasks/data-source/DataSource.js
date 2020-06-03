import dataSourceTemplate from './data-source.hbs';
import Task from '../Task';
import FileList from '@FileList';
import websocketTemplate from './websocket.hbs';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';
import URLHelper from '@URLHelper';
import SelectProcess from '../select-process/SelectProcess';
import Windowing from '../windowing/Windowing';

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

    sessionStorage.setItem('input-type', 'ws');

    const content = this.context.querySelector('input#ws-addr').value;

    if (URLHelper.removeProtocol(content) === '') {
      super.toggleNextBtnEnable(false);
    } else {
      sessionStorage.setItem('input-content', content);
    }
  }

  initFileList(filename, fileType) {
    const fileList = new FileList(
      inputContent,
      fileType === 'raw' ? 'Existing Raw Datasets' : 'Existing Features Datasets',
      [],
      'input-content',
      filename || null
    );

    getFiles('/files?type=' + fileType, this.context).then(response => {
      if (response) {
        const dataStore = Store.get(fileType + '-file-data');

        if (!(dataStore === undefined)) {
          Store.remove(fileType + '-file-data');
        }

        Store.add({
          id: fileType + '-file-data',
          data: response.data
        });

        fileList.setData(response.data);
        fileList.make();
      }
    });

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

  makeInputFile(fileType) {
    const file = sessionStorage.getItem('input-content');

    if (fileType === 'raw') {
      sessionStorage.setItem('input-type', 'raw-file');
    } else {
      sessionStorage.setItem('input-type', 'features-file');
    }

    const dataStore = Store.get(fileType + '-file-data');

    let filename;
    if (!(file === null)) {
      filename = file.split('.')[0];
    }

    let fileList;
    if (dataStore === undefined) {
      fileList = this.initFileList(filename, fileType);
      fileList.on('build', result => {
        if (result) {
          if (this.containsSelected()) {
            super.toggleNextBtnEnable(true);
          } else {
            super.toggleNextBtnEnable(false);
          }
        }
      });
    } else {
      fileList = new FileList(
        inputContent,
        fileType === 'raw' ? 'Existing Raw Datasets' : 'Existing Features Datasets',
        dataStore.data,
        'input-content',
        filename || null,
        false
      );

      if (this.containsSelected()) {
        super.toggleNextBtnEnable(true);
      } else {
        super.toggleNextBtnEnable(false);
      }
    }

    fileList.on('selected', result => {
      super.toggleNextBtnEnable(result);
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
      title: 'Data Source'
    });

    super.initNavBtn('next', { label: 'windowing', Task: Windowing });
    super.initNavBtn('previous', { label: 'select-process', Task: SelectProcess });

    inputContent = this.context.querySelector('.input-content');

    const inputTypeSwitch = this.context.querySelectorAll('.switch-group input');
    const storedInput = sessionStorage.getItem('input-type');

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
    APIHelper.errorsHandler(error, context, true);
  }
}

export default DataSource;
