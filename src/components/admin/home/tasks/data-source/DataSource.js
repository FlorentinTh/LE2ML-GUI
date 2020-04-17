import dataSourceTemplate from './data-source.hbs';
import Task from '../Task';
import FileList from '@FileList';
import fileUploadTemplate from './file-upload.hbs';
import websocketTemplate from './websocket.hbs';
import axios from 'axios';
import APIHelper from '@APIHelper';

class DataSource extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.make();
  }

  make() {
    this.context.innerHTML = dataSourceTemplate({
      title: 'Data Source'
    });

    const sectionContainer = this.context.querySelector('.section-container');

    getFiles('/files?type=input', this.context).then(response => {
      if (response) {
        // eslint-disable-next-line no-new
        new FileList(sectionContainer, 'Existing Data Files', response.data, 'data');
      }
    });

    const parentContainer = sectionContainer.parentNode;

    parentContainer.insertAdjacentHTML('beforeend', fileUploadTemplate());
    parentContainer.insertAdjacentHTML('beforeend', websocketTemplate());

    super.disableSection('websocket');
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
