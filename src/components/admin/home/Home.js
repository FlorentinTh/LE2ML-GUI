import Component from '@Component';
import homeTemlate from './home.hbs';
import SelectProcess from './tasks/select-process/SelectProcess';
import DataSource from './tasks/data-source/DataSource';
import Windowing from './tasks/windowing/Windowing';
import Features from './tasks/features/Features';
import Learning from './tasks/learning/Learning';

let navItems;
class Home extends Component {
  constructor(context = null) {
    super(context);
    this.context.innerHTML = homeTemlate({
      title: 'Home'
    });

    this.run();
  }

  setActive(navItem) {
    this.removeCurrentActiveNavItem();
    sessionStorage.setItem('active-nav', navItem.dataset.task);

    if (navItem.classList.contains('item-disabled')) {
      navItem.classList.remove('item-disabled');
    }

    navItem.classList.add('item-active');
  }

  removeCurrentActiveNavItem() {
    navItems.forEach(navItem => {
      if (navItem.classList.contains('item-active')) {
        navItem.classList.remove('item-active');
      }
    });
  }

  navItemClickHandler(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const navItem =
      event.target.tagName === 'I'
        ? event.target.parentNode.parentNode
        : event.target.parentNode;

    if (
      !navItem.classList.contains('item-disabled') &&
      !navItem.classList.contains('item-active')
    ) {
      this.setActive(navItem);
      this.switchTask(navItem.dataset.task);
    }
  }

  switchTask(task) {
    const taskContainer = this.context.querySelector('.task-container');
    taskContainer.innerHTML = '';
    switch (task) {
      case 'select-process':
        // eslint-disable-next-line no-new
        new SelectProcess(taskContainer);
        break;
      case 'data-source':
        // eslint-disable-next-line no-new
        new DataSource(taskContainer);
        break;
      case 'windowing':
        // eslint-disable-next-line no-new
        new Windowing(taskContainer);
        break;
      case 'feature-extraction':
        // eslint-disable-next-line no-new
        new Features(taskContainer);
        break;
      case 'process':
        // eslint-disable-next-line no-new
        new Learning(taskContainer);
        break;
      default:
        throw new Error('No defined template for clicked task.');
    }
  }

  run() {
    navItems = this.context.querySelectorAll('.task-nav-item');

    let storedActiveNav = sessionStorage.getItem('active-nav');

    if (storedActiveNav === null) {
      sessionStorage.setItem('active-nav', navItems[0].dataset.task);
      storedActiveNav = navItems[0].dataset.task;
    }

    for (let i = 0; i < navItems.length; ++i) {
      const navItem = navItems[i];
      const task = navItem.dataset.task;

      if (storedActiveNav === task) {
        this.switchTask(navItem.dataset.task);
        this.setActive(navItem);
      }

      const button = navItem.querySelector('button');
      button.addEventListener('click', this.navItemClickHandler.bind(this), true);
    }
  }
}

export default Home;
