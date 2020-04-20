import featuresTemplate from './features.hbs';
import featureListTemplate from './feature-list.hbs';
import Task from '../Task';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';

let timeFeatures;
let freqFeatures;
let featureItems;

class Features extends Task {
  constructor(context) {
    super(context);
    this.context = context;

    const timeStore = Store.get('time-features');
    const freqStore = Store.get('freq-features');

    if (timeStore === undefined && freqStore === undefined) {
      getFeatures('/features', this.context).then(response => {
        if (response) {
          Store.add({
            id: 'time-features',
            data: response.data
          });

          timeFeatures = response.data;

          getFeatures('/features?domain=frequential', this.context).then(response => {
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

  toggleSelected(toggle) {
    for (let i = 0; i < featureItems.length; ++i) {
      const featureItem = featureItems[i];
      if (toggle) {
        featureItem.classList.remove('item-selected');
      } else {
        featureItem.classList.add('item-selected');
      }
    }
  }

  selectToggleClickListener() {
    event.preventDefault();
    event.stopImmediatePropagation();

    let target = event.target;
    if (!(event.target.tagName === 'BUTTON')) {
      target = event.target.parentNode;
    }

    const toggle = target.dataset.toggle === 'true';
    this.toggleSelected(toggle);

    if (toggle) {
      target.children[0].classList.remove('fa-square');
      target.children[0].classList.add('fa-check-square');
    } else {
      target.children[0].classList.remove('fa-check-square');
      target.children[0].classList.add('fa-square');
    }

    target.dataset.toggle = !toggle;
  }

  featureClickListener() {
    event.preventDefault();
    event.stopImmediatePropagation();

    let item = event.target;
    if (!(event.target.tagName === 'DIV')) {
      item = event.target.parentNode;
    }

    if (item.classList.contains('item-selected')) {
      item.classList.remove('item-selected');
    } else {
      item.classList.add('item-selected');
    }
  }

  buildFeatureList(id) {
    const features = id.includes('time') ? timeFeatures.features : freqFeatures.features;
    const container = this.context.querySelector(id + ' > .list-container');

    container.innerHTML = featureListTemplate({
      features: features
    });
  }

  make() {
    this.context.innerHTML = featuresTemplate({
      title: 'Feature Extraction',
      totalTimeFeatures: timeFeatures.total,
      totalFreqFeatures: freqFeatures.total
    });

    this.buildFeatureList('#time-features');
    this.buildFeatureList('#freq-features');

    featureItems = this.context.querySelectorAll('.feature-item');

    for (let i = 0; i < featureItems.length; ++i) {
      const featureItem = featureItems[i];
      featureItem.addEventListener('click', this.featureClickListener.bind(this), false);
    }

    const selectToggle = this.context.querySelector('#select-toggle');
    selectToggle.addEventListener(
      'click',
      this.selectToggleClickListener.bind(this),
      false
    );
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
