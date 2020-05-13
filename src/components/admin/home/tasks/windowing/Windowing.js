import windowingTemplate from './windowing.hbs';
import Task from '../Task';
import DataSource from '../data-source/DataSource';
import Features from '../features/Features';

let lengthInput;
let windowType;
let slider;
let sliderTooltip;

const properties = {
  length: 0,
  function: 'none',
  overlap: 0
};

class Windowing extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.make();
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
    if (sessionStorage.getItem('windowing-function')) {
      sessionStorage.removeItem('windowing-function');
    }
    if (sessionStorage.getItem('windowing-overlap')) {
      sessionStorage.removeItem('windowing-overlap');
    }
  }

  storeWindowingProperties(properties) {
    sessionStorage.setItem('windowing-length', properties.length);
    sessionStorage.setItem('windowing-function', properties.function);
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
        super.toggleNextBtnEnable(true);
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
    const selected = select.options[select.selectedIndex].value;

    properties.function = selected;
    this.storeWindowingProperties(properties);
  }

  lengthChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const value = event.target.value;
    if (!(value === '') && value >= 0 && value <= 100) {
      super.toggleNextBtnEnable(true);
      properties.length = value;
    } else {
      super.toggleNextBtnEnable(false);
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
    const storedValue = sessionStorage.getItem('windowing-function');
    const options = windowType.options;

    for (let i = 0; i < options.length; ++i) {
      const option = options[i];
      if (storedValue && storedValue === option.value) {
        option.selected = true;
        properties.function = storedValue;
      }
    }

    if (!storedValue) {
      options[0].selected = true;
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
    this.context.innerHTML = windowingTemplate({
      title: 'Windowing'
    });

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
    }
  }
}

export default Windowing;
