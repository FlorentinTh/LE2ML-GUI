import Router from '@Router';
import URLHelper from '@URLHelper';
import StringHelper from '@StringHelper';

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

  addSearchListener(data, props, callback) {
    const search = document.getElementById('search');

    const count = document.querySelector('.result-count');
    const countNb = document.querySelector('.result-count span.badge');
    const countMsg = document.querySelector('.result-count p');

    let timer = null;
    let query = '';

    search.addEventListener('keydown', event => {
      const inputValue = event.keyCode;
      if (
        (inputValue >= 65 && inputValue <= 90) ||
        inputValue === 8 ||
        inputValue === 46
      ) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          query = search.value.trim().toLowerCase();

          if (StringHelper.isAlpha(query)) {
            const result = data.filter(item => {
              for (let i = 0; i < props.length; ++i) {
                const prop = props[i];
                if (item[prop].includes(query)) {
                  return item;
                }
              }
            });

            if (count.classList.contains('hidden')) {
              count.classList.remove('hidden');
              count.classList.add('active');
            }

            countNb.textContent = result.length;
            if (result.length > 1) {
              countMsg.textContent = 'results found';
            } else if (result.length >= 0 && result.length <= 1) {
              countMsg.textContent = 'result found';
            }

            callback(result);
          }
        }, 200);
      }
    });

    search.addEventListener('keyup', event => {
      if (search.value.trim() === '' && !(query === '')) {
        if (event.keyCode === 8 || event.keyCode === 46) {
          if (count.classList.contains('active')) {
            count.classList.remove('active');
            count.classList.add('hidden');
          }

          callback(data);
        }
      }
    });
  }
}

export default Component;
