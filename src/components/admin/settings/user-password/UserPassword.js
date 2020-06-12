import Component from '@Component';
import Store from '@Store';
import APIHelper from '@APIHelper';
import URLHelper from '@URLHelper';
import Router from '@Router';
import ModalHelper from '@ModalHelper';
import userPasswordTemplate from './user-password.hbs';
import axios from 'axios';
import Cookies from 'js-cookie';

class UserPassword extends Component {
  constructor(context = null) {
    super(context);

    this.context.innerHTML = userPasswordTemplate({
      title: 'Change my password'
    });
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('my-account');

    const user = APIHelper.getConnectedUser();

    const isLogged = Cookies.get('isLogged');
    if (isLogged === 'true') {
      ModalHelper.confirm(
        'Temporary Password',
        'Your password is temporary, you must change it before continue.',
        'I understand',
        false
      );
    }

    this.initInputs(user);
    this.submitForm(user);
    this.cancelListener();
  }

  initInputs(user) {
    const emailInput = this.context.querySelector('input[type="email"]');
    emailInput.value = user.email.toLowerCase();
  }

  submitForm(user) {
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

      changePassword('/users/password/' + user._id, data, this.context).then(response => {
        if (response) {
          const inputs = changePasswordForm.querySelectorAll('input:not([type=email])');
          inputs.forEach(input => {
            input.value = '';
          });

          const data = response.data;

          Cookies.remove('uuid', { path: '/' });
          Cookies.set('uuid', data.user.token, { path: '/' });

          ModalHelper.notification('success', 'Password successfully modified.').then(
            () => {
              const isLogged = Cookies.get('isLogged');
              if (isLogged === 'true') {
                Cookies.remove('isLogged', { path: '/' });
              }
            }
          );
        }
      });
    });
  }

  cancelListener() {
    const cancelButton = document.getElementById('cancel');

    cancelButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      Router.setRoute(URLHelper.getPage() + '#my-account');
    });
  }
}

async function changePassword(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

export default UserPassword;
