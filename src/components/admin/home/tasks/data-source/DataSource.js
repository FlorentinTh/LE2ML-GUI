import dataSourceTemplate from './data-source.hbs';
import Task from '../Task';
import FileList from '@FileList';
import websocketTemplate from './websocket.hbs';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';

let existingFilesContainer;

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
