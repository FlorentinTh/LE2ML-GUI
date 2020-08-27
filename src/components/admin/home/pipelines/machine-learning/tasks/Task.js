import Configuration from '@Configuration';
import { Versions } from '@ConfVersion';
import FileHelper from '@FileHelper';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import formConfVersionTemplate from './form-conf-version.hbs';
import formJobStartTemplate from './form-job-start.hbs';
import SelectProcess from './select-process/SelectProcess';
import URLHelper from '@URLHelper';

let navButtonClickHandler;
let finishBtnClickHandler;
class Task {
  constructor(context) {
    this.context = context;
    this.navItems = document.querySelectorAll('.task-nav-item');

    this.run();
  }

  setNavActive(item) {
    if (!(typeof item === 'string')) {
      throw new Error('Expected type for argument item is String.');
    }

    for (let i = 0; i < this.navItems.length; ++i) {
      const navItem = this.navItems[i];
      if (navItem.classList.contains('item-active')) {
        navItem.classList.remove('item-active');
      }

      if (navItem.dataset.task === item) {
        sessionStorage.setItem('active-nav', item);
        navItem.classList.add('item-active');
      }
    }
  }

  setNavItemEnable(item) {
    if (!(typeof item === 'object')) {
      throw new Error('Expected type for argument item is Object.');
    }

    if (item.classList.contains('item-disabled')) {
      item.classList.remove('item-disabled');
    }
  }

  setNavItemDisabled(item) {
    if (!(typeof item === 'object')) {
      throw new Error('Expected type for argument item is Object.');
    }

    if (!item.classList.contains('item-disabled')) {
      item.classList.add('item-disabled');
    }
  }

