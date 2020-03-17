import Component from '@Component';
import jobsManagementHTML from './jobs-management.html';
import Store from '@Store';

class JobsManagement extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    super.makeTitle('Manage Jobs');
    super.injectHTMLPage(jobsManagementHTML);
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');
  }
}

export default JobsManagement;
