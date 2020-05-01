import Component from '@Component';
import Router from '@Router';
import URLHelper from '@URLHelper';
import dataTemplate from './data.hbs';

class Data extends Component {
  constructor(context = null) {
    super(context);
    this.context.innerHTML = dataTemplate({
      title: 'Data'
    });
    this.run();
  }

  run() {
    const items = this.context.querySelectorAll('div.grid-item');
    this.onItemClickListener(items);
  }

  onItemClickListener(items) {
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

export default Data;
