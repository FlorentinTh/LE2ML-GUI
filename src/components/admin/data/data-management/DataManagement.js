import Component from '@Component';
import dataManagementTemplate from './data-management.hbs';
import Store from '@Store';

class DataManagement extends Component {
  constructor(context = null) {
    super(context);
    this.mount();

    this.context.innerHTML = dataManagementTemplate({
      title: 'Data Management'
    });
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('data');
  }
}

export default DataManagement;
