import Component from '@Component';
import tempPasswordTemplate from './temp-password.hbs';
import Store from '@Store';
import Router from '@Router';
import URLHelper from '@URLHelper';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import StringHelper from '@StringHelper';
import * as EmailValidator from 'email-validator';

import axios from 'axios';

class TempPassword extends Component {
  constructor(context = null) {
    super(context);

    this.context.innerHTML = tempPasswordTemplate({
      title: 'Temporary Password'
    });

    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');

    this.submitForm();
    this.cancelListener();
  }

  submitForm() {
    const emailInput = document.querySelector('input#email');
    this.inputListener(emailInput);

    const tempPasswordForm = document.querySelector('form');

    tempPasswordForm.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const jsonData = Object.fromEntries(new FormData(tempPasswordForm));

      const data = {
        email: jsonData.email.toLowerCase(),
        tempPassword: jsonData.tempPassword.trim(),
        tempPasswordConfirm: jsonData.tempPasswordConfirm.trim()
      };

      setTempPassword('/admin/users/password/' + data.email, data, this.context).then(
        response => {
          ModalHelper.notification('success', response.message);
        }
      );
    });
  }

  inputListener(input) {
    input.addEventListener('focusout', event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (input.id === 'email') {
        const value = input.value.toLowerCase();
        input.value = value;

        if (!(value.trim() === '')) {
          if (EmailValidator.validate(value)) {
            getUserByEmail('/admin/users/email/' + value, this.context).then(response => {
              const data = response.data.user;
              const userName = StringHelper.capitalizeFirst(data.firstname).concat(
                ' ',
                StringHelper.getFirstLetterCapitalized(data.lastname)
              );
              ModalHelper.notification('success', 'Correct email for ' + userName);
            });
          }
        }
      }
    });
  }

  cancelListener() {
    const cancelButton = document.getElementById('cancel');

    cancelButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      Router.setRoute(URLHelper.getPage() + '#administration');
    });
  }
}

async function getUserByEmail(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    if (error) {
      APIHelper.errorsHandler(error, true);
    }
  }
}

async function setTempPassword(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    if (error) {
      APIHelper.errorsHandler(error, true);
    }
  }
}

export default TempPassword;
