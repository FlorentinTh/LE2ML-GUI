import Component from '@Component';
import usersManagementHTML from './users-management.html';
import Store from '@Store';

class UsersManagement extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    super.makeTitle('Manage Users');
    super.injectHTMLPage(usersManagementHTML);
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');

    this.filterListener();
  }

  filterListener() {
    const filters = this.context.querySelectorAll('span.filter');

    filters.forEach(filter => {
      filter.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (filter.className.includes('active')) {
          const sortIcon = filter.children[1].className;
          let className = null;
          if (sortIcon.includes('up')) {
            className = sortIcon.replace('up', 'down');
          } else {
            className = sortIcon.replace('down', 'up');
          }
          filter.children[1].className = className;
        } else {
          filters.forEach(fil => {
            if (fil.className.includes('active')) {
              const className = fil.className;
              fil.className = className
                .split(' ')
                .filter(name => name !== 'filter-active');
            }
          });
          const className = filter.className;
          filter.className = `${className} filter-active`;
        }
      });
    });
  }
}

export default UsersManagement;
