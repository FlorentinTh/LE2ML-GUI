import { PageController } from './PageController';
import { Router } from '../router/Router';
import { Theme } from '../components/Theme';
import * as GrowlNotification from 'growl-notification/dist/growl-notification.min.js';
import 'growl-notification/dist/colored-theme.min.css';
import axios from 'axios';
import Cookies from 'js-cookie';
import { User } from '../helpers/utils';

export class Index extends PageController {
  constructor() {
    super();
    if (!User.isConnected()) {
      this.run();
    } else {
      Router.setRoute('/admin.html');
    }
  }

  run() {
    const ctx = document.querySelector('*[class^="theme-"]');
    const theme = new Theme(ctx);
    theme.toggle();

    const registerButton = document.getElementById('register');

    registerButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      Router.setRoute('/register.html');
    });

    const signInForm = document.querySelector('form');

    signInForm.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const formData = new FormData(signInForm);
      const jsonData = Object.fromEntries(formData);

      signIn('/login', jsonData).then(response => {
        if (response) {
          const user = response.data.user;
          Cookies.set('uid', user.token, { expires: 7, path: '/' });
          Router.setRoute('/admin.html');
        }
      });
    });
  }
}

async function signIn(url, data) {
  try {
    const response = await axios.post(url, data, {});
    return response.data;
  } catch (error) {
    switch (error.response.status) {
      case 401:
        GrowlNotification.notify({
          title: 'Sign In failed',
          description: 'Please verify you are using the right credentials',
          position: 'bottom-center',
          type: 'error',
          closeTimeout: 3000
        });
        break;
      case 422:
        GrowlNotification.notify({
          title: 'Sign In failed !',
          description: 'Invalid inputs',
          position: 'bottom-center',
          type: 'error',
          closeTimeout: 3000
        });
        break;
    }
  }
}
