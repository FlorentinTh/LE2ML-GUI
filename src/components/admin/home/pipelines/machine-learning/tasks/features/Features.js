import featuresTemplate from './features.hbs';
import inertialContainerTemplate from './inertial-data/inertial-container.hbs';
import defaultContainerTemplate from './default/default-container.hbs';
import featureListTemplate from './feature-list.hbs';
import Task from '../Task';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';
import Learning from '../learning/Learning';
import Windowing from '../windowing/Windowing';
import configDownloadTemplate from '../config-download.hbs';

let allFeatures = [];
// const timeFeatures = [];
// const freqFeatures = [];
let featureItems;

class Features extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.title = 'Feature Extraction';
    this.initData();
  }

  toggleSelectedAll(toggle) {
    const storedFeatures = sessionStorage.getItem('features');
    const features = [];

    if (!(storedFeatures === null)) {
      sessionStorage.removeItem('features');
    }

    for (let i = 0; i < featureItems.length; ++i) {
      const featureItem = featureItems[i];

      if (toggle) {
        featureItem.classList.remove('item-selected');
      } else {
        featureItem.classList.add('item-selected');
        features.push(featureItem.dataset.container + '.' + featureItem.dataset.slug);
      }
    }

    if (!toggle && features.length > 0) {
      sessionStorage.setItem('features', features);
    }
  }

  selectAllToggleClickListener() {
    event.preventDefault();
    event.stopImmediatePropagation();

    let target = event.target;
    if (!(event.target.tagName === 'BUTTON')) {
      target = event.target.parentNode;
    }

    const toggle = target.dataset.toggle === 'true';
    this.toggleSelectedAll(toggle);

    if (toggle) {
      target.children[0].classList.remove('fa-check-square');
      target.children[0].classList.add('fa-square');
    } else {
      target.children[0].classList.remove('fa-square');
      target.children[0].classList.add('fa-check-square');
    }

    target.dataset.toggle = !toggle;
  }

  toggleSelected(features) {
    if (!(features instanceof Array)) {
      throw new Error('Argument features must be an Array.');
    }

    for (let i = 0; i < featureItems.length; ++i) {
      const item = featureItems[i];

      const featureName = item.dataset.container + '.' + item.dataset.slug;
      if (features.includes(featureName)) {
        if (!item.classList.contains('item-selected')) {
          item.classList.add('item-selected');
        }
      }
    }
  }

  featureClickListener() {
    event.preventDefault();
    event.stopImmediatePropagation();

    let item = event.target;

    if (!(event.target.tagName === 'DIV')) {
      item = event.target.parentNode;
    }

    const storedFeatures = sessionStorage.getItem('features');

    if (item.classList.contains('item-selected')) {
      item.classList.remove('item-selected');

      if (!(storedFeatures === null)) {
        const array = storedFeatures
          .split(',')
          .filter(value => value !== item.dataset.container + '.' + item.dataset.slug);

        if (array.length > 0) {
          sessionStorage.setItem('features', array.join(','));
        } else {
          sessionStorage.removeItem('features');
        }
      }
    } else {
      item.classList.add('item-selected');

      if (!(storedFeatures === null)) {
        sessionStorage.setItem(
          'features',
          storedFeatures + ',' + item.dataset.container + '.' + item.dataset.slug
        );
      } else {
        sessionStorage.setItem(
          'features',
          item.dataset.container + '.' + item.dataset.slug
        );
      }
    }
  }

  buildFeatureList(id, loading = true) {
    let features = [];

    if (allFeatures.features) {
      if (id.includes('time')) {
        features = allFeatures.features.filter(feature => {
          return feature.domain === 'time';
        });
      } else if (id.includes('freq')) {
        features = allFeatures.features.filter(feature => {
          return feature.domain === 'frequential';
        });
      } else {
        features = allFeatures.features;
      }
    }

    const container = this.context.querySelector(id + ' > .list-container');

    container.innerHTML = featureListTemplate({
      features: features,
      loading: loading
    });
  }

  initData() {
    const featuresStore = Store.get('features-source');
    const dataSource = sessionStorage.getItem('data-source');
    if (featuresStore === undefined) {
      this.renderView(true);
      getFeatures(`/features/source/${dataSource}`, this.context).then(response => {
        if (response) {
          Store.add({
            id: 'features-source',
            data: response.data
          });

          allFeatures = response.data;
          this.make();
        }
      });
    } else {
      allFeatures = featuresStore.data;
      this.make();
    }
  }

  renderView(loading = true) {
    this.context.innerHTML = featuresTemplate({
      title: this.title
    });

    const dataSource = sessionStorage.getItem('data-source');
    const container = this.context.querySelector('#feature-list-container');

    if (dataSource === 'inertial') {
      let timeFeatures = [];
      let freqFeatures = [];

      if (allFeatures.features) {
        timeFeatures = allFeatures.features.filter(feature => {
          return feature.domain === 'time';
        });
        freqFeatures = allFeatures.features.filter(feature => {
          return feature.domain === 'frequential';
        });
      }

      container.innerHTML = inertialContainerTemplate({
        totalTimeFeatures: timeFeatures.total === undefined ? 0 : timeFeatures.total,
        totalFreqFeatures: freqFeatures.total === undefined ? 0 : freqFeatures.total
      });

      this.buildFeatureList('#time-features', loading);
      this.buildFeatureList('#freq-features', loading);
    } else {
      container.innerHTML = defaultContainerTemplate({
        totalFeatures: allFeatures.total === undefined ? 0 : allFeatures.total
      });

      this.buildFeatureList('#all-features', loading);
    }
  }

  initNav() {
    const processType = sessionStorage.getItem('process-type');

    if (processType === 'none') {
      const firstNav = this.context.querySelector('.btn-group-nav').children[0];

      if (firstNav.classList.contains('next')) {
        firstNav.classList.remove('next');
        firstNav.classList.add('finish');
      }

      super.initFinishBtn(() => {
        super.finishBtnHandler();
      });

      const icon = firstNav.children[0].children[0];

      if (icon.classList.contains('fa-arrow-right')) {
        icon.classList.remove('fa-arrow-right');
        icon.classList.add('fa-paper-plane');
      }

      this.context.insertAdjacentHTML('beforeend', configDownloadTemplate());

      const downloadBtn = this.context.querySelector('#download-config');
      downloadBtn.addEventListener(
        'click',
        super.downloadBtnClickListener.bind(this),
        false
      );
    } else {
      super.initNavBtn('next', { label: 'process', Task: Learning });
    }

    super.initNavBtn('previous', { label: 'windowing', Task: Windowing });
  }

  make() {
    this.renderView(false);
    this.initNav();

    featureItems = this.context.querySelectorAll('.feature-item');

    for (let i = 0; i < featureItems.length; ++i) {
      const featureItem = featureItems[i];
      featureItem.addEventListener('click', this.featureClickListener.bind(this), false);
    }

    const selectAllToggle = this.context.querySelector('#select-all-toggle');

    selectAllToggle.addEventListener(
      'click',
      this.selectAllToggleClickListener.bind(this),
      false
    );

    const storedFeatures = sessionStorage.getItem('features');

    if (!(storedFeatures === null)) {
      this.toggleSelected(storedFeatures.split(','));
    }

    super.toggleNavItemsEnabled(['data-source', 'windowing'], true);
  }
}

async function getFeatures(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });

    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

export default Features;
