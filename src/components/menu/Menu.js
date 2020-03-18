import Router from '@Router';
import Theme from '@Theme';

import menuHTML from '@Menu/menu.html';
import URLHelper from '@URLHelper';

const defaultContext = document.querySelector('nav.menu');
const defaultItems = [
  {
    name: 'Home',
    icon: 'fas fa-home',
    url: null,
    selected: true
  }
];
const defaultLogoURL = URLHelper.toAnchor(URLHelper.toSlug(defaultItems[0].name));

class Menu {
  constructor(
    options = {
      context: defaultContext,
      items: defaultItems,
      theme: true,
      logoURL: defaultLogoURL
    }
  ) {
    this.options = options;
    this.options.context = this.options.context || defaultContext;
    this.options.items = this.options.items || defaultItems;
    this.options.theme = this.options.theme || true;
    this.options.logoURL = this.options.logoURL || defaultLogoURL;
    this._init();
  }

  _init() {
    this._build();
    this._enableTheme();

    let hash = URLHelper.getHash();

    if (hash === null) {
      const items = this.options.items;
      let selected;

      for (let i = 0; i < items.length; ++i) {
        // eslint-disable-next-line no-prototype-builtins
        if (items[i].hasOwnProperty('selected')) {
          if (items[i].selected) {
            selected = items[i].name;
            break;
          }
        }
      }

      hash = URLHelper.toSlug(selected);
      Router.setRoute(URLHelper.getPage() + URLHelper.toAnchor(hash), true);
    }

    this.setActive(hash);

    window.removeEventListener('hashchange', Router.onHashChangeHandler, true);
    window.addEventListener(
      'hashchange',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        Router.onHashChangeHandler(this);
      },
      true
    );
  }

  _build() {
    this.options.context.insertAdjacentHTML('beforeend', menuHTML);
    const logo = this.options.context.getElementsByClassName('logo')[0];
    logo.getElementsByTagName('a')[0].setAttribute('href', this.options.logoURL);

    let content = '';

    Array.from(this.options.items, item => {
      content += `<li>
                    <i class="${item.icon}"></i>`;
      // eslint-disable-next-line no-prototype-builtins
      const label = item.hasOwnProperty('label') ? item.label : item.name;
      if (item.url === null) {
        content += `<a href="${URLHelper.toAnchor(
          URLHelper.toSlug(item.name)
        )}">${label}</a>`;
      } else {
        content += `<a href="${item.url}">${item.name}</a>`;
      }
      content += '</li>';
    });
    this.options.context.querySelector('ul').insertAdjacentHTML('beforeend', content);
  }

  _enableTheme() {
    if (this.options.theme) {
      const context = document.body.querySelector('*[class^="theme-"]');
      const theme = new Theme(context);
      theme.toggle();
    }
  }

  _switch(href, callback) {
    if (href.startsWith('#')) {
      this.setActive(URLHelper.getHashName(href));
      Router.setRoute(URLHelper.getPage() + href);

      if (typeof callback === 'function') {
        callback(href);
      } else {
        throw new Error('Callback must be a function.');
      }
    } else {
      Router.follow(href);
      if (typeof callback === 'function') {
        callback(null, href);
      } else {
        throw new Error('Callback must be a function.');
      }
    }
  }

  setActive(hash) {
    let list = null;

    if (this.options.theme) {
      list = [].slice.call(this.options.context.querySelectorAll('ul > li')).slice(1);
    } else {
      list = [].slice.call(this.options.context.querySelectorAll('ul > li'));
    }

    for (let i = 0; i < list.length; ++i) {
      const item = list[i];
      item.removeAttribute('class');
      const hashAttr = item.children[1].hash;

      if (URLHelper.getHashName(hashAttr) === hash && hashAttr !== '') {
        item.setAttribute('class', 'active');
      }
    }
  }

  listen(handler) {
    const logo = this.options.context.querySelector('header > a');
    const list = this.options.context.querySelectorAll('ul > li');

    logo.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const href = logo.getAttribute('href');

      this._switch(href, (hash, link) => {
        if (handler !== undefined) {
          if (typeof handler === 'function') {
            handler(hash, link);
          } else {
            throw new Error('Handler must be a function.');
          }
        }
      });
    });

    for (let i = 1; i < list.length; ++i) {
      const li = list[i];

      li.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const href = li.children[1].getAttribute('href');
        this._switch(href, (hash, link) => {
          if (typeof handler === 'function') {
            handler(hash, link);
          } else {
            if (typeof handler !== 'undefined') {
              throw new Error('Handler must be a function.');
            }
          }
        });
      });
    }
  }
}

export default Menu;
