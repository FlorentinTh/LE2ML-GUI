import featuresTemplate from './features.hbs';
import featureListTemplate from './feature-list.hbs';
import Task from '../Task';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';
import Learning from '../learning/Learning';
import Windowing from '../windowing/Windowing';
import configDownloadTemplate from '../config-download.hbs';

let timeFeatures = [];
let freqFeatures = [];
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
        features.push(featureItem.dataset.slug);
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
      target.children[0].classList.remove('fa-square');
      target.children[0].classList.add('fa-check-square');
    } else {
      target.children[0].classList.remove('fa-check-square');
      target.children[0].classList.add('fa-square');
    }

    target.dataset.toggle = !toggle;
  }

  toggleSelected(features) {
    if (!(features instanceof Array)) {
      throw new Error('Argument features must be an Array.');
    }

    for (let i = 0; i < featureItems.length; i++) {
      const item = featureItems[i];

      if (features.includes(item.dataset.slug)) {
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
          .filter(value => value !== item.dataset.slug);

        if (array.length > 0) {
          sessionStorage.setItem('features', array.join(','));
        } else {
          sessionStorage.removeItem('features');
        }
      }
    } else {
      item.classList.add('item-selected');

      if (!(storedFeatures === null)) {
        sessionStorage.setItem('features', storedFeatures + ',' + item.dataset.slug);
      } else {
        sessionStorage.setItem('features', item.dataset.slug);
      }
    }
  }

  buildFeatureList(id, loading = true) {
    const features = id.includes('time') ? timeFeatures.features : freqFeatures.features;
    const container = this.context.querySelector(id + ' > .list-container');

    container.innerHTML = featureListTemplate({
      features: features,
      loading: loading
    });
  }

  initData() {
    const timeStore = Store.get('time-features');
    const freqStore = Store.get('freq-features');

    if (timeStore === undefined && freqStore === undefined) {
      this.renderView(true);

      getFeatures('/features/time', this.context).then(response => {
        if (response) {
          Store.add({
            id: 'time-features',
            data: response.data
          });

          timeFeatures = response.data;

          getFeatures('/features/frequential', this.context).then(response => {
            if (response) {
              Store.add({
                id: 'freq-features',
                data: response.data
              });

              freqFeatures = response.data;
              this.make();
            }
          });
        }
      });
    } else {
      timeFeatures = timeStore.data;
      freqFeatures = freqStore.data;
      this.make();
    }
  }

  renderView(loading = true) {
    this.context.innerHTML = featuresTemplate({
      title: this.title,
      totalTimeFeatures: timeFeatures.total === undefined ? 0 : timeFeatures.total,
      totalFreqFeatures: freqFeatures.total === undefined ? 0 : freqFeatures.total
    });

    this.buildFeatureList('#time-features', loading);
    this.buildFeatureList('#freq-features', loading);
  }

  make() {
    this.renderView(false);

    super.initNavBtn('next', { label: 'process', Task: Learning });
    super.initNavBtn('previous', { label: 'windowing', Task: Windowing });

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

    const processType = sessionStorage.getItem('process-type');

    if (processType === 'none') {
      const nextBtn = this.context.querySelector('.btn-group-nav .next button');
      nextBtn.childNodes[0].textContent = 'Finish ';
      nextBtn.childNodes[1].classList = 'fas fa-flag-checkered';
      this.context.insertAdjacentHTML('beforeend', configDownloadTemplate());
    }

    const storedFeatures = sessionStorage.getItem('features');

    if (!(storedFeatures === null)) {
      this.toggleSelected(storedFeatures.split(','));
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

export default Features;
