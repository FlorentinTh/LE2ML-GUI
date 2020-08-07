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
let featureItems;

class Features extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.title = 'Feature Extraction';
    this.selectedFeaturesCount = 0;
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
      this.selectedFeaturesCount = 0;

      const fileSave = sessionStorage.getItem('features-save');
      if (fileSave === 'true') {
        super.toggleNavItemsEnabled(['process'], false);
      }
    } else {
      target.children[0].classList.remove('fa-square');
      target.children[0].classList.add('fa-check-square');
      this.selectedFeaturesCount = allFeatures.total;

      const fileSave = sessionStorage.getItem('features-save');
      const fileSaveInput = this.context.querySelector('#save-filename');
      if (fileSave === 'true' && !(fileSaveInput.value === '')) {
        super.toggleNavItemsEnabled(['process'], true);
      }
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
      this.selectedFeaturesCount--;

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
      this.selectedFeaturesCount++;

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

    const fileSave = sessionStorage.getItem('features-save');
    const fileSaveInput = this.context.querySelector('#save-filename');
    if (fileSave === 'true' && !(fileSaveInput.value === '')) {
      if (this.selectedFeaturesCount > 0) {
        super.toggleNavItemsEnabled(['process'], true);
      } else {
        super.toggleNavItemsEnabled(['process'], false);
      }
    }

    const toggleAllBtn = this.context.querySelector('#select-all-toggle');
    if (allFeatures.total === this.selectedFeaturesCount) {
      if (toggleAllBtn.dataset.toggle === 'false') {
        toggleAllBtn.dataset.toggle = 'true';
        toggleAllBtn.children[0].classList.remove('fa-square');
        toggleAllBtn.children[0].classList.add('fa-check-square');
      }
    } else {
      if (toggleAllBtn.dataset.toggle === 'true') {
        toggleAllBtn.dataset.toggle = 'false';
        toggleAllBtn.children[0].classList.remove('fa-check-square');
        toggleAllBtn.children[0].classList.add('fa-square');
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
        totalTimeFeatures: timeFeatures.length,
        totalFreqFeatures: freqFeatures.length
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

  filenameInputListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const value = event.target.value;

    if (!(value === '')) {
      super.toggleNavBtnEnable('next', true);

      if (this.selectedFeaturesCount > 0) {
        super.toggleNavItemsEnabled(['process'], true);
      }

      sessionStorage.setItem('features-file', value + '.csv');
    } else {
      super.toggleNavBtnEnable('next', false);
      super.toggleNavItemsEnabled(['process'], false);
      sessionStorage.removeItem('features-file');
    }
  }

  make() {
    this.renderView(false);
    this.initNav();

    super.toggleNavItemsEnabled(['data-source', 'windowing'], true);

    const storedSaveFeatures = sessionStorage.getItem('features-save');
    const storedFeaturesFile = sessionStorage.getItem('features-file');

    const filenameInput = this.context.querySelector('input#save-filename');

    if (storedSaveFeatures === null) {
      if (!(storedFeaturesFile === null)) {
        sessionStorage.removeItem('features-file');
      }
      sessionStorage.setItem('features-save', false);
    }

    if (storedSaveFeatures === 'true') {
      this.context.querySelector('#switch-on').checked = true;
      filenameInput.style.display = 'block';

      if (storedFeaturesFile === null) {
        super.toggleNavBtnEnable('next', false);
        super.toggleNavItemsEnabled(['process'], false);
      } else {
        filenameInput.value = storedFeaturesFile.split('.')[0];
        super.toggleNavBtnEnable('next', true);
        super.toggleNavItemsEnabled(['process'], true);
      }
    } else {
      this.context.querySelector('#switch-off').checked = true;
      filenameInput.style.display = 'none';
      super.toggleNavBtnEnable('next', true);
      super.toggleNavItemsEnabled(['process'], true);

      if (!(storedFeaturesFile === null)) {
        sessionStorage.removeItem('features-file');
      }
    }

    const switchInputs = this.context.querySelectorAll(
      'div.switch-save-file input[name="switch-save"]'
    );

    for (let i = 0; i < switchInputs.length; ++i) {
      const input = switchInputs[i];
      input.addEventListener('change', event => {
        if (event.target.id === 'switch-on') {
          sessionStorage.setItem('features-save', true);
          this.context.querySelector('#switch-on').checked = true;
          filenameInput.style.display = 'block';

          if (filenameInput.value === '') {
            super.toggleNavBtnEnable('next', false);
            super.toggleNavItemsEnabled(['process'], false);
          }
        } else {
          sessionStorage.setItem('features-save', false);
          filenameInput.style.display = 'none';
          super.toggleNavBtnEnable('next', true);
          super.toggleNavItemsEnabled(['process'], true);

          if (!(sessionStorage.getItem('features-file') === null)) {
            sessionStorage.removeItem('features-file');
            filenameInput.value = '';
          }
        }
      });
    }

    filenameInput.addEventListener('input', this.filenameInputListener.bind(this), false);

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
      this.selectedFeaturesCount = storedFeatures.split(',').length;

      const toggleAllBtn = this.context.querySelector('#select-all-toggle');
      if (allFeatures.total === this.selectedFeaturesCount) {
        if (toggleAllBtn.dataset.toggle === 'false') {
          toggleAllBtn.dataset.toggle = 'true';
          toggleAllBtn.children[0].classList.remove('fa-square');
          toggleAllBtn.children[0].classList.add('fa-check-square');
        }
      } else {
        if (toggleAllBtn.dataset.toggle === 'true') {
          toggleAllBtn.dataset.toggle = 'false';
          toggleAllBtn.children[0].classList.remove('fa-check-square');
          toggleAllBtn.children[0].classList.add('fa-square');
        }
      }
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
    APIHelper.errorsHandler(error, true);
  }
}

export default Features;
