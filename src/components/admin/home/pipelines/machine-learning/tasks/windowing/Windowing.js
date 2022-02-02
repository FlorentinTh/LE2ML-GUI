import windowingTemplate from './windowing.hbs';
import funcListTemplate from './func-list.hbs';
import Task from '../Task';
import DataSource from '../data-source/DataSource';
import Features from '../features/Features';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';
import ModalHelper from '@ModalHelper';

let lengthInput;
let unitSelect;
let windowType;
let slider;
let sliderTooltip;
let windowFunctions;

class Windowing extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.properties = {
      length: 0,
      unit: 'Hz',
      function: {
        label: 'none',
        container: null
      },
      overlap: 0
    };
    this.initData();
  }

  initData() {
    const windowFuncStore = Store.get('window-type');

    if (windowFuncStore === undefined) {
      this.renderView(true);

      getFunctions('/windows', this.context)
        .then(response => {
          if (response) {
            windowFunctions = response.data.functions;

            Store.add({
              id: 'window-type',
              data: windowFunctions
            });

            this.make();
          }
        })
        .catch(error => {
          ModalHelper.notification('error', error);
        });
    } else {
      windowFunctions = windowFuncStore.data;
      this.make();
    }
  }

  renderView(loading = true) {
    this.context.innerHTML = windowingTemplate({
      title: 'Windowing'
    });

    this.buildFunctionsList('#window-type', loading);
  }

  buildFunctionsList(id, loading = true) {
    const select = this.context.querySelector(id);
    select.innerHTML += funcListTemplate({
      functions: windowFunctions,
      loading
    });
  }

  resetInputs() {
    lengthInput.value = 0;
    unitSelect.children[0].selected = true;
    windowType.children[0].selected = true;
    slider.value = 0;
    sliderTooltip.textContent = 0 + ' %';
  }

  removeStoredProperties() {
    if (sessionStorage.getItem('windowing-length')) {
      sessionStorage.removeItem('windowing-length');
    }
    if (sessionStorage.getItem('windowing-unit')) {
      sessionStorage.removeItem('windowing-unit');
    }
    if (sessionStorage.getItem('windowing-function-label')) {
      sessionStorage.removeItem('windowing-function-label');
    }
    if (sessionStorage.getItem('windowing-function-container')) {
      sessionStorage.removeItem('windowing-function-container');
    }
    if (sessionStorage.getItem('windowing-overlap')) {
      sessionStorage.removeItem('windowing-overlap');
    }
  }

  storeWindowingProperties(properties) {
    sessionStorage.setItem('windowing-length', properties.length);
    sessionStorage.setItem('windowing-unit', properties.unit);
    sessionStorage.setItem('windowing-function-label', properties.function.label);
    sessionStorage.setItem('windowing-function-container', properties.function.container);
    sessionStorage.setItem('windowing-overlap', properties.overlap);
  }

  toggleWindowingEnable(enable) {
    const formElems = this.context.querySelectorAll('.form-elem');

    for (let i = 0; i < formElems.length; ++i) {
      const elem = formElems[i];

      if (enable === 'off') {
        if (!elem.classList.contains('disabled')) {
          elem.classList.add('disabled');

          for (let j = 0; j < elem.childNodes.length; ++j) {
            const node = elem.childNodes[j];
            if (node.nodeName === 'INPUT' || node.nodeName === 'SELECT') {
              node.setAttribute('disabled', true);
            }
          }
        }
      } else if (enable === 'on') {
        if (!elem.classList.contains('range')) {
          if (elem.classList.contains('disabled')) {
            elem.classList.remove('disabled');

            for (let j = 0; j < elem.childNodes.length; ++j) {
              const node = elem.childNodes[j];
              if (node.nodeName === 'INPUT' || node.nodeName === 'SELECT') {
                node.removeAttribute('disabled');
              }
            }
          }
        }
      }
    }
  }

  inputSwitchHandler(event) {
    event.stopImmediatePropagation();
    if (event.target.checked) {
      const enable = event.target.value;
      this.toggleWindowingEnable(enable);

      if (enable === 'on') {
        sessionStorage.setItem('windowing-enabled', true);
        lengthInput = this.context.querySelector('input#window-length');
        this.storeWindowingProperties(this.properties);
        this.initLengthInput();
        this.initWindowUnitSelect();
        this.initWindowTypeSelect();
        this.initOverlapSlider();
      } else {
        sessionStorage.setItem('windowing-enabled', false);
        super.toggleNavBtnEnable('next', true);

        const isFeaturesFileSave = sessionStorage.getItem('features-save');
        const isFileNameValid = sessionStorage.getItem('features-file');

        super.toggleNavItemsEnabled(['feature-extraction'], true);

        if (!(isFeaturesFileSave === null)) {
          if (
            (isFeaturesFileSave === 'true' && !(isFileNameValid === null)) ||
            isFeaturesFileSave === 'false'
          ) {
            super.toggleNavItemsEnabled(['process'], true);
          } else {
            super.toggleNavItemsEnabled(['process'], false);
          }
        } else {
          super.toggleNavItemsEnabled(['process'], true);
        }

        this.removeStoredProperties();
        this.resetInputs();
      }
    }
  }

  initLengthInput() {
    const storedValue = sessionStorage.getItem('windowing-length');
    if (storedValue) {
      lengthInput.value = storedValue;
      this.properties.length = storedValue;
    } else {
      lengthInput.value = this.properties.length;
    }

    if (lengthInput.value === '0' || lengthInput.value === '1') {
      super.toggleNavBtnEnable('next', false);
      super.toggleNavItemsEnabled(['feature-extraction', 'process'], false);
    }
  }

  lengthChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const value = event.target.value;
    if (!(value === '') && value >= 1) {
      super.toggleNavBtnEnable('next', true);

      const isFeaturesFileSave = sessionStorage.getItem('features-save');
      const isFileNameValid = sessionStorage.getItem('features-file');

      super.toggleNavItemsEnabled(['feature-extraction'], true);

      if (!(isFeaturesFileSave === null)) {
        if (
          (isFeaturesFileSave === 'true' && !(isFileNameValid === null)) ||
          isFeaturesFileSave === 'false'
        ) {
          super.toggleNavItemsEnabled(['process'], true);
        } else {
          super.toggleNavItemsEnabled(['process'], false);
        }
      } else {
        super.toggleNavItemsEnabled(['process'], true);
      }

      this.properties.length = value;
    } else {
      super.toggleNavBtnEnable('next', false);
      super.toggleNavItemsEnabled(['feature-extraction', 'process'], false);
      this.properties.length = 0;
    }
    this.storeWindowingProperties(this.properties);
  }

  initWindowUnitSelect() {
    const storedValue = sessionStorage.getItem('windowing-unit');
    const options = unitSelect.options;

    if (storedValue) {
      for (let i = 0; i < options.length; ++i) {
        const option = options[i];
        const optValue = option.value;
        if (storedValue === optValue) {
          if (!option.disabled) {
            option.selected = true;
            this.properties.unit = storedValue;
            this.storeWindowingProperties(this.properties);
          }
        }
      }
    } else {
      this.properties.unit = options[options.selectedIndex].value;
      this.storeWindowingProperties(this.properties);
    }
  }

  windowUnitChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const select = event.target;
    const selectedValue = select.options[select.selectedIndex].value;

    this.properties.unit = selectedValue;
    this.storeWindowingProperties(this.properties);
  }

  initWindowTypeSelect() {
    const storedValue = sessionStorage.getItem('windowing-function-label');
    const options = windowType.options;

    if (storedValue && !(storedValue === 'none')) {
      for (let i = 0; i < options.length; ++i) {
        const option = options[i];
        const optValue = option.value.split('.')[1];
        if (storedValue === optValue) {
          if (!option.disabled) {
            option.selected = true;
            this.properties.function.label = storedValue;
            this.properties.function.container = option.value.split('.')[0];
            this.storeWindowingProperties(this.properties);
          }
        }
      }
    } else {
      this.properties.function.label = options[options.selectedIndex].value.split('.')[1];
      this.properties.function.container =
        options[options.selectedIndex].value.split('.')[0];
      this.storeWindowingProperties(this.properties);
    }
  }

  windowTypeChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const select = event.target;
    const selectedValue = select.options[select.selectedIndex].value;

    this.properties.function.label = selectedValue.split('.')[1];
    this.properties.function.container = selectedValue.split('.')[0];
    this.storeWindowingProperties(this.properties);
  }

  initOverlapSlider() {
    const storedValue = sessionStorage.getItem('windowing-overlap');
    if (storedValue) {
      slider.value = storedValue;
      sliderTooltip.textContent = storedValue + ' %';
      this.properties.overlap = storedValue;
    } else {
      slider.value = this.properties.overlap;
      sliderTooltip.textContent = this.properties.overlap + ' %';
    }
  }

  overlapChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const slider = event.target;
    sliderTooltip.textContent = slider.value + ' %';
    this.properties.overlap = slider.value;

    this.storeWindowingProperties(this.properties);
  }

  make() {
    this.renderView(false);

    super.initNavBtn('next', { label: 'feature-extraction', Task: Features });
    super.initNavBtn('previous', { label: 'data-source', Task: DataSource });

    super.toggleNavItemsEnabled(['data-source', 'feature-extraction'], true);

    const isFeaturesFileSave = sessionStorage.getItem('features-save');
    const isFileNameValid = sessionStorage.getItem('features-file');

    if (!(isFeaturesFileSave === null)) {
      if (
        (isFeaturesFileSave === 'true' && !(isFileNameValid === null)) ||
        isFeaturesFileSave === 'false'
      ) {
        super.toggleNavItemsEnabled(['process'], true);
      } else {
        super.toggleNavItemsEnabled(['process'], false);
      }
    } else {
      super.toggleNavItemsEnabled(['process'], true);
    }

    lengthInput = this.context.querySelector('input#window-length');
    unitSelect = this.context.querySelector('select#window-unit');
    windowType = this.context.querySelector('select#window-type');
    slider = this.context.querySelector('input#overlap');
    sliderTooltip = this.context.querySelector('#range-value');

    this.initLengthInput();
    this.initWindowUnitSelect();
    this.initWindowTypeSelect();
    this.initOverlapSlider();

    lengthInput.addEventListener('input', this.lengthChangeListener.bind(this), false);

    const lengthInputInfo = this.context.querySelector('#window-length-info');

    lengthInputInfo.addEventListener(
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        ModalHelper.confirm(
          'Length of the Window',
          'This value cannot be set to 0.',
          'I understand',
          '',
          false,
          true,
          'info'
        );
      },
      false
    );

    unitSelect.addEventListener(
      'change',
      this.windowUnitChangeListener.bind(this),
      false
    );

    windowType.addEventListener(
      'change',
      this.windowTypeChangeListener.bind(this),
      false
    );

    slider.addEventListener('input', this.overlapChangeListener.bind(this), false);

    const inputStateSwitch = this.context.querySelectorAll('.switch-group input');
    const storedState = sessionStorage.getItem('windowing-enabled');

    if (storedState === null) {
      inputStateSwitch[0].setAttribute('checked', true);
      sessionStorage.setItem('windowing-enabled', true);
      this.storeWindowingProperties(this.properties);
    }

    for (let i = 0; i < inputStateSwitch.length; ++i) {
      const radio = inputStateSwitch[i];

      if (!(storedState === null)) {
        if (
          (radio.value === 'on' && storedState === 'true') ||
          (radio.value === 'off' && storedState === 'false')
        ) {
          radio.setAttribute('checked', true);
        }

        if (radio.value === 'off' && storedState === 'false') {
          super.toggleNavBtnEnable('next', true);
          const isFeaturesFileSave = sessionStorage.getItem('features-save');
          const isFileNameValid = sessionStorage.getItem('features-file');

          super.toggleNavItemsEnabled(['feature-extraction'], true);

          if (!(isFeaturesFileSave === null)) {
            if (
              (isFeaturesFileSave === 'true' && !(isFileNameValid === null)) ||
              isFeaturesFileSave === 'false'
            ) {
              super.toggleNavItemsEnabled(['process'], true);
            } else {
              super.toggleNavItemsEnabled(['process'], false);
            }
          } else {
            super.toggleNavItemsEnabled(['process'], true);
          }
        }
      }

      radio.addEventListener('change', this.inputSwitchHandler.bind(this), false);

      if (radio.checked) {
        this.toggleWindowingEnable(radio.value);
      }
    }
  }
}

async function getFunctions(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

export default Windowing;
