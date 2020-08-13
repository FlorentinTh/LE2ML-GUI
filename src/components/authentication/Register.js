import Router from '@Router';
import Theme from '@Theme';
import Controller from '@Controller';
import APIHelper from '@APIHelper';
import StringHelper from '@StringHelper';

import axios from 'axios';
import Cookies from 'js-cookie';

class Register extends Controller {
  constructor() {
    super();
    if (APIHelper.isUserConnected()) {
      Router.setRoute('/admin.html');
    } else {
      this.run();
    }
  }

  run() {
    const ctx = document.querySelector('*[class^="theme-"]');
    const theme = new Theme(ctx);
    theme.toggle();

    this.submitForm();
    this.cancelListener();
  }

  submitForm() {
    const registerForm = document.querySelector('form');

    const emailInput = document.querySelector('input#email');
    const lastnameInput = document.querySelector('input#lastname');
    const firstnameInput = document.querySelector('input#firstname');

    this.inputListener(emailInput);
    this.inputListener(lastnameInput);
    this.inputListener(firstnameInput);

    registerForm.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const jsonData = Object.fromEntries(new FormData(registerForm));

      const data = {
        lastname: jsonData.lastname.toLowerCase(),
        firstname: jsonData.firstname.toLowerCase(),
        email: jsonData.email.toLowerCase(),
        password: jsonData.password.trim(),
        passwordConfirm: jsonData.passwordConfirm.trim()
      };

      register('/register', data, this.context).then(response => {
        if (response) {
          Cookies.set('isRegistered', true, { path: '/' });
          Router.setRoute('/index.html');
        }
      });
    });
  }

  inputListener(input) {
    input.addEventListener('focusout', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (input.id === 'email') {
        input.value = input.value.toLowerCase();
      } else {
        input.value = StringHelper.capitalizeFirst(input.value.toLowerCase());
      }
    });
  }

  cancelListener() {
    const cancelButton = document.getElementById('cancel');

    cancelButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      Router.setRoute('/index.html');
    });
  }
}

async function register(url, data, context) {
  try {
    const response = await axios.put(url, data, {});
    return response.data;
  } catch (error) {
    if (error) {
      APIHelper.errorsHandler(error, true, 'not-admin');
    }
  }
}

export default Register;
