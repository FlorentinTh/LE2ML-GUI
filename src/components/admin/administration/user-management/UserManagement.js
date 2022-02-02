import Component from '@Component';
import Store from '@Store';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import StringHelper from '@StringHelper';
import userManagementTemplate from './user-management.hbs';
import userListTemplate from './user-list.hbs';
import editUserTemplate from './edit-user.hbs';
import axios from 'axios';
import { Filters, FilterType } from '@Filters';
import Search from '@Search';

let usersAdmin;
let usersNormal;
let usersNormalFull;
let adminFiltersElems;
let normalFiltersElems;
let adminFilters;
let normalFilters;

class UserManagement extends Component {
  constructor(reload = false, context = null) {
    super(context);
    this.isFiltersDisabled = false;
    this.reload = reload;
    this.title = 'Manage Users';
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');
    this.initData();
  }

  setActions(users) {
    this.editAction(users);
    this.grantOrRevokeAction(users);
    this.deleteAction(users);
  }

  buildUserList(id, opts = { defaultSort: true, loading: false }) {
    const container = document.querySelector(id + ' > .grid-users');

    let users;
    if (opts.loading) {
      users = [];
      container.innerHTML = userListTemplate({
        users,
        loading: opts.loading
      });

      if (!this.isFiltersDisabled) {
        if (id.includes('admin')) {
          adminFilters.disableFilters(false);
        } else {
          normalFilters.disableFilters(false);
        }
      }
    } else {
      users = id.includes('admin') ? usersAdmin.users : usersNormal.users;

      if (this.isFiltersDisabled) {
        this.isFiltersDisabled = false;
        if (id.includes('admin')) {
          adminFilters.enableFilters();
        } else {
          normalFilters.enableFilters();
        }
      }

      if (opts.defaultSort) {
        if (id.includes('admin')) {
          users = adminFilters.setDefaultSort(users);
        } else {
          users = normalFilters.setDefaultSort(users);
        }
      }

      container.innerHTML = userListTemplate({
        users,
        loading: opts.loading
      });

      this.setActions(users);

      if (users === undefined || users.length <= 1) {
        this.isFiltersDisabled = true;
        if (id.includes('admin')) {
          adminFilters.disableFilters();
        } else {
          normalFilters.disableFilters();
        }
      }
    }
  }

  initData() {
    const usersAdminStore = Store.get('users-admin');
    const usersNormalStore = Store.get('users-normal');

    if (
      this.reload ||
      (usersAdminStore === undefined && usersNormalStore === undefined)
    ) {
      this.initView(true);
      getUsers('/admin/users?role=admin', this.context)
        .then(response => {
          if (response) {
            Store.add({
              id: 'users-admin',
              data: response.data
            });

            usersAdmin = response.data;

            getUsers('/admin/users', this.context)
              .then(response => {
                if (response) {
                  Store.add({
                    id: 'users-normal',
                    data: response.data
                  });

                  usersNormal = response.data;
                  usersNormalFull = response.data.users;
                  this.render();
                }
              })
              .catch(error => {
                ModalHelper.notification('error', error);
              });
          }
        })
        .catch(error => {
          ModalHelper.notification('error', error);
        });
    } else {
      this.render();
    }
  }

  initView(loading = false) {
    this.context.innerHTML = userManagementTemplate({
      title: this.title,
      totalAdmin: usersAdmin === undefined ? 0 : usersAdmin.total,
      totalNormal: usersNormal === undefined ? 0 : usersNormal.total
    });

    const usersAdminElem = this.context.querySelector('#users-admin');
    const usersNormalElem = this.context.querySelector('#users-normal');

    adminFiltersElems = usersAdminElem.querySelectorAll('span.filter');
    normalFiltersElems = usersNormalElem.querySelectorAll('span.filter');

    adminFilters = new Filters(adminFiltersElems, FilterType.USERS);
    normalFilters = new Filters(normalFiltersElems, FilterType.USERS);

    if (loading) {
      this.buildUserList('#users-admin', { defaultSort: false, loading });
      this.buildUserList('#users-normal', { defaultSort: false, loading });
    }
  }

  render() {
    this.initView();

    adminFilters.addFilterClickListener(() => {
      this.buildUserList('#users-admin');
    });
    this.buildUserList('#users-admin');

    normalFilters.addFilterClickListener(() => {
      this.buildUserList('#users-normal');
    });
    this.buildUserList('#users-normal');

    Search.addSearchListener(
      usersNormalFull,
      ['firstname', 'lastname', 'email'],
      data => {
        usersNormal.users = data;
        this.buildUserList('#users-normal');
      }
    );
  }

  inputListener(input) {
    input.addEventListener(
      'input',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        input.value = StringHelper.capitalizeFirst(input.value.toLowerCase());
      },
      false
    );
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

        ModalHelper.edit('Edit information', content, 'update', elems)
          .then(result => {
            if (result.value) {
              const data = result.value;

              updateUser('/admin/users/' + userId, data, this.context)
                .then(response => {
                  if (response) {
                    const user = response.data.user;

                    const userFullName = StringHelper.capitalizeFirst(
                      user.firstname
                    ).concat(' ', StringHelper.capitalizeFirst(user.lastname));

                    ModalHelper.notification(
                      'success',
                      userFullName + ' successfully updated.'
                    );
                    // eslint-disable-next-line no-new
                    new UserManagement(true);
                  }
                })
                .catch(error => {
                  ModalHelper.notification('error', error);
                });
            }
          })
          .catch(error => {
            ModalHelper.notification('error', error);
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

        ModalHelper.confirm(askTitle, askMessage)
          .then(result => {
            if (result.value) {
              const confirmMessage =
                role === 'admin'
                  ? 'Admin privileges revoked.'
                  : 'Admin privileges granted.';

              updateRole(`/admin/users/${userId}/role`, data, this.context)
                .then(response => {
                  if (response) {
                    ModalHelper.notification('success', confirmMessage);
                    // eslint-disable-next-line no-new
                    new UserManagement(true);
                  }
                })
                .catch(error => {
                  ModalHelper.notification('error', error);
                });
            }
          })
          .catch(error => {
            ModalHelper.notification('error', error);
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

        ModalHelper.confirm(askTitle, askMessage)
          .then(result => {
            if (result.value) {
              deleteUser('/admin/users/' + userId, this.context)
                .then(response => {
                  if (response) {
                    ModalHelper.notification(
                      'success',
                      userFullName + ' successfully deleted.'
                    );
                    // eslint-disable-next-line no-new
                    new UserManagement(true);
                  }
                })
                .catch(error => {
                  ModalHelper.notification('error', error);
                });
            }
          })
          .catch(error => {
            ModalHelper.notification('error', error);
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
    APIHelper.errorsHandler(error, true);
  }
}

async function updateUser(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function updateRole(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
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
      APIHelper.errorsHandler(error, true);
    }
  }
}

export default UserManagement;
