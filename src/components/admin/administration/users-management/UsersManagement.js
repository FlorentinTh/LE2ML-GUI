import Component from '@Component';
import Store from '@Store';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import SortHelper from '@SortHelper';
import StringHelper from '@StringHelper';

import axios from 'axios';
import dayjs from 'dayjs';

const LIMIT = 5;

let limit = LIMIT;
let clicked = 0;

class UsersManagement extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    super.makeTitle('Manage Users');
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');

    getUsers('/admin/users', this.context).then(response => {
      if (response) {
        this.render(response.data);
      }
    });
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

  setDefaultSort(id, data) {
    const elem = this.context.querySelector(`#${id}`);
    const filters = elem.querySelectorAll('span.filter');

    for (let i = 0; i < filters.length; ++i) {
      const filter = filters[i];
      if (filter.className.includes('active')) {
        return this.sort(filter.dataset.action, filter.dataset.order, data);
      }
    }
  }

  addFilterListener(id, callback) {
    const elem = this.context.querySelector(`#${id}`);
    const filters = elem.querySelectorAll('span.filter');

    filters.forEach(filter => {
      filter.addEventListener('click', event => {
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
              fil.className = className
                .split(' ')
                .filter(name => name !== 'filter-active');
            }
          });
          const className = filter.className;
          filter.className = `${className} filter-active`;
        }

        return callback(filter.dataset.action, filter.dataset.order);
      });
    });
  }

  makeView(id, title, data) {
    const total = data.total;

    let html = `<div class="grid-container" id="${id}">
      <h2>
        ${title}
        <span class="badge">${total}</span>
      </h2>
      <div class="filters">
        <span class="filter filter-active" data-action="alpha-sort" data-order="asc">
          <i class="fas fa-font"></i>
          <i class="fas fa-long-arrow-alt-up"></i>
        </span>
        <span class="filter" data-action="creation-sort" data-order="asc">
          <i class="fas fa-calendar-check"></i>
          <i class="fas fa-long-arrow-alt-up"></i>
        </span>
        <span class="filter" data-action="connection-sort" data-order="asc">
          <i class="fas fa-clock"></i>
          <i class="fas fa-long-arrow-alt-up"></i>
        </span>
      </div>
      <div class="grid-users">
      </div>`;
    if (total > LIMIT) {
      if (limit > LIMIT) {
        html += `<button class="link show">Show Less <i class="fas fa-caret-up"></i></button>`;
      } else {
        html += `<button class="link show">Show More <i class="fas fa-caret-down"></i></button>`;
      }
    }

    html += `</div>`;

    this.context.insertAdjacentHTML('beforeend', html);
  }

  buildList(id, data, defaultSort = false) {
    const listHTML = this.context.querySelector(`#${id} > div.grid-users`);

    let users = data;

    if (defaultSort) {
      users = this.setDefaultSort(id, users.users.slice(0, limit));
    } else {
      let child = listHTML.lastElementChild;
      while (child) {
        listHTML.removeChild(child);
        child = listHTML.lastElementChild;
      }
    }

    const connectedUser = APIHelper.getConnectedUser();

    users.forEach(user => {
      let item = `<div class="grid-item" id="user-infos" data-user="${user._id}">
        <div class="head">
          <i class="fas fa-user-circle"></i>
          <span>
            ${StringHelper.capitalizeFirst(user.firstname)}
            ${StringHelper.capitalizeFirst(user.lastname)}
          </span>
        </div>
        <div class="infos">
          <p class="info">
            <strong>${user.firstname} ${user.lastname}</strong>
          </p>
          <p class="info">
            <i class="fas fa-envelope"></i>${user.email}</p>
          <p class="info">`;

      const created = dayjs(user.dateCreated).format('DD/MM/YYYY');

      item += `<i class="fas fa-calendar-check"></i>created on ${created}</p>
          <p class="info">
            <i class="fas fa-clock"></i>`;

      if (!(user.lastConnection === null)) {
        item += `last conn. on ${dayjs(user.lastConnection).format(
          'DD/MM/YYYY'
        )} @ ${dayjs(user.lastConnection).format('HH:mm:ss')}`;
      } else {
        item += `no connection so far.`;
      }

      item += `</p>
        </div>
        <div class="actions">
          <p class="action">`;
      if (!(connectedUser._id === user._id)) {
        item += `<button id="edit">Edit</button>`;
      } else {
        item += `<button class="btn-disabled" id="edit" disabled>Edit</button>`;
      }

      item += `</p>
          <p class="action">`;

      if (user.role === 'admin') {
        if (!(connectedUser._id === user._id)) {
          item += `<button id="edit-role">Revoke role</button>`;
        } else {
          item += `<button class="btn-disabled" id="edit-role" disabled>Revoke role</button>`;
        }
      } else {
        item += `<button id="edit-role">Grant admin</button>`;
      }

      item += `</p>
          <p class="action">`;

      if (!(connectedUser._id === user._id)) {
        item += `<button id="delete">Delete</button>`;
      } else {
        item += `<button class="btn-disabled" id="delete" disabled>Delete</button>`;
      }

      item += `</p>
        </div>
      </div>`;

      listHTML.insertAdjacentHTML('beforeend', item);
    });

    this.editAction(users);
    this.grantOrRevokeAction(users);
    this.deleteAction(users);
  }

  addLoadMoreListener(id, data) {
    const elem = this.context.querySelector(`#${id}`);
    const btn = elem.querySelector('button.show');

    if (!(btn === null)) {
      btn.addEventListener('click', event => {
        switch (clicked) {
          case 0:
            this.buildList(id, this.setDefaultSort(id, data));
            clicked++;
            limit = data.length;
            btn.textContent = 'Show Less ';
            btn.insertAdjacentHTML('beforeend', `<i class="fas fa-caret-up"></i>`);
            break;

          case 1:
            limit = LIMIT;
            this.buildList(id, this.setDefaultSort(id, data).slice(0, limit));
            clicked--;

            btn.textContent = 'Show More ';
            btn.insertAdjacentHTML('beforeend', `<i class="fas fa-caret-down"></i>`);

            break;
        }
      });
    }
  }

  render(data) {
    if (data.admin.total > 0) {
      this.makeView('users-admin', 'Administrator', data.admin);
      this.buildList('users-admin', data.admin, true);

      this.addFilterListener('users-admin', (action, order) => {
        const sortedList = this.sort(action, order, data.admin.users.slice(0, limit));
        this.buildList('users-admin', sortedList);
      });

      this.addLoadMoreListener('users-admin', data.admin.users);
    }

    if (data.normal.total > 0) {
      this.makeView('users-normal', 'Users', data.normal);
      this.buildList('users-normal', data.normal, true);

      this.addFilterListener('users-normal', (action, order) => {
        const sortedList = this.sort(action, order, data.normal.users.slice(0, limit));
        this.buildList('users-normal', sortedList);
      });

      this.addLoadMoreListener('users-normal', data.normal.users);
    }
  }

  editAction(users) {
    const buttons = this.context.querySelectorAll('button#edit');

    buttons.forEach(button => {
      const userId = button.closest('#user-infos').dataset.user;
      const user = users.find(elem => elem._id === userId);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        let content = `<div class="user-infos user-infos-modal">
          <div class="form">
            <form action="#">
              <input
                type="email"
                id="email"
                name="email"
                autocomplete="email"
                value="${user.email}"
                required
              />
              <input
                type="text"
                id="lastname"
                name="lastname"
                autocomplete="family-name"
                placeholder="Lastname"
                value="${StringHelper.capitalizeFirst(user.lastname)}"
                required
              />
              <input
                type="text"
                id="firstname"
                name="firstname"
                autocomplete="given-name"
                value="${StringHelper.capitalizeFirst(user.firstname)}"
                placeholder="Firstname"
                required
              />
              <select id="role">`;

        if (user.role === 'admin') {
          content += `<option value="admin" selected>Admin</option>
                <option value="user">User</option>`;
        } else {
          content += `<option value="admin">Admin</option>
                <option value="user" selected>User</option>`;
        }

        content += `</select>
            </form>
          </div>
        </div>`;

        const elems = ['email', 'lastname', 'firstname', 'role'];

        ModalHelper.edit(`Edit information`, content, 'update', elems).then(result => {
          if (result.value) {
            const data = result.value;

            updateUser(`/admin/users/${userId}`, data, this.context).then(response => {
              const user = response.data.user;

              const userFullName = StringHelper.capitalizeFirst(user.firstname).concat(
                ' ',
                StringHelper.capitalizeFirst(user.lastname)
              );

              ModalHelper.notification(
                'success',
                `${userFullName} successfully updated.`
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

  inputListener(input) {
    input.addEventListener('focusout', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = StringHelper.capitalizeFirst(input.value.toLowerCase());
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
        const askTitle = role === 'admin' ? `Revoke role ADMIN` : `Grant role ADMIN`;

        const askMessage =
          role === 'admin'
            ? `${userFullName} will loose all privileges.`
            : `${userFullName} will receive admin privileges.`;

        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            const confirmMessage =
              role === 'admin'
                ? 'Admin privileges revoked.'
                : 'Admin privileges granted.';

            updateRole(`/admin/users/role/${userId}`, data, this.context).then(
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

        const askTitle = `Delete ${userFullName} ?`;
        const askMessage = `${userFullName} will be permanently deleted.`;

        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            deleteUser(`/admin/users/${userId}`, this.context).then(response => {
              ModalHelper.notification(
                'success',
                `${userFullName} successfully deleted.`
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

export default UsersManagement;
