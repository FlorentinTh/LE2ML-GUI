import Component from '@Component';
import featureContentTemplate from './feature-content.hbs';
import featureListTemplate from './feature-list.hbs';
import formFeatureTemplate from './form-feature.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import { Filters, FilterType } from '@Filters';
import Search from '@Search';

let allFeatures;
let featuresFilters;

class FeatureContent extends Component {
  constructor(dataSource, reload = false, context = null) {
    super(context);
    this.dataSource = dataSource;
    this.isFiltersDisabled = false;
    this.reload = reload;
    this.mount();
  }

  mount() {
    this.initData();
  }

  initData() {
    const featureStore = Store.get('feature-content');

    if (this.reload || featureStore === undefined) {
      this.initView(true);
      getFeatures(`/features?source=${this.dataSource}`, this.context)
        .then(response => {
          if (response) {
            Store.add({
              id: 'feature-content',
              data: response.data
            });
            allFeatures = response.data;
            this.render();
          }
        })
        .catch(error => {
          ModalHelper.notification('error', error);
        });
    } else {
      this.render();
    }
  }

  initView(loading = false) {
    const total = allFeatures === undefined ? 0 : allFeatures.total;
    this.context.innerHTML = featureContentTemplate({
      total
    });

    const filters = this.context.querySelectorAll('.filters span.filter');
    featuresFilters = new Filters(filters, FilterType.DEFAULT);

    if (loading) {
      this.buildFeatureList('#features', { defaultSort: false, loading });
    }
  }

  render() {
    this.initView();

    featuresFilters.addFilterClickListener(() => {
      this.buildFeatureList('#features');
    });
    this.buildFeatureList('#features');

    const addBtn = this.context.querySelector('#add');
    addBtn.addEventListener('click', this.addBtnListener.bind(this), false);

    Search.addSearchListener(allFeatures.features, ['slug'], data => {
      allFeatures.features = data;
      this.buildFeatureList('#features');
    });
  }

  buildFeatureList(id, opts = { defaultSort: true, loading: false }) {
    const container = document.querySelector('.grid-features');

    let features;
    if (opts.loading) {
      features = [];
      container.innerHTML = featureListTemplate({
        features,
        loading: opts.loading
      });

      if (!this.isFiltersDisabled) {
        featuresFilters.disableFilters(false);
      }
    } else {
      features = allFeatures.features;

      if (this.isFiltersDisabled) {
        this.isFiltersDisabled = false;
        featuresFilters.enableFilters();
      }

      if (opts.defaultSort) {
        features = featuresFilters.setDefaultSort(features);
      }

      container.innerHTML = featureListTemplate({
        features,
        loading: opts.loading
      });

      this.setActions(features);

      if (features === undefined || features.length <= 1) {
        this.isFiltersDisabled = true;
        featuresFilters.disableFilters();
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

    ModalHelper.edit('Add a new feature', content, 'add', elems)
      .then(result => {
        if (result.value) {
          const data = {
            label: result.value.label.toLowerCase(),
            domain: result.value.domain,
            container: result.value.container,
            enabled: result.value.enabled === 'true',
            source: this.dataSource.toLowerCase()
          };

          addFeature('/features', data, this.context)
            .then(response => {
              if (response) {
                ModalHelper.notification(
                  'success',
                  response.data.label + ' successfully created.'
                );
                this.removeTaskFeatureListStore();
                // eslint-disable-next-line no-new
                new FeatureContent(this.dataSource, true, '#features');
              }
            })
            .catch(error => {
              ModalHelper.notification('error', error);
            });
        }
      })
      .catch(error => {
        ModalHelper.notification('error', error);
      });

    const labelInput = document.querySelector('input#label');
    const containerInput = document.querySelector('input#container');

    this.inputListener(labelInput);
    this.inputListener(containerInput);
  }

  inputListener(input) {
    input.addEventListener(
      'input',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        switch (input.id) {
          case 'label':
            input.value = input.value.replace(/[^\s0-9a-zA-Z-]/gi, '').toLowerCase();
            break;
          case 'container':
            input.value = input.value.replace(/[^0-9a-zA-Z-]/gi, '-').toLowerCase();
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
          container: feature.container,
          enabled: feature.enabled
        });

        const elems = ['label', 'domain', 'container', 'enabled'];
        ModalHelper.edit('Edit feature', content, 'update', elems)
          .then(result => {
            if (result.value) {
              const data = result.value;
              updateFeature('/features/' + featureId, data, this.context)
                .then(response => {
                  if (response) {
                    ModalHelper.notification(
                      'success',
                      response.data.feature.label + ' successfully updated.'
                    );
                    this.removeTaskFeatureListStore();
                    // eslint-disable-next-line no-new
                    new FeatureContent(this.dataSource, true, '#features');
                  }
                })
                .catch(error => {
                  ModalHelper.notification('error', error);
                });
            }
          })
          .catch(error => {
            ModalHelper.notification('error', error);
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

        ModalHelper.confirm(askTitle, askMessage)
          .then(result => {
            if (result.value) {
              const confirmMessage = feature.enabled
                ? feature.label + ' is now disabled.'
                : feature.label + ' is now enabled.';
              updateState(`/features/${featureId}/state`, data, this.context)
                .then(response => {
                  if (response) {
                    ModalHelper.notification('success', confirmMessage);
                    this.removeTaskFeatureListStore();
                    // eslint-disable-next-line no-new
                    new FeatureContent(this.dataSource, true, '#features');
                  }
                })
                .catch(error => {
                  ModalHelper.notification('error', error);
                });
            }
          })
          .catch(error => {
            ModalHelper.notification('error', error);
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

        ModalHelper.confirm(askTitle, askMessage)
          .then(result => {
            if (result.value) {
              deleteFeature('/features/' + featureId, this.context)
                .then(response => {
                  if (response) {
                    ModalHelper.notification(
                      'success',
                      feature.label + ' successfully deleted.'
                    );
                    this.removeTaskFeatureListStore();
                    // eslint-disable-next-line no-new
                    new FeatureContent(this.dataSource, true, '#features');
                  }
                })
                .catch(error => {
                  ModalHelper.notification('error', error);
                });
            }
          })
          .catch(error => {
            ModalHelper.notification('error', error);
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
    APIHelper.errorsHandler(error, true);
  }
}

async function addFeature(url, data, context) {
  try {
    const response = await axios.put(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function updateFeature(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function updateState(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
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
      APIHelper.errorsHandler(error, true);
    }
  }
}

export default FeatureContent;
