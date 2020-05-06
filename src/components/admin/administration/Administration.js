import Component from '@Component';
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
    super.initGridMenu();
  }
}

export default Administration;
