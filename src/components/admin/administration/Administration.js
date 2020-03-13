import Component from '@Component';
import Router from '@Router';
import URLHelper from '@URLHelper';
import administrationHTML from './administration.html';

class Administration extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    super.makeTitle('Administration');
    super.injectHTMLPage(administrationHTML);
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
