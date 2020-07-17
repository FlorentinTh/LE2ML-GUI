import windowingTemplate from './windowing.hbs';
import funcListTemplate from './func-list.hbs';
import Task from '../Task';
import DataSource from '../data-source/DataSource';
import Features from '../features/Features';
import axios from 'axios';
import APIHelper from '@APIHelper';
import Store from '@Store';

let lengthInput;
let windowType;
let slider;
let sliderTooltip;
let windowFunctions;

const properties = {
  length: 0,
  function: {
    label: 'none',
    container: null
  },
  overlap: 0
};

class Windowing extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.initData();
  }

  initData() {
    const windowFuncStore = Store.get('window-type');

    if (windowFuncStore === undefined) {
      this.renderView(true);

      getFunctions('/windows', this.context).then(response => {
        if (response) {
          windowFunctions = response.data.functions;

          Store.add({
            id: 'window-type',
            data: windowFunctions
          });

          this.make();
        }
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
      loading: loading
    });
  }

  resetInputs() {
    lengthInput.value = 0;
    windowType.children[0].selected = true;
    slider.value = 0;
    sliderTooltip.textContent = 0 + ' %';
  }

  removeStoredProperties() {
    if (sessionStorage.getItem('windowing-length')) {
      sessionStorage.removeItem('windowing-length');
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
          elem.children[1].setAttribute('disabled', true);
        }
      } else if (enable === 'on') {
        if (elem.classList.contains('disabled')) {
          elem.classList.remove('disabled');
          elem.children[1].removeAttribute('disabled');
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
        this.storeWindowingProperties(properties);
        this.initLengthInput();
        this.initWindowTypeSelect();
        this.initOverlapSlider();
      } else {
        sessionStorage.setItem('windowing-enabled', false);
        super.toggleNavBtnEnable('next', true);
        super.toggleNavItemsEnabled(['feature-extraction', 'process'], true);
        this.removeStoredProperties();
        this.resetInputs();
      }
    }
  }

  overlapChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const slider = event.target;
    sliderTooltip.textContent = slider.value + ' %';
    properties.overlap = slider.value;

    this.storeWindowingProperties(properties);
  }

  windowTypeChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const select = event.target;
    const selectedValue = select.options[select.selectedIndex].value;

    properties.function.label = selectedValue.split('.')[1];
    properties.function.container = selectedValue.split('.')[0];
    this.storeWindowingProperties(properties);
  }

  lengthChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const value = event.target.value;
    if (!(value === '') && value >= 0 && value <= 100) {
      super.toggleNavBtnEnable('next', true);
      super.toggleNavItemsEnabled(['feature-extraction', 'process'], true);
      properties.length = value;
    } else {
      super.toggleNavBtnEnable('next', false);
      super.toggleNavItemsEnabled(['feature-extraction', 'process'], false);
      properties.length = 0;
    }
    this.storeWindowingProperties(properties);
  }

  initOverlapSlider() {
    const storedValue = sessionStorage.getItem('windowing-overlap');
    if (storedValue) {
      slider.value = storedValue;
      sliderTooltip.textContent = storedValue + ' %';
      properties.overlap = storedValue;
    } else {
      slider.value = properties.overlap;
      sliderTooltip.textContent = properties.overlap + ' %';
    }
  }

  initWindowTypeSelect() {
    const storedValue = sessionStorage.getItem('windowing-function-label');
    const options = windowType.options;

    if (storedValue) {
      for (let i = 0; i < options.length; ++i) {
        const option = options[i];
        const optValue = option.value.split('.')[1];
        if (storedValue === optValue) {
          if (!option.disabled) {
            option.selected = true;
            properties.function.label = storedValue;
            properties.function.container = option.value.split('.')[0];
            this.storeWindowingProperties(properties);
          }
        }
      }
    } else {
      properties.function.label = options[options.selectedIndex].value.split('.')[1];
      properties.function.container = options[options.selectedIndex].value.split('.')[0];
      this.storeWindowingProperties(properties);
    }
  }

  initLengthInput() {
    const storedValue = sessionStorage.getItem('windowing-length');
    if (storedValue) {
      lengthInput.value = storedValue;
      properties.length = storedValue;
    } else {
      lengthInput.value = properties.length;
    }
  }

  make() {
    this.renderView(false);

    super.initNavBtn('next', { label: 'feature-extraction', Task: Features });
    super.initNavBtn('previous', { label: 'data-source', Task: DataSource });

    lengthInput = this.context.querySelector('input#window-length');
    windowType = this.context.querySelector('select#window-type');
    slider = this.context.querySelector('input#overlap');
    sliderTooltip = this.context.querySelector('#range-value');

    this.initLengthInput();
    this.initWindowTypeSelect();
    this.initOverlapSlider();

    lengthInput.addEventListener('input', this.lengthChangeListener.bind(this), false);
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
      this.storeWindowingProperties(properties);
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
      }

      radio.addEventListener('change', this.inputSwitchHandler.bind(this), false);

      if (radio.checked) {
        this.toggleWindowingEnable(radio.value);
      }

      super.toggleNavItemsEnabled(['data-source'], true);
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
