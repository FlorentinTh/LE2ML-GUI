import Component from '@Component';
import Router from '@Router';
import URLHelper from '@URLHelper';
import settingsTemplate from './settings.hbs';

class Settings extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    this.context.innerHTML = settingsTemplate({
      title: 'My Account'
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
      item.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const href = item.children[0].children[1].getAttribute('href');
        Router.setRoute(URLHelper.getPage() + href);
      });
    }
  }
}

export default Settings;
