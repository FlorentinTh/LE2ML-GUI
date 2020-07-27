import Component from '@Component';
import dataManagementTemplate from './data-management.hbs';
import Store from '@Store';

class DataManagement extends Component {
  constructor(context = null) {
    super(context);

    this.context.innerHTML = dataManagementTemplate({
      title: 'Data Management'
    });

    this.run();
  }

  run() {
    super.initGridMenu();

    const menu = Store.get('menu-admin').data;
    menu.setActive('data');
  }
}

export default DataManagement;
