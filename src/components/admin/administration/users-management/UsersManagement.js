import Component from '@Component';
import usersManagementHTML from './users-management.html';

class UsersManagement extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    super.makeTitle('Manage Users');
    super.injectHTMLPage(usersManagementHTML);
    this.mount();
  }

  mount() {}
}

export default UsersManagement;
