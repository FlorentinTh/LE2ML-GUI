import Component from '@Component';
import featureManagementTemplate from './feature-management.hbs';
import featureListTemplate from './feature-list.hbs';
import formFeatureTemplate from './form-feature.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import StringHelper from '@StringHelper';
import SortHelper from '@SortHelper';

let allFeatures;
let filters;
let filerClickListener;

class FeatureManagement extends Component {
  constructor(reload = false, context = null) {
    super(context);
    this.title = 'Manage Features';
    this.isFiltersDisabled = false;
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
      this.render();
    }
  }

  initView(loading = false) {
    const total = allFeatures === undefined ? 0 : allFeatures.total;
    this.context.innerHTML = featureManagementTemplate({
      title: this.title,
      total: total
    });

    filters = this.context.querySelectorAll('.filters span.filter');

    if (loading) {
      this.buildFeatureList('#features', { defaultSort: false, loading: loading });
    }
  }

  render() {
    this.initView();

    this.addFilterClickListener();
    this.buildFeatureList('#features');

    const addBtn = this.context.querySelector('#add');
    addBtn.addEventListener('click', this.addBtnListener.bind(this), false);

    super.addSearchListener(allFeatures.features, ['slug'], data => {
      allFeatures.features = data;
      this.buildFeatureList('#features');
    });
  }

  enableFilters() {
    filters[0].classList.add('filter-active');

    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];

      if (filter.classList.contains('filter-disabled')) {
        filter.classList.remove('filter-disabled');
      }
      filter.addEventListener(...filerClickListener);
    }
  }

  disableFilters(isEventAdded = true) {
    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];
      if (filter.classList.contains('filter-active')) {
        filter.classList.remove('filter-active');
      }
      filter.classList.add('filter-disabled');
      if (isEventAdded) {
        filter.removeEventListener(...filerClickListener);
      }
    }
  }

  addFilterClickListener() {
    filerClickListener = [
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const filter =
          event.target.tagName === 'SPAN' ? event.target : event.target.parentNode;

        if (filter.className.includes('active')) {
          const sortIcon = filter.children[1].className;
          let className = null;
          if (sortIcon.includes('up')) {
            className = sortIcon.replace('up', 'down');
            filter.dataset.order = 'desc';
          } else {
            className = sortIcon.replace('down', 'up');
            filter.dataset.order = 'asc';
          }
          filter.children[1].className = className;
        } else {
          filters.forEach(fil => {
            if (fil.className.includes('active')) {
              const className = fil.className;
              fil.className = className
                .split(' ')
                .filter(name => name !== 'filter-active');
            }
          });
          const className = filter.className;
          filter.className = className + ' filter-active';
        }
        this.buildFeatureList('#features');
      },
      true
    ];

    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];
      filter.addEventListener(...filerClickListener);
    }
  }

  setDefaultSort(id, data) {
    const elem = this.context.querySelector(id);
    const filters = elem.querySelectorAll('span.filter');

    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];
      if (filter.className.includes('active')) {
        return this.sort(filter.dataset.action, filter.dataset.order, data);
      }
    }
  }

  sort(filter, order, data) {
    if (filter === 'alpha-sort') {
      return SortHelper.sortArrayAlpha(data, 'label', order);
    } else if (filter === 'state-sort') {
      return SortHelper.sortArrayBoolean(data, 'enabled', order);
    } else if (filter === 'container-sort') {
      return SortHelper.sortArrayAlpha(data, 'container', order);
    }
  }

  buildFeatureList(id, opts = { defaultSort: true, loading: false }) {
    const container = document.querySelector(id + ' > .grid-features');

    let features;
    if (opts.loading) {
      features = [];
      container.innerHTML = featureListTemplate({
        features: features,
        loading: opts.loading
      });

      if (!this.isFiltersDisabled) {
        this.disableFilters(false);
      }
    } else {
      features = allFeatures.features;

      if (this.isFiltersDisabled) {
        this.isFiltersDisabled = false;
        this.enableFilters();
      }

      if (opts.defaultSort) {
        features = this.setDefaultSort(id, features);
      }

      container.innerHTML = featureListTemplate({
        features: features,
        loading: opts.loading
      });

      this.setActions(features);

      if (features.length <= 1) {
        this.isFiltersDisabled = true;
        this.disableFilters();
      }
    }
  }

  removeTaskFeatureListStore() {
    const timeFeatureStored = Store.get('time-features');
    const freqFeatureStored = Store.get('freq-features');

    if (!(timeFeatureStored === undefined)) {
      Store.remove('time-features');
    }

    if (!(freqFeatureStored === undefined)) {
      Store.remove('freq-features');
    }
  }

  addBtnListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const content = formFeatureTemplate();
    const elems = ['label', 'domain', 'container', 'enabled'];

    ModalHelper.edit('Add a new feature', content, 'add', elems).then(result => {
      if (result.value) {
        const data = {
          label: result.value.label.toLowerCase(),
          domain: result.value.domain,
          container: StringHelper.toSlug(result.value.container, '-'),
          enabled: result.value.enabled === 'true'
        };

        addFeature('/features', data, this.context).then(response => {
          if (response) {
            ModalHelper.notification(
              'success',
              response.data.label + ' successfully created.'
            );
            this.removeTaskFeatureListStore();
            // eslint-disable-next-line no-new
            new FeatureManagement(true);
          }
        });
      }
    });

    const labelInput = document.querySelector('input#label');
    const containerInput = document.querySelector('input#container');

    this.inputListener(labelInput);
    this.inputListener(containerInput);
  }

  inputListener(input) {
    input.addEventListener(
      'focusout',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        switch (input.id) {
          case 'label':
            input.value = input.value.toLowerCase();
            break;
          case 'container':
            input.value = StringHelper.toSlug(input.value, '-');
            break;
        }
      },
      false
    );
  }

  setActions(features) {
    this.editAction(features);
    this.grantOrRevokeAction(features);
    this.deleteAction(features);
  }

  editAction(features) {
    const buttons = this.context.querySelectorAll('button#edit');

    buttons.forEach(button => {
      const featureId = button.closest('#feature-infos').dataset.feature;
      const feature = features.find(elem => elem._id === featureId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const content = formFeatureTemplate({
          label: feature.label.toLowerCase(),
          domain: feature.domain,
          container: StringHelper.toSlug(feature.container, '-'),
          enabled: feature.enabled
        });

        const elems = ['label', 'domain', 'container', 'enabled'];
        ModalHelper.edit('Edit feature', content, 'update', elems).then(result => {
          if (result.value) {
            const data = result.value;
            updateFeature('/features/' + featureId, data, this.context).then(response => {
              if (response) {
                ModalHelper.notification(
                  'success',
                  response.data.feature.label + ' successfully updated.'
                );
                this.removeTaskFeatureListStore();
                // eslint-disable-next-line no-new
                new FeatureManagement(true);
              }
            });
          }
        });

        const labelInput = document.querySelector('input#label');
        const containerInput = document.querySelector('input#container');

        this.inputListener(labelInput);
        this.inputListener(containerInput);
      });
    });
  }

  grantOrRevokeAction(features) {
    const buttons = this.context.querySelectorAll('button#state');

    buttons.forEach(button => {
      const featureId = button.closest('#feature-infos').dataset.feature;
      const feature = features.find(elem => elem._id === featureId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const data = {
          label: feature.label,
          domain: feature.domain,
          container: feature.container,
          enabled: !feature.enabled
        };

        const askTitle = feature.enabled ? 'Disable feature' : 'Enable Feature';

        const askMessage = feature.enabled
          ? feature.label + ' will be disabled.'
          : feature.label + ' will be enabled.';

        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            const confirmMessage = feature.enabled
              ? feature.label + ' is now disabled.'
              : feature.label + ' is now enabled.';
            updateState('/features/state/' + featureId, data, this.context).then(
              response => {
                if (response) {
                  ModalHelper.notification('success', confirmMessage);
                  this.removeTaskFeatureListStore();
                  // eslint-disable-next-line no-new
                  new FeatureManagement(true);
                }
              }
            );
          }
        });
      });
    });
  }

  deleteAction(features) {
    const buttons = this.context.querySelectorAll('button#delete');
    buttons.forEach(button => {
      const featureId = button.closest('#feature-infos').dataset.feature;
      const feature = features.find(elem => elem._id === featureId);
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const askTitle = 'Delete ' + feature.label + ' ?';
        const askMessage = feature.label + ' will be permanently deleted.';

        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            deleteFeature('/features/' + featureId, this.context).then(response => {
              if (response) {
                ModalHelper.notification(
                  'success',
                  feature.label + ' successfully deleted.'
                );
                this.removeTaskFeatureListStore();
                // eslint-disable-next-line no-new
                new FeatureManagement(true);
              }
            });
          }
        });
      });
    });
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

async function addFeature(url, data, context) {
  try {
    const response = await axios.put(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

async function updateFeature(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

async function updateState(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

async function deleteFeature(url, context) {
  try {
    const response = await axios.delete(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    if (error) {
      APIHelper.errorsHandler(error, context);
    }
  }
}

export default FeatureManagement;