  removeStoredAlgoParams() {
    const storedValues = JSON.parse(JSON.stringify(sessionStorage));
    Object.keys(storedValues).filter(key => {
      if (/^algo/.test(key)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  toggleNavItemsEnabled(itemList, enabled = false) {
    if (!(typeof itemList === 'object')) {
      throw new Error('Expected type for argument itemList is Object.');
    }

    const navItemsElems = this.context.parentNode.querySelectorAll('.task-nav-item');
    for (let i = 0; i < navItemsElems.length; ++i) {
      for (let j = 0; j < itemList.length; ++j) {
        if (itemList[j] === navItemsElems[i].dataset.task) {
          if (enabled) {
            if (itemList[j] === 'process') {
              const selectedProcess = sessionStorage.getItem('process-type');
              if (!(selectedProcess === null) && selectedProcess === 'train') {
                this.setNavItemEnable(navItemsElems[i]);
              }
            } else if (itemList[j] === 'data-source') {
              const storedInput = sessionStorage.getItem('input-content');
              if (!(storedInput === null)) {
                this.setNavItemEnable(navItemsElems[i]);
                this.toggleNavItemsEnabled(['process'], true);
              } else {
                this.setNavItemEnable(navItemsElems[i]);
              }
            } else {
              this.setNavItemEnable(navItemsElems[i]);
            }
          } else {
            if (itemList[j] === 'data-source') {
              const storedInput = sessionStorage.getItem('input-content');
              if (!(storedInput === null)) {
                this.setNavItemDisabled(navItemsElems[i]);
                return this.toggleNavItemsEnabled(
                  ['windowing', 'feature-extraction', 'process'],
                  false
                );
              } else {
                this.setNavItemDisabled(navItemsElems[i]);
              }
            } else {
              this.setNavItemDisabled(navItemsElems[i]);
            }
          }
        }
      }
    }
  }

  removeFromSession(itemList) {
    for (let i = 0; i < itemList.length; i++) {
      if (itemList[i] === 'windowing') {
        const keys = Object.keys(JSON.parse(JSON.stringify(sessionStorage)));

        for (let j = 0; j < keys.length; ++j) {
          if (keys[j].startsWith('windowing')) {
            sessionStorage.removeItem(keys[j]);
          }
        }
      } else if (itemList[i] === 'feature-extraction') {
        const keys = Object.keys(JSON.parse(JSON.stringify(sessionStorage)));

        for (let j = 0; j < keys.length; ++j) {
          if (keys[j].startsWith('features')) {
            sessionStorage.removeItem(keys[j]);
          }
        }
      } else if (itemList[i] === 'process') {
        const keys = Object.keys(JSON.parse(JSON.stringify(sessionStorage)));

        for (let j = 0; j < keys.length; ++j) {
          if (keys[j].startsWith('algo')) {
            sessionStorage.removeItem(keys[j]);
          }
        }
      }
    }
  }

  disableSection(id) {
    if (!(typeof id === 'string')) {
      throw new Error('Expected type for argument id is String.');
    }

    const elem = document.querySelector('section#' + id);
    elem.classList.add('section-disabled');
    elem
      .querySelector('h3')
      .insertAdjacentHTML('afterbegin', '<i class="far fa-times-circle"></i>');
  }

  toggleNavBtnEnable(button, enable) {
    if (!(typeof button === 'string')) {
      if (!(button === 'next') || !(button === 'finish')) {
        throw new Error('Argument button should be one of : next or finish.');
      }
    }

    if (!(typeof enable === 'boolean')) {
      throw new Error('Expected type for argument enable is Boolean.');
    }

    const nextBtn = this.context.querySelector('.btn-group-nav .next button');
    const finishBtn = this.context.querySelector('.btn-group-nav .finish button');

    if (enable) {
      if (!(nextBtn === null) && button === 'next') {
        if (nextBtn.classList.contains('disabled')) {
          nextBtn.classList.remove('disabled');
        }
      } else if (!(finishBtn === null) && button === 'finish') {
        if (finishBtn.classList.contains('disabled')) {
          finishBtn.classList.remove('disabled');
        }
      }
    } else {
      if (!(nextBtn === null) && button === 'next') {
        if (!nextBtn.classList.contains('disabled')) {
          nextBtn.classList.add('disabled');
        }
      } else if (!(finishBtn === null) && button === 'finish') {
        if (!finishBtn.classList.contains('disabled')) {
          finishBtn.classList.add('disabled');
        }
      }
    }
  }

  initFinishBtn(callback) {
    if (!(typeof callback === 'function')) {
      throw new Error('Expected type for argument callback is Function.');
    }
    const finishBtn = this.context.querySelector('.btn-group-nav .finish button');

    finishBtnClickHandler = [
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const btn =
          event.target.tagName === 'BUTTON' ? event.target : event.target.parentNode;

        if (!btn.classList.contains('disabled')) {
          callback();
        }
      },
      false
    ];

    finishBtn.addEventListener(...finishBtnClickHandler);
  }

  finishBtnHandler() {
    const content = formJobStartTemplate();
    const elems = ['label', 'version'];

    const pipelineStored = sessionStorage.getItem('pipeline');

    if (pipelineStored === null) {
      sessionStorage.setItem('pipeline', URLHelper.getHash().replace('-', '_'));
    }

    ModalHelper.edit('Job Configuration', content, 'Start Job', elems).then(result => {
      if (result.value) {
        const selectedVersion = result.value.version;
        if (selectedVersion === 'none') {
          ModalHelper.error('You must select a version to start the job.');
        } else {
          let JSONConf;
          let urlParams;
          switch (selectedVersion) {
            case '1':
              urlParams = '?v=1';
              JSONConf = new Configuration().marshall(Versions.v1);
              break;
          }

          const data = {
            label: result.value.label.toLowerCase(),
            conf: JSONConf
          };

          axios
            .put('/jobs' + urlParams, data, {
              headers: APIHelper.setAuthHeader()
            })
            .then(response => {
              if (response) {
                ModalHelper.notification('success', response.data.message);
              }
            })
            // eslint-disable-next-line handle-callback-err
            .catch(error => {
              ModalHelper.notification('error', 'Job created but failed to start', 3500);
            });

          sessionStorage.clear();
          // eslint-disable-next-line no-new
          new SelectProcess(this.context);
          this.setNavActive('select-process');
        }
      }
    });
  }

  initNavBtn(button, options) {
    if (!(typeof button === 'string')) {
      if (!(button === 'next') || !(button === 'previous')) {
        throw new Error('Argument button should be one of : next or previous.');
      }
    }

    if (!(typeof options === 'object')) {
      throw new Error('Expected type for argument options is Object.');
    }

    navButtonClickHandler = [
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const btn =
          event.target.tagName === 'BUTTON' ? event.target : event.target.parentNode;

        if (!btn.classList.contains('disabled')) {
          // eslint-disable-next-line no-new
          new options.Task(this.context);
          this.setNavActive(options.label);
        }
      },
      true
    ];

    const nextBtn = this.context.querySelector('.btn-group-nav .next button');
    const previousBtn = this.context.querySelector('.btn-group-nav .previous button');

    if (!(nextBtn === null) && button === 'next') {
      if (!(finishBtnClickHandler === undefined)) {
        nextBtn.removeEventListener(...finishBtnClickHandler);
      }
      nextBtn.addEventListener(...navButtonClickHandler);
    } else if (!(previousBtn === null) && button === 'previous') {
      previousBtn.addEventListener(...navButtonClickHandler);
    }
  }

  clearNavButton(button) {
    if (!(typeof button === 'string')) {
      if (!(button === 'next') || !(button === 'previous')) {
        throw new Error('Argument button should be one of : next or previous.');
      }
    }

    const nextBtn = this.context.querySelector('.btn-group-nav .next button');
    const previousBtn = this.context.querySelector('.btn-group-nav .previous button');

    if (!(nextBtn === null) && button === 'next') {
      nextBtn.removeEventListener(...navButtonClickHandler);
    } else if (!(previousBtn === null) && button === 'previous') {
      previousBtn.removeEventListener(...navButtonClickHandler);
    }
  }

  downloadBtnClickListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!this.validateAlgoParamsFields()) {
      ModalHelper.error(
        'Please select an algorithm or check that all required parameters does not have missing values before starting your download.'
      );
    }

    if (!this.validateTestFeatureFileSelected()) {
      ModalHelper.error('Please select a file to start your download.');
    }

    if (!this.validateFeatureFileSaveFiled()) {
      ModalHelper.error(
        'Please enter a filename to save file or disable this option to start your download.'
      );
    } else {
      const content = formConfVersionTemplate();
      const elems = ['version'];
      ModalHelper.edit('Choose a Configuration Version', content, 'download', elems).then(
        result => {
          if (result.value) {
            const selectedVersion = result.value.version;
            if (selectedVersion === 'none') {
              ModalHelper.error(
                'You must select a version to download the configuration file.'
              );
            } else {
              const btn =
                event.target.tagName === 'BUTTON'
                  ? event.target
                  : event.target.parentNode;
              btn.setAttribute('disabled', true);
              if (!btn.classList.contains('loading')) {
                btn.classList.add('loading');
              }
              let JSONConf;
              let urlParams;
              switch (selectedVersion) {
                case '1':
                  urlParams = '?v=1';
                  JSONConf = new Configuration().marshall(Versions.v1);
                  break;
              }

              axios
                .post('/files/conf/convert' + urlParams, JSONConf, {
                  headers: APIHelper.setAuthHeader()
                })
                .then(response => {
                  if (response) {
                    const downloadConfBtn = this.context.querySelector(
                      '#download-config a'
                    );
                    FileHelper.enableDownload(
                      downloadConfBtn,
                      response.data.data,
                      'config',
                      () => {
                        downloadConfBtn.click();
                        FileHelper.disableDownload(downloadConfBtn);
                        btn.removeAttribute('disabled');
                        if (btn.classList.contains('loading')) {
                          btn.classList.remove('loading');
                        }
                      }
                    );
                  }
                })
                .catch(error => {
                  btn.removeAttribute('disabled');
                  if (btn.classList.contains('loading')) {
                    btn.classList.remove('loading');
                  }
                  APIHelper.errorsHandler(error, true);
                });
            }
          }
        }
      );
    }
  }

  validateAlgoParamsFields() {
    const algo = this.context.querySelector('select#algo');

    if (!(algo === null)) {
      if (algo.value === 'none') {
        return false;
      }
    }

    const params = this.context.querySelectorAll('.params-container .elem');

    if (!(params.length === 0)) {
      for (let i = 0; i < params.length; ++i) {
        const param = params[i].children[params[i].children.length - 1];
        if (param.required && param.value === '') {
          return false;
        }
      }
    }

    return true;
  }

  validateTestFeatureFileSelected() {
    const process = sessionStorage.getItem('process-type');

    if (process === 'test') {
      const testFeatureFileStored = sessionStorage.getItem('input-content');
      if (testFeatureFileStored === null) {
        return false;
      }
    }

    return true;
  }

  validateFeatureFileSaveFiled() {
    const input = this.context.querySelector('.switch-save-file input#switch-on');

    if (!(input === null)) {
      const isSwitchOnChecked = input.checked;

      const saveFileInput = this.context.querySelector('#save-filename');

      if (isSwitchOnChecked && saveFileInput.value.trim() === '') {
        return false;
      }
    }

    return true;
  }

  run() {}
}

export default Task;
