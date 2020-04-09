import Component from '@Component';

import homeTemlate from './home.hbs';
import dataSourceTemplate from './tasks/data-source.hbs';
import windowingTemplate from './tasks/windowing.hbs';

let navItems;
class Home extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();

    this.context.innerHTML = '';
    this.context.innerHTML = homeTemlate({
      title: 'Home'
    });

    this.run();
  }

  setActive(navItem) {
    this.removeCurrentActive();
    navItem.classList.add('item-active');
  }

  removeCurrentActive() {
    navItems.forEach(navItem => {
      if (navItem.classList.contains('item-active')) {
        navItem.classList.remove('item-active');
      }
    });
  }

  renderTask(task) {
    const taskContainer = this.context.querySelector('.task-container');

    taskContainer.innerHTML = '';

    switch (task) {
      case 'data-source':
        taskContainer.innerHTML = dataSourceTemplate({
          title: 'Data Source'
        });
        break;
      case 'windowing':
        taskContainer.innerHTML = windowingTemplate({
          title: 'Windowing'
        });
        break;
      default:
        console.error('No defined template for clicked task.');
        break;
    }
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
      this.renderTask(navItem.dataset.task);
    }
  }

  run() {
    navItems = this.context.querySelectorAll('.task-nav-item');

    for (let i = 0; i < navItems.length; ++i) {
      const navItem = navItems[i];

      if (navItem.classList.contains('item-active')) {
        this.renderTask(navItem.dataset.task);
      }

      const button = navItem.querySelector('button');
      button.addEventListener('click', this.navItemClickHandler.bind(this), true);
    }
  }
}

export default Home;
