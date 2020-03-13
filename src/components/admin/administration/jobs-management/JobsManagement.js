import Component from '@Component';
import jobsManagementHTML from './jobs-management.html';

class JobsManagement extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    super.makeTitle('Manage Jobs');
    super.injectHTMLPage(jobsManagementHTML);
    this.mount();
  }

  mount() {}
}

export default JobsManagement;
