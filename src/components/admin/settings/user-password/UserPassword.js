import Component from '@Component';
import userPasswordHTML from './user-password.html';
import Store from '@Store';
import APIHelper from '@APIHelper';
import URLHelper from '@URLHelper';
import Router from '@Router';

import axios from 'axios';
import * as GrowlNotification from 'growl-notification/dist/growl-notification.min.js';
import 'growl-notification/dist/colored-theme.min.css';

class UserPassword extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    super.makeTitle('Change my password');
    super.injectHTMLPage(userPasswordHTML);
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('my-account');

    const emailInput = this.context.querySelector('input[type="email"]');
    const user = APIHelper.getConnectedUser();
    emailInput.value = user.email.toLowerCase();

    const changePasswordForm = document.querySelector('form');

    changePasswordForm.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const jsonData = Object.fromEntries(new FormData(changePasswordForm));

      const data = {
        email: jsonData.email.toLowerCase(),
        currentPassword: jsonData.currentPassword.trim(),
        newPassword: jsonData.newPassword.trim(),
        newPasswordConfirm: jsonData.newPasswordConfirm.trim()
      };

      changePassword(`/user/password/${user._id}`, data).then(response => {
        if (response) {
          const inputs = changePasswordForm.querySelectorAll('input:not([type=email])');
          inputs.forEach(input => {
            input.value = '';
          });

          GrowlNotification.notify({
            title: 'Password successfully changed',
            description: 'You can now use this password in order to sign in.',
            position: 'top-right',
            type: 'success',
            closeTimeout: 3000
          });
        }
      });
    });

    const cancelButton = document.getElementById('cancel');

    cancelButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      Router.setRoute(`${URLHelper.getPage()}#my-account`);
    });
  }
}

async function changePassword(url, data) {
  try {
    const response = await axios.post(url, data, {
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

export default UserPassword;
