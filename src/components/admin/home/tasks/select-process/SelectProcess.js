import Task from '../Task';
import selectProcessTemplate from './select-process.hbs';
import FileList from '@FileList';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';
import ModalHelper from '@ModalHelper';
import DataSource from '../data-source/DataSource';

let processContainer;
let nextBtn;

class SelectProcess extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.make();
  }

  toggleNextBtnEnable(enable) {
    if (enable) {
      if (nextBtn.classList.contains('disabled')) {
        nextBtn.classList.remove('disabled');
      }
    } else {
      if (!nextBtn.classList.contains('disabled')) {
        nextBtn.classList.add('disabled');
      }
    }
  }

  makeProcessTest() {
    let fileList;

    const filename = sessionStorage.getItem('model');

    if (!filename) {
      this.toggleNextBtnEnable(false);
    }

    const dataStore = Store.get('model-data');
    if (dataStore === undefined) {
      fileList = new FileList(
        processContainer,
        'Existing trained models',
        [],
        'model',
        filename || null
      );

      getFiles('/files?type=models', this.context).then(response => {
        if (response) {
          Store.add({
            id: 'model-data',
            data: response.data
          });

          fileList.setData(response.data);
          fileList.make();
        }
      });
    } else {
      const context = this.context.querySelector('.process-options');
      fileList = new FileList(
        context,
        'Existing trained models',
        dataStore.data,
        'model',
        filename || null,
        false
      );
    }

    fileList.on('selected', result => {
      if (result) {
        this.toggleNextBtnEnable(result);
      } else {
        this.toggleNextBtnEnable(result);
      }
    });

    super.setProcessNavItem('Predict');
  }

  switchProcessContent(process) {
    switch (process) {
      case 'test':
        sessionStorage.setItem('process', process);
        super.toggleNavItemEnable('process', true);
        this.makeProcessTest();
        break;
      case 'train':
        sessionStorage.setItem('process', process);

        if (sessionStorage.getItem('model')) {
          sessionStorage.removeItem('model');
        }

        this.toggleNextBtnEnable(true);
        super.toggleNavItemEnable('process', true);
        super.setProcessNavItem('Training');
        break;
      case 'none':
        sessionStorage.setItem('process', process);

        if (sessionStorage.getItem('model')) {
          sessionStorage.removeItem('model');
        }

        this.toggleNextBtnEnable(true);
        super.toggleNavItemEnable('process', false);
    }
  }

  processSwitchHandler(event) {
    event.stopImmediatePropagation();
    if (event.target.checked) {
      processContainer.innerHTML = '';
      const value = event.target.value;
      this.switchProcessContent(value);
    }
  }

  importFileUploadEventSubmit(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const form = this.context.querySelector('.import-container form');

    const data = new FormData(form);

    const input = form.querySelector('input');
    input.setAttribute('disabled', 'disabled');

    axios
      .post('/files/import/conf', data, {
        headers: APIHelper.setAuthHeader()
      })
      .then(response => {
        if (response) {
          input.removeAttribute('disabled');
          input.value = '';
          this.toggleLoading(false);
          ModalHelper.notification('success', 'Configuration successfully imported.');
        }
      })
      .catch(error => {
        input.removeAttribute('disabled');
        input.value = '';
        this.toggleLoading(false);
        APIHelper.errorsHandler(error, this.context, true);
      });
  }

  toggleLoading(toggle) {
    const label = this.context.querySelector('.import-container label');
    const icon = label.children[0];

    if (toggle) {
      label.classList.add('loading');
      icon.classList.remove('fa-file-upload');
      icon.classList.add('fa-spinner');
    } else {
      label.classList.remove('loading');
      icon.classList.remove('fa-spinner');
      icon.classList.add('fa-file-upload');
    }
  }

  importFileInputListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const file = event.target.files[0];

    if (!(file === undefined)) {
      const label = this.context.querySelector('.import-container label');
      const button = label.children[1];

      this.toggleLoading(true);
      button.click();
    }
  }

  make() {
    this.context.innerHTML = selectProcessTemplate({
      title: 'Process to Achieve'
    });

    const importFileInput = this.context.querySelector('input#import-config');
    importFileInput.addEventListener(
      'change',
      this.importFileInputListener.bind(this),
      false
    );

    const importFileForm = this.context.querySelector('form');
    importFileForm.addEventListener(
      'submit',
      this.importFileUploadEventSubmit.bind(this),
      false
    );

    nextBtn = this.context.querySelector('.btn-group-nav .next button');

    nextBtn.addEventListener(
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const btn =
          event.target.tagName === 'BUTTON' ? event.target : event.target.parentNode;

        if (!btn.classList.contains('disabled')) {
          const taskContainer = super.getContext();
          // eslint-disable-next-line no-new
          new DataSource(taskContainer);
          super.setNavActive('data-source');
        }
      },
      false
    );

    processContainer = this.context.querySelector('.process-options');

    const processSwitchInputs = this.context.querySelectorAll('.switch-group input');

    const storedProcess = sessionStorage.getItem('process');

    if (!storedProcess) {
      processSwitchInputs[0].setAttribute('checked', true);
    }

    for (let i = 0; i < processSwitchInputs.length; ++i) {
      const radio = processSwitchInputs[i];

      if (storedProcess) {
        if (radio.value === storedProcess) {
          radio.setAttribute('checked', true);
        }
      } else {
      }

      radio.addEventListener('change', this.processSwitchHandler.bind(this), false);

      if (radio.checked) {
        this.switchProcessContent(radio.value);
      }
    }
  }
}

async function getFiles(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context, true);
  }
}

export default SelectProcess;
