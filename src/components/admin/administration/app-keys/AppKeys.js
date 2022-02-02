import Component from '@Component';
import appKeysTemplate from './app-keys.hbs';
import appKeysListTemplate from './app-keys-list.hbs';
import formAppKeysTemplate from './form-app-keys.hbs';
import formCopyKeyTemplate from './form-copy-key.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import { Filters, FilterType } from '@Filters';
import Search from '@Search';

let allAppKeys;
let appKeysFilters;

class AppKeys extends Component {
  constructor(reload = false, context = null) {
    super(context);
    this.title = 'App Keys';
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
    const sotredAppKeys = Store.get('app-keys');

    if (this.reload || sotredAppKeys === undefined) {
      this.initView(true);
      getKeys('/apps/keys', this.context)
        .then(response => {
          if (response) {
            Store.add({
              id: 'app-keys',
              data: response.data
            });
            allAppKeys = response.data;
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
    const total = allAppKeys === undefined ? 0 : allAppKeys.total;
    this.context.innerHTML = appKeysTemplate({
      title: this.title,
      total
    });

    const filters = this.context.querySelectorAll('.filters span.filter');

    appKeysFilters = new Filters(filters, FilterType.APP_KEYS);

    if (loading) {
      this.buildAppKeysList('#app-keys', { defaultSort: false, loading });
    }
  }

  render() {
    this.initView();

    appKeysFilters.addFilterClickListener(() => {
      this.buildAppKeysList('#app-keys');
    });
    this.buildAppKeysList('#app-keys');

    const addBtn = this.context.querySelector('#add');
    addBtn.addEventListener('click', this.addBtnListener.bind(this), false);

    Search.addSearchListener(allAppKeys.app.keys, ['name'], data => {
      allAppKeys.app.keys = data;
      this.buildAppKeysList('#app-keys');
    });
  }

  buildAppKeysList(id, opts = { defaultSort: true, loading: false }) {
    const container = document.querySelector(id + ' > .grid-app-keys');

    let appKeys;
    if (opts.loading) {
      appKeys = [];
      container.innerHTML = appKeysListTemplate({
        'app-keys': appKeys,
        loading: opts.loading
      });

      if (!this.isFiltersDisabled) {
        appKeysFilters.disableFilters(false);
      }
    } else {
      appKeys = allAppKeys.app.keys;

      if (this.isFiltersDisabled) {
        this.isFiltersDisabled = false;
        appKeysFilters.enableFilters();
      }

      if (opts.defaultSort) {
        appKeys = appKeysFilters.setDefaultSort(appKeys);
      }

      container.innerHTML = appKeysListTemplate({
        'app-keys': appKeys,
        loading: opts.loading
      });

      this.setActions(appKeys);

      if (appKeys === undefined || appKeys.length <= 1) {
        this.isFiltersDisabled = true;
        appKeysFilters.disableFilters();
      }

      const revokeAllBtn = this.context.querySelector('.action-whole button#revoke-all');

      if (revokeAllBtn.disabled && appKeys.length > 0) {
        revokeAllBtn.removeAttribute('disabled');
        revokeAllBtn.addEventListener('click', this.revokeAllListener.bind(this), false);
      }
    }
  }

  revokeAllListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const askTitle = 'Revoke all keys ?';
    const askMessage =
      'Every single key will be permanently revoked and applications using them may no longer work properly. Make sure all of their creators agreed with such a change.';

    ModalHelper.confirm(askTitle, askMessage)
      .then(result => {
        if (result.value) {
          revokeKeys('/apps/keys/revoke', this.context)
            .then(response => {
              if (response) {
                ModalHelper.notification(
                  'success',
                  response.data.total + ' keys successfully revoked.'
                );
                // eslint-disable-next-line no-new
                new AppKeys(true);
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
  }

  addBtnListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const content = formAppKeysTemplate({ update: false });
    const elems = ['name', 'description'];

    ModalHelper.edit('Generate a new app key', content, 'generate', elems)
      .then(result => {
        if (result.value) {
          const data = {
            name: result.value.name.toLowerCase(),
            description: result.value.description.toLowerCase()
          };

          generateKey('/apps/keys/generate', data, this.context)
            .then(response => {
              if (response) {
                const content = formCopyKeyTemplate({ key: response.data.app.key });
                const elems = ['key'];

                ModalHelper.edit('Your new app key', content, 'OK', elems, false)
                  .then(response => {
                    if (response) {
                      // eslint-disable-next-line no-new
                      new AppKeys(true);
                    }
                  })
                  .catch(error => {
                    ModalHelper.notification('error', error);
                  });

                const copyBtn = document.querySelector('button#copy-key');
                copyBtn.addEventListener(
                  'click',
                  event => {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    const keyInput = document.querySelector('input#key');

                    keyInput.select();
                    keyInput.setSelectionRange(0, 99999);
                    document.execCommand('copy');

                    if (window.getSelection) {
                      window.getSelection().removeAllRanges();
                    } else {
                      document.selection.empty();
                    }

                    copyBtn.children[0].classList.remove('far', 'fa-clipboard');
                    copyBtn.children[0].classList.add('fas', 'fa-check');
                    copyBtn.disabled = true;
                  },
                  false
                );
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
  }

  setActions(appKeys) {
    this.revokeOne(appKeys);
    this.editOne(appKeys);
  }

  revokeOne(appKeys) {
    const buttons = this.context.querySelectorAll('button#revoke');

    buttons.forEach(button => {
      const appKeyId = button.closest('#app-key-infos').dataset.key;
      const key = Array.prototype.find.call(appKeys, elem => elem._id === appKeyId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const askTitle = 'Revoke key ?';
        const askMessage = `${key.name} will be permanently revoked and applications using it may no longer work properly. Make sure its creator agreed with such a change.`;

        ModalHelper.confirm(askTitle, askMessage)
          .then(result => {
            if (result.value) {
              revokeKeys('/apps/keys/revoke/' + appKeyId, this.context)
                .then(response => {
                  if (response) {
                    ModalHelper.notification(
                      'success',
                      key.name + ' successfully revoked.'
                    );
                    // eslint-disable-next-line no-new
                    new AppKeys(true);
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

  editOne(appKeys) {
    const buttons = this.context.querySelectorAll('button#edit');

    buttons.forEach(button => {
      const appKeyId = button.closest('#app-key-infos').dataset.key;
      const key = Array.prototype.find.call(appKeys, elem => elem._id === appKeyId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const content = formAppKeysTemplate({
          name: key.name.toLowerCase(),
          description: key.description.toLowerCase()
        });

        const elems = ['name', 'description'];

        ModalHelper.edit('Edit app key', content, 'update', elems)
          .then(result => {
            if (result.value) {
              const data = result.value;
              updateKey('/apps/keys/' + appKeyId, data, this.context)
                .then(response => {
                  if (response) {
                    ModalHelper.notification(
                      'success',
                      response.data.appKey.name + ' successfully updated'
                    );
                    // eslint-disable-next-line no-new
                    new AppKeys(true);
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

async function getKeys(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function generateKey(url, data, context) {
  try {
    const response = await axios.put(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function updateKey(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function revokeKeys(url, context) {
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

export default AppKeys;
