import Component from '@Component';
import usersManagementHTML from './users-management.html';
import Store from '@Store';
import APIHelper from '@APIHelper';
import SortHelper from '@SortHelper';
import StringHelper from '@StringHelper';

import * as GrowlNotification from 'growl-notification/dist/growl-notification.min.js';
import 'growl-notification/dist/colored-theme.min.css';
import axios from 'axios';
import dayjs from 'dayjs';

const LIMIT = 2;

let limit = LIMIT;
let clicked = 0;

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

    getUsers('/admin/users').then(response => {
      if (response) {
        const adminObj = response.data.admin;
        const userObj = response.data.normal;

        this.makeView('users-admin', 'Administrator', adminObj);
        this.buildList('users-admin', adminObj, true);

        this.makeView('users-normal', 'Users', userObj);
        this.buildList('users-normal', userObj, true);

        this.addFilterListener('users-admin', (action, order) => {
          const sortedList = this.sort(action, order, adminObj.users.slice(0, limit));
          this.buildList('users-admin', sortedList);
        });

        this.addFilterListener('users-normal', (action, order) => {
          const sortedList = this.sort(action, order, userObj.users.slice(0, limit));
          this.buildList('users-normal', sortedList);
        });

        this.addLoadMoreListener('users-normal', userObj.users);
      }
    });
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

  sort(filter, order, data) {
    if (filter === 'alpha-sort') {
      return SortHelper.sortArrayAlpha(data, 'lastname', order);
    } else if (filter === 'creation-sort') {
      return SortHelper.sortArrayByDate(data, 'dateCreated', order);
    } else if (filter === 'connection-sort') {
      return SortHelper.sortArrayByDate(data, 'lastConnection', order);
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

    let html = `<div class="grid-container"  id="${id}">
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

    users.forEach(user => {
      let item = `<div class="grid-item" id="user-infos">
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
            <i class="fas fa-envelope"></i>
            ${user.email}
          </p>
          <p class="info">
            <i class="fas fa-calendar-check"></i>
            created on ${dayjs(user.dateCreated).format('DD/MM/YYYY')}
          </p>
          <p class="info">
            <i class="fas fa-clock"></i>`;
      if (!(user.lastConnection === null)) {
        item += `last conn. on
                ${dayjs(user.lastConnection).format('DD/MM/YYYY')}
                @
                ${dayjs(user.lastConnection).format('HH:mm:ss')}`;
      } else {
        item += `no connection so far.`;
      }

      item += `</p>
        </div>
        <div class="actions">
          <p class="action">
            <button>Edit</button>
          </p>
          <p class="action">
            <button>Revoke Role</button>
          </p>
          <p class="action">
            <button>Delete</button>
          </p>
        </div>
      </div>`;

      listHTML.insertAdjacentHTML('beforeend', item);
    });
  }

  addLoadMoreListener(id, data) {
    const elem = this.context.querySelector(`#${id}`);
    const btn = elem.querySelector('button.show');

    btn.addEventListener('click', event => {
      switch (clicked) {
        case 0:
          this.buildList(id, data);
          clicked++;
          limit = data.length;
          btn.textContent = 'Show Less ';
          btn.insertAdjacentHTML('beforeend', `<i class="fas fa-caret-up"></i>`);
          break;

        case 1:
          limit = LIMIT;
          this.buildList(id, data.slice(0, limit));
          clicked--;

          btn.textContent = 'Show More ';
          btn.insertAdjacentHTML('beforeend', `<i class="fas fa-caret-down"></i>`);

          break;
      }
    });
  }
}

async function getUsers(url) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    if (error.response.data) {
      const err = error.response.data;
      GrowlNotification.notify({
        title: `Error: ${err.code}`,
        description:
          err.code === 422
            ? 'Please check that your inputs are correctly formed.'
            : err.message,
        position: 'top-right',
        type: 'error',
        closeTimeout: 5000
      });
    }
  }
}

export default UsersManagement;
