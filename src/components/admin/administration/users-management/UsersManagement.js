import Component from '@Component';
import Store from '@Store';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import SortHelper from '@SortHelper';
import StringHelper from '@StringHelper';
import usersManagementTemplate from './users-management.hbs';
import usersListTemplate from './users-list.hbs';
import editUserTemplate from './edit-user.hbs';
import axios from 'axios';

let usersAdmin;
let usersNormal;

let adminFilters;
let usersFilters;

let filerClickListener;

class UsersManagement extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');

    getUsers('/admin/users?role=admin', this.context).then(response => {
      if (response) {
        usersAdmin = response.data;
        getUsers('/admin/users', this.context).then(response => {
          if (response) {
            usersNormal = response.data;
            this.render();
          }
        });
      }
    });
  }

  enableFilters(id) {
    const filters = id.includes('admin') ? adminFilters : usersFilters;

    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];

      if (filter.classList.contains('filter-disabled')) {
        filter.classList.remove('filter-disabled');
      }

      if (i === 0) {
        filter.classList.add('filter-active');
      }

      filter.addEventListener(...filerClickListener);
    }
  }

  disableFilters(id) {
    const filters = id.includes('admin') ? adminFilters : usersFilters;

    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];
      if (filter.classList.contains('filter-active')) {
        filter.classList.remove('filter-active');
      }
      filter.classList.add('filter-disabled');
      filter.removeEventListener(...filerClickListener);
    }
  }

  filterClickHandler(event, filter, filters, id) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (filter.className.includes('active')) {
      const sortIcon = filter.children[1].className;
      let className = null;
      if (sortIcon.includes('up')) {
        className = sortIcon.replace('up', 'down');
        filter.dataset.order = 'desc';
      } else {
        className = sortIcon.replace('down', 'up');
        filter.dataset.order = 'asc';
      }
      filter.children[1].className = className;
    } else {
      filters.forEach(fil => {
        if (fil.className.includes('active')) {
          const className = fil.className;
          fil.className = className.split(' ').filter(name => name !== 'filter-active');
        }
      });
      const className = filter.className;
      filter.className = className + ' filter-active';
    }
    this.buildUsersList(id, true);
  }

  addFilterListener(id) {
    const filters = id.includes('admin') ? adminFilters : usersFilters;

    filerClickListener = [
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const filter =
          event.target.tagName === 'SPAN' ? event.target : event.target.parentNode;

        if (filter.className.includes('active')) {
          const sortIcon = filter.children[1].className;
          let className = null;
          if (sortIcon.includes('up')) {
            className = sortIcon.replace('up', 'down');
            filter.dataset.order = 'desc';
          } else {
            className = sortIcon.replace('down', 'up');
            filter.dataset.order = 'asc';
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
          filter.className = className + ' filter-active';
        }
        this.buildUsersList(id, true);
      },
      true
    ];

    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];
      filter.addEventListener(...filerClickListener);
    }
  }

  setDefaultSort(id, data) {
    const elem = this.context.querySelector(id);
    const filters = elem.querySelectorAll('span.filter');

    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];
      if (filter.className.includes('active')) {
        return this.sort(filter.dataset.action, filter.dataset.order, data);
      }
    }
  }

  sort(filter, order, data) {
    if (filter === 'alpha-sort') {
      return SortHelper.sortArrayAlpha(data, 'lastname', order);
    } else if (filter === 'creation-sort') {
      return SortHelper.sortArrayByDate(data, 'dateCreated', order);
    } else if (filter === 'connection-sort') {
      return SortHelper.sortArrayByDate(data, 'lastConnection', order);
    }
  }

  setActions(users) {
    this.editAction(users);
    this.grantOrRevokeAction(users);
    this.deleteAction(users);
  }

  buildUsersList(id, defaultSort = true, fromDisabled = false) {
    const container = document.querySelector(id + ' > .grid-users');

    let users = id.includes('admin') ? usersAdmin.users : usersNormal.users;

    if (fromDisabled) {
      this.enableFilters(id);
    }

    if (defaultSort) {
      users = this.setDefaultSort(id, users);
    }

    container.innerHTML = '';
    container.innerHTML = usersListTemplate({
      users: users
    });

    this.setActions(users);

    if (users.length <= 1) {
      this.disableFilters(id);
    }
  }

  addSearchListener(id) {
    let timer = null;
    const search = document.getElementById('search');

    search.addEventListener('keydown', event => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const inputValue = event.keyCode;
        const query = search.value.trim();
        if (
          (inputValue >= 65 && inputValue <= 90) ||
          inputValue === 8 ||
          inputValue === 46
        ) {
          if (StringHelper.isAlpha(query)) {
            searchUser(
              '/admin/users/search/user?q=' + search.value.trim(),
              this.context
            ).then(response => {
              const usersFilter = response.data.users.filter(t => {
                return t.role === 'user';
              });
              usersNormal.users = usersFilter;
              this.buildUsersList(id, true, true);
            });
          } else if (query === '') {
            getUsers('/admin/users', this.context).then(response => {
              if (response) {
                usersNormal.users = response.data.users;
                this.buildUsersList(id, true, true);
              }
            });
          }
        }
      }, 200);
    });
  }

  render() {
    this.context.innerHTML = usersManagementTemplate({
      title: 'Manage Users',
      totalAdmin: usersAdmin.total,
      totalNormal: usersNormal.total
    });

    const usersAdminElem = this.context.querySelector('#users-admin');
    const usersNormalElem = this.context.querySelector('#users-normal');

    adminFilters = usersAdminElem.querySelectorAll('span.filter');
    usersFilters = usersNormalElem.querySelectorAll('span.filter');

    this.addFilterListener('#users-admin');
    this.buildUsersList('#users-admin');

    this.addFilterListener('#users-normal');
    this.buildUsersList('#users-normal');

    this.addSearchListener('#users-normal');
  }

  inputListener(input) {
    input.addEventListener('focusout', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = StringHelper.capitalizeFirst(input.value.toLowerCase());
    });
  }

  editAction(users) {
    const buttons = this.context.querySelectorAll('button#edit');

    buttons.forEach(button => {
      const userId = button.closest('#user-infos').dataset.user;
      const user = users.find(elem => elem._id === userId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const content = editUserTemplate({
          email: user.email,
          lastname: user.lastname,
          firstname: user.firstname,
          role: user.role
        });

        const elems = ['email', 'lastname', 'firstname', 'role'];

        ModalHelper.edit('Edit information', content, 'update', elems).then(result => {
          if (result.value) {
            const data = result.value;

            updateUser('/admin/users/' + userId, data, this.context).then(response => {
              const user = response.data.user;

              const userFullName = StringHelper.capitalizeFirst(user.firstname).concat(
                ' ',
                StringHelper.capitalizeFirst(user.lastname)
              );

              ModalHelper.notification(
                'success',
                userFullName + ' successfully updated.'
              );
              // eslint-disable-next-line no-new
              new UsersManagement();
            });
          }
        });

        const lastnameInput = document.querySelector('input#lastname');
        const firstnameInput = document.querySelector('input#firstname');

        this.inputListener(lastnameInput);
        this.inputListener(firstnameInput);
      });
    });
  }

  grantOrRevokeAction(users) {
    const buttons = this.context.querySelectorAll('button#edit-role');

    buttons.forEach(button => {
      const userId = button.closest('#user-infos').dataset.user;
      const user = users.find(elem => elem._id === userId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const role = user.role.toLowerCase();
        const data = {
          role: role === 'admin' ? 'user' : 'admin'
        };

        const userFullName = StringHelper.capitalizeFirst(user.firstname).concat(
          ' ',
          StringHelper.capitalizeFirst(user.lastname)
        );
        const askTitle = role === 'admin' ? 'Revoke role Admin' : 'Grant role Admin';

        const askMessage =
          role === 'admin'
            ? userFullName + ' will loose all privileges.'
            : userFullName + ' will receive admin privileges.';

        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            const confirmMessage =
              role === 'admin'
                ? 'Admin privileges revoked.'
                : 'Admin privileges granted.';

            updateRole('/admin/users/role/' + userId, data, this.context).then(
              response => {
                if (response) {
                  ModalHelper.notification('success', confirmMessage);
                  // eslint-disable-next-line no-new
                  new UsersManagement();
                }
              }
            );
          }
        });
      });
    });
  }

  deleteAction(users) {
    const buttons = this.context.querySelectorAll('button#delete');

    buttons.forEach(button => {
      const userId = button.closest('#user-infos').dataset.user;
      const user = users.find(elem => elem._id === userId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const userFullName = StringHelper.capitalizeFirst(user.firstname).concat(
          ' ',
          StringHelper.capitalizeFirst(user.lastname)
        );

        const askTitle = 'Delete ' + userFullName + ' ?';
        const askMessage = userFullName + ' will be permanently deleted.';

        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            deleteUser('/admin/users/' + userId, this.context).then(response => {
              ModalHelper.notification(
                'success',
                userFullName + ' successfully deleted.'
              );
              // eslint-disable-next-line no-new
              new UsersManagement();
            });
          }
        });
      });
    });
  }
}

async function getUsers(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context, true);
  }
}

async function updateUser(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

async function updateRole(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

async function deleteUser(url, context) {
  try {
    const response = await axios.delete(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

async function searchUser(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context);
  }
}

export default UsersManagement;
