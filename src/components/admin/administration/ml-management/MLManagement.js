import Component from '@Component';
import mlManagementTemplate from './ml-management.hbs';
import Store from '@Store';

class MLManagement extends Component {
  constructor(context = null) {
    super(context);

    this.context.innerHTML = mlManagementTemplate({
      title: 'Machine Learning Management'
    });

    this.run();
  }

  run() {
    super.initGridMenu();

    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');
  }
}

export default MLManagement;
