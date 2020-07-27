import Component from '@Component';
import featureManagementTemplate from './feature-management.hbs';
import sourceListTemplate from './source-list.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import FeatureContent from './feature-content/FeatureContent';

let allSources;

class FeatureManagement extends Component {
  constructor(context = null) {
    super(context);
    this.title = 'Manage Features';
    this.dataSource = undefined;
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');
    this.initData();
  }

  initData() {
    const storedSources = Store.get('admin-data-sources');

    if (storedSources === undefined) {
      this.render(true);

      getSources('/sources', this.context).then(response => {
        if (response) {
          allSources = response.data.sources;

          Store.add({
            id: 'admin-data-sources',
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
    this.context.innerHTML = featureManagementTemplate({
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
    new FeatureContent(this.dataSource, true, '#features');

    sourceSelect.addEventListener('change', this.sourceChangeHandler.bind(this), false);
  }

  sourceChangeHandler(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.dataSource = event.target.value;
    // eslint-disable-next-line no-new
    new FeatureContent(this.dataSource, true, '#features');
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

export default FeatureManagement;
