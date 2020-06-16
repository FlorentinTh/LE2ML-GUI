import input from './input.hbs';
import select from './select.hbs';
import APIHelper from '@APIHelper';

class V1 {
  constructor(config = null, container = null) {
    this.config = config;
    this.container = container;
  }

  build(template) {
    this.container.innerHTML = template({
      config: this.config,
      loading: false
    });

    if (this.container.classList.contains('loading')) {
      this.container.classList.remove('loading');
    }

    const parameters = this.config.parameters;

    for (let i = 0; i < parameters.length; ++i) {
      const parameter = parameters[i];

      switch (parameter.element) {
        case 'input':
          this.container.innerHTML += input({ param: parameter });
          break;
        case 'select':
          this.container.innerHTML += select({ param: parameter });
          break;
        default:
          APIHelper.errorsHandler('Error while building algorithm parameters list', true);
          break;
      }
    }
    this.initListeners();
  }

  initListeners() {
    const elems = this.container.children;

    for (let i = 0; i < elems.length; ++i) {
      const elem = elems[i];
      const elemHTML = elem.children[elem.children.length - 1];

      switch (elemHTML.tagName) {
        case 'SELECT':
          this.initData(elemHTML);
          this.setChangeListener(elemHTML);
          break;
        case 'INPUT':
          this.initData(elemHTML);
          this.setInputListener(elemHTML);
          break;
      }
    }
  }

  setInputListener(element) {
    if (!(element instanceof HTMLElement)) {
      throw new Error('element argument should be instance of HTMLElement');
    }

    element.addEventListener(
      'input',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (!(element.value === '')) {
          sessionStorage.setItem(
            'algo-param-' + element.id,
            element.value + ',' + element.dataset.type
          );
        } else {
          if (!(sessionStorage.getItem('algo-param-' + element.id) === '')) {
            if (element.required) {
              sessionStorage.setItem('algo-param-' + element.id, null);
            } else {
              sessionStorage.removeItem('algo-param-' + element.id);
            }
          }
        }
      },
      false
    );
  }

  setChangeListener(element) {
    if (!(element instanceof HTMLElement)) {
      throw new Error('element argument should be instance of HTMLElement');
    }

    element.addEventListener(
      'change',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        sessionStorage.setItem(
          'algo-param-' + element.id,
          element.value + ',' + element.dataset.type
        );
      },
      false
    );
  }

  initData(element) {
    if (!(element instanceof HTMLElement)) {
      throw new Error('element argument should be instance of HTMLElement');
    }

    const storage = sessionStorage.getItem('algo-param-' + element.id);

    if (!(storage === null)) {
      element.value = storage.split(',')[0];
    } else {
      if (!(element.value === '')) {
        sessionStorage.setItem(
          'algo-param-' + element.id,
          element.value + ',' + element.dataset.type
        );
      } else {
        if (element.required) {
          sessionStorage.setItem('algo-param-' + element.id, null);
        }
      }
    }
  }
}

export default V1;
