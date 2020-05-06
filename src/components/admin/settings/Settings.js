import Component from '@Component';
import settingsTemplate from './settings.hbs';

class Settings extends Component {
  constructor(context = null) {
    super(context);

    this.context.innerHTML = settingsTemplate({
      title: 'My Account'
    });
    this.run();
  }

  run() {
    super.initGridMenu();
  }
}

export default Settings;
