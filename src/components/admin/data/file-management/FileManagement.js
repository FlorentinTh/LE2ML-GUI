import Component from '@Component';
import fileManagementTemplate from './file-management.hbs';
import sourceListTemplate from './source-list.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import FileContent from './file-content/FileContent';

let allSources;

class FileManagement extends Component {
  constructor(context = null) {
    super(context);
    this.title = 'Manage Data Files';
    this.dataSource = undefined;
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('data');
    this.initData();
  }

  initData() {
    const storedSources = Store.get('files-data-sources');

    if (storedSources === undefined) {
      this.render(true);

      getSources('/sources', this.context).then(response => {
        if (response) {
          allSources = response.data.sources;

          Store.add({
            id: 'files-data-sources',
            data: allSources
          });

          this.make();
        }
      });
    } else {
      allSources = storedSources.data;
      this.make();
    }
  }

  render(loading = true) {
    this.context.innerHTML = fileManagementTemplate({
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
    this.dataSource = sourceSelect.options[sourceSelect.selectedIndex].value;

    // eslint-disable-next-line no-new
    new FileContent(this.dataSource, false, 'models', '#file-content');

    sourceSelect.addEventListener('change', this.sourceChangeHandler.bind(this), false);
  }

  sourceChangeHandler(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.dataSource = event.target.value;
    // eslint-disable-next-line no-new
    new FileContent(this.dataSource, true, 'models', '#file-content');
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

export default FileManagement;
