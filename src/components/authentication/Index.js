import Controller from '@Controller';
import Router from '@Router';
import Theme from '@Theme';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';

import axios from 'axios';
import Cookies from 'js-cookie';

class Index extends Controller {
  constructor() {
    super();
    if (APIHelper.isUserConnected()) {
      Router.setRoute('/admin.html');
    } else {
      this.run();
    }
  }

  run() {
    this.notify();

    const ctx = document.querySelector('*[class^="theme-"]');
    const theme = new Theme(ctx);
    theme.toggle();

    const emailInput = document.querySelector('input#email');
    this.inputListener(emailInput);

    this.submitForm();
    this.registerButtonListener();
  }

  notify() {
    const isRegistered = Cookies.get('isRegistered');

    if (isRegistered === 'true') {
      ModalHelper.notification('success', 'Registration succeed.');
      Cookies.remove('isRegistered', { path: '/' });
    }
  }

  inputListener(input) {
    input.addEventListener('focusout', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = input.value.toLowerCase();
    });
  }

  submitForm() {
    const signInForm = document.querySelector('form');

    signInForm.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const formData = new FormData(signInForm);
      const jsonData = Object.fromEntries(formData);

      signIn('/login', jsonData, this.context).then(response => {
        if (response) {
          const userData = response.data.user;

          Cookies.set('uuid', userData.token, {
            path: '/',
            secure: true,
            expires: 30,
            sameSite: 'strict'
          });
          Cookies.set('isLogged', true, { path: '/' });
          Router.setRoute('/admin.html');
        }
      });
    });
  }

  registerButtonListener() {
    const registerButton = document.getElementById('register');

    registerButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      Router.setRoute('/register.html');
    });
  }
}

async function signIn(url, data, context) {
  try {
    const response = await axios.post(url, data, {});
    return response.data;
  } catch (error) {
    if (error) {
      APIHelper.errorsHandler(error, true, 'not-admin');
    }
  }
}

export default Index;
