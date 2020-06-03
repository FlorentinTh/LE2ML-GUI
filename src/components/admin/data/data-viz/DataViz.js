import Component from '@Component';
import dataVizTemplate from './data-viz.hbs';
import fileListTemplate from './file-list.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';

let rawFiles;
let featuresFiles;
class DataViz extends Component {
  constructor(context = null) {
    super(context);
    this.title = 'Data Visualisation';
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('data');
    this.initData();
  }

  initData() {
    const rawStore = Store.get('raw-files');
    const featuredStore = Store.get('features-files');

    if (rawStore === undefined || featuredStore === undefined) {
      this.render(true);

      getFiles('/files?type=raw', this.context).then(response => {
        if (response) {
          Store.add({
            id: 'raw-files',
            data: response.data
          });

          rawFiles = response.data;

          getFiles('/files?type=features', this.context).then(response => {
            if (response) {
              Store.add({
                id: 'features-files',
                data: response.data
              });

              featuresFiles = response.data;
              this.make();
            }
          });
        }
      });
    } else {
      rawFiles = rawStore.data;
      featuresFiles = featuredStore.data;
      this.make();
    }
  }

  render(loading = true) {
    this.context.innerHTML = dataVizTemplate({
      title: this.title
    });

    this.buildFileList('#raw', loading);
    this.buildFileList('#features', loading);
  }

  buildFileList(id, loading = true) {
    const files = id.includes('raw') ? rawFiles : featuresFiles;

    const optGroup = this.context.querySelector(id);
    optGroup.innerHTML = fileListTemplate({
      files: files,
      loading: loading
    });
  }

  make() {
    this.render(false);
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

export default DataViz;
