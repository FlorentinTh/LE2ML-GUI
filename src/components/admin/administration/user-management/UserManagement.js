import Component from '@Component';
import Store from '@Store';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import SortHelper from '@SortHelper';
import StringHelper from '@StringHelper';
import userManagementTemplate from './user-management.hbs';
import userListTemplate from './user-list.hbs';
import editUserTemplate from './edit-user.hbs';
import axios from 'axios';

let usersAdmin;
let usersNormal;

let usersNormalFull;

let adminFilters;
let normalFilters;

let filerClickListener;

class UserManagement extends Component {
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
            usersNormalFull = response.data.users;
            this.render();
          }
        });
      }
    });
  }

  enableFilters(id) {
    const filters = id.includes('admin') ? adminFilters : normalFilters;

    const defaultFilter = filters[0];
    let isOtherActive = false;
    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];

      if (filter.classList.contains('filter-disabled')) {
        filter.classList.remove('filter-disabled');
      }

      if (filter.classList.contains('filter-active')) {
        isOtherActive = true;
      }

      filter.addEventListener(...filerClickListener);
    }

    if (!isOtherActive) {
      const className = defaultFilter.children[1].className.replace('down', 'up');
      defaultFilter.children[1].classList = className;
      defaultFilter.dataset.order = 'asc';
      defaultFilter.classList.add('filter-active');
    }
  }

  disableFilters(id) {
    const filters = id.includes('admin') ? adminFilters : normalFilters;

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
    this.buildUserList(id, true);
  }

  addFilterClickListener(id) {
    const filters = id.includes('admin') ? adminFilters : normalFilters;

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
        this.buildUserList(id, true);
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

  buildUserList(id, defaultSort = true, fromDisabled = false) {
    const container = document.querySelector(id + ' > .grid-users');

    let users = id.includes('admin') ? usersAdmin.users : usersNormal.users;

    if (fromDisabled) {
      this.enableFilters(id);
    }

    if (defaultSort) {
      users = this.setDefaultSort(id, users);
    }

    container.innerHTML = '';
    container.innerHTML = userListTemplate({
      users: users
    });

    this.setActions(users);

    if (users.length <= 1) {
      this.disableFilters(id);
    }
  }

  addSearchListener(id) {
    const search = document.getElementById('search');

    let timer = null;

    let query = '';

    search.addEventListener('keydown', event => {
      const inputValue = event.keyCode;
      if (
        (inputValue >= 65 && inputValue <= 90) ||
        inputValue === 8 ||
        inputValue === 46
      ) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          query = search.value.trim();

          if (StringHelper.isAlpha(query)) {
            const result = usersNormalFull.filter(
              user =>
                user.lastname.includes(query) ||
                user.firstname.includes(query) ||
                user.email.includes(query)
            );

            usersNormal.users = result;
            this.buildUserList(id, true, true);
          }
        }, 200);
      }
    });

    search.addEventListener('keyup', event => {
      if (search.value.trim() === '' && !(query === '')) {
        if (event.keyCode === 8 || event.keyCode === 46) {
          usersNormal.users = usersNormalFull;
          this.buildUserList(id, true, true);
        }
      }
    });
  }

  render() {
    this.context.innerHTML = userManagementTemplate({
      title: 'Manage Users',
      totalAdmin: usersAdmin.total,
      totalNormal: usersNormal.total
    });

    const usersAdminElem = this.context.querySelector('#users-admin');
    const usersNormalElem = this.context.querySelector('#users-normal');

    adminFilters = usersAdminElem.querySelectorAll('span.filter');
    normalFilters = usersNormalElem.querySelectorAll('span.filter');

    this.addFilterClickListener('#users-admin');
    this.buildUserList('#users-admin');

    this.addFilterClickListener('#users-normal');
    this.buildUserList('#users-normal');

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
              if (response) {
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
                new UserManagement();
              }
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
                  new UserManagement();
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
              if (response) {
                ModalHelper.notification(
                  'success',
                  userFullName + ' successfully deleted.'
                );
                // eslint-disable-next-line no-new
                new UserManagement();
              }
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
    if (error) {
      APIHelper.errorsHandler(error, context);
    }
  }
}

export default UserManagement;
