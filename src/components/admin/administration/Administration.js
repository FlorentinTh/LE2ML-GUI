import Component from '@Component';
import Router from '@Router';
import URLHelper from '@URLHelper';
import administrationTemplate from './administration.hbs';

class Administration extends Component {
  constructor(context = null) {
    super(context);

    this.context.innerHTML = administrationTemplate({
      title: 'Administration'
    });

    this.run();
  }

  run() {
    const items = this.context.querySelectorAll('div.grid-item');
    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      item.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const href = item.children[0].children[1].getAttribute('href');
        Router.setRoute(URLHelper.getPage() + href);
      });
    }
  }
}

export default Administration;
