import dataSourceTemplate from './data-source.hbs';
import Task from '../Task';
import FileList from '@FileList';
import fileUploadTemplate from './file-upload.hbs';
import websocketTemplate from './websocket.hbs';

const files = [
  {
    filename: 'file-1',
    format: 'json',
    size: '4200',
    dateCreated: '2020-04-13T22:57:45.367+00:00'
  },
  {
    filename: 'file-0',
    format: 'csv',
    size: '8000',
    dateCreated: '2020-04-02T12:29:57.493+00:00'
  },
  {
    filename: 'file-3',
    format: 'csv',
    size: '2000',
    dateCreated: '2020-04-03T12:45:42.567+00:00'
  }
];

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
    // eslint-disable-next-line no-new
    new FileList(sectionContainer, 'Existing Data Files', files, 'data');

    const parentContainer = sectionContainer.parentNode;

    parentContainer.insertAdjacentHTML('beforeend', fileUploadTemplate());
    parentContainer.insertAdjacentHTML('beforeend', websocketTemplate());

    super.disableSection('websocket');
  }
}

export default DataSource;
