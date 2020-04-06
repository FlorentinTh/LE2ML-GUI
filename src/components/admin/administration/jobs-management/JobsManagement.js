import Component from '@Component';
import jobsManagementTemplate from './jobs-management.hbs';
import Store from '@Store';

class JobsManagement extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();

    this.context.innerHTML = jobsManagementTemplate({
      title: 'Jobs Management'
    });

    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');
  }
}

export default JobsManagement;
