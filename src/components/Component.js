import Router from '@Router';
import URLHelper from '@URLHelper';

class Component {
  constructor(context) {
    if (context === null) {
      let ctx = document.querySelector('main.content');
      if (ctx === null) {
        ctx = document.querySelector('div.wrap');

        let child = ctx.lastElementChild;
        while (child) {
          ctx.removeChild(child);
          child = ctx.lastElementChild;
        }

        const div = ctx.createElement('div');
        div.setAttribute('class', 'center');
      }

      this.context = ctx;
    } else {
      if (typeof context === 'string') {
        this.context = document.querySelector(context);
      } else {
        throw new Error('Expected type for argument context is String.');
      }
    }
  }

  initGridMenu() {
    const items = this.context.querySelectorAll('div.grid-item');

    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      if (!item.classList.contains('item-disabled')) {
        item.addEventListener('click', event => {
          event.preventDefault();
          event.stopImmediatePropagation();
          const href = item.children[0].children[1].getAttribute('href');
          Router.setRoute(URLHelper.getPage() + href);
        });
      }
    }
  }
}

export default Component;
