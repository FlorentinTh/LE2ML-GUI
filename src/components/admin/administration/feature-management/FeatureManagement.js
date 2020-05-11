import Component from '@Component';
import featureManagementTemplate from './feature-management.hbs';
import featureListTemplate from './feature-list.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';

let allFeatures;

class FeatureManagement extends Component {
  constructor(reload = false, context = null) {
    super(context);
    this.title = 'Manage Features';
    this.reload = reload;
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');
    this.initData();
  }

  initData() {
    const featureStore = Store.get('features');

    if (this.reload || featureStore === undefined) {
      this.initView(true);
      getFeatures('/features', this.context).then(response => {
        if (response) {
          Store.add({
            id: 'features',
            data: response.data
          });
          allFeatures = response.data;
          this.render();
        }
      });
    } else {
      allFeatures = featureStore.data;
      this.render();
    }
  }

  initView(loading = false) {
    const total = allFeatures === undefined ? 0 : allFeatures.total;
    this.context.innerHTML = featureManagementTemplate({
      title: this.title,
      total: total
    });

    if (loading) {
      this.buildFeatureList('#features', { defaultSort: false, loading: loading });
    }
  }

  render() {
    this.initView();
    this.buildFeatureList('#features');

    super.addSearchListener(allFeatures.features, ['slug'], data => {
      allFeatures.features = data;
      this.buildFeatureList('#features');
    });
  }

  buildFeatureList(id, opts = { defaultSort: true, loading: false }) {
    const container = document.querySelector(id + ' > .grid-features');

    if (opts.loading) {
      container.innerHTML = featureListTemplate({
        features: [],
        loading: opts.loading
      });
    } else {
      container.innerHTML = featureListTemplate({
        features: allFeatures.features,
        loading: opts.loading
      });
    }
  }
}

async function getFeatures(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context, true);
  }
}

export default FeatureManagement;
