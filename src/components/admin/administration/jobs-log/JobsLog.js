import Component from '@Component';
import jobsLogTemplate from './jobs-log.hbs';
import Store from '@Store';

class JobsLog extends Component {
  constructor(context = null) {
    super(context);

    this.context.innerHTML = jobsLogTemplate({
      title: 'Jobs Log'
    });

    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');

    const logsContent = this.context.querySelector('.content');
    logsContent.scrollTop = logsContent.clientHeight;
  }
}

export default JobsLog;
