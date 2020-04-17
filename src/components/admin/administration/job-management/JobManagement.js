import Component from '@Component';
import jobManagementTemplate from './job-management.hbs';
import Store from '@Store';

class JobManagement extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();

    this.context.innerHTML = jobManagementTemplate({
      title: 'Job Management'
    });

    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');
  }
}

export default JobManagement;
