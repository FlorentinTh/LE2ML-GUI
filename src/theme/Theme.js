class Theme {
  constructor(context) {
    this.context = context;
    this.switchLight = this.context.querySelector('div.switch-theme input#switch-light');
    this.switchDark = this.context.querySelector('div.switch-theme input#switch-dark');
    this._init();
  }

  _init() {
    let theme;

    if (window.localStorage.getItem('theme') === null) {
      localStorage.setItem('theme', 'dark');
      theme = 'dark';
    } else {
      theme = window.localStorage.getItem('theme');
    }

    if (theme === 'dark') {
      this.switchDark.checked = true;
    } else {
      this.switchLight.checked = true;
    }
    this.context.className = '';
    this.context.className = `theme-${theme}`;
  }

  toggle() {
    const inputs = this.context.querySelectorAll('div.switch-theme input[name="switch"]');

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      input.addEventListener('change', event => {
        if (event.target.id === 'switch-dark') {
          localStorage.setItem('theme', 'dark');
          this.switchDark.checked = true;
        } else {
          localStorage.setItem('theme', 'light');
          this.switchLight.checked = true;
        }
        this.context.className = '';
        this.context.className = `theme-${window.localStorage.getItem('theme')}`;
      });
    }
  }
}

export default Theme;
