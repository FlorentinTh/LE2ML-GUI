import { Router } from '../router/Router';
import { Theme } from '../components/Theme';
import { PageController } from './PageController';
import { User } from '../helpers/utils';
import * as GrowlNotification from 'growl-notification/dist/growl-notification.min.js';
import 'growl-notification/dist/colored-theme.min.css';
import axios from 'axios';

export class Register extends PageController {
  constructor() {
    super();
    if (User.isConnected()) {
      Router.setRoute('/admin.html');
    } else {
      this.run();
    }
  }

  run() {
    const ctx = document.querySelector('*[class^="theme-"]');
    const theme = new Theme(ctx);
    theme.toggle();

    const cancelButton = document.getElementById('cancel');

    cancelButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      Router.setRoute('/index.html');
    });

    const registerForm = document.querySelector('form');

    registerForm.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const formData = new FormData(registerForm);
      const jsonData = Object.fromEntries(formData);

      register('/register', jsonData).then(response => {
        if (response) {
          GrowlNotification.notify({
            title: 'Registration succeed',
            description:
              'You can now be redirected to the login page and use your credentials',
            position: 'top-right',
            type: 'success',
            closeTimeout: 3000
          });

          setInterval(() => {
            Router.setRoute('/index.html');
          }, 2500);
        }
      });
    });
  }
}

async function register(url, data) {
  try {
    const response = await axios.post(url, data, {});
    return response.data;
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 500:
          GrowlNotification.notify({
            title: 'Registration failed !',
            description: 'Please retry register a new account',
            position: 'top-right',
            type: 'error',
            closeTimeout: 5000
          });
          break;
        case 422:
          GrowlNotification.notify({
            title: 'Registration failed !',
            description: 'Please check that your inputs are correctly formed',
            position: 'top-right',
            type: 'error',
            closeTimeout: 5000
          });
          break;
      }
    } else {
      GrowlNotification.notify({
        title: 'Oops!',
        description: 'An unexpected error occurs',
        position: 'top-right',
        type: 'error',
        closeTimeout: 5000
      });
    }
  }
}
