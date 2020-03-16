import Controller from '@Controller';
import Router from '@Router';
import Theme from '@Theme';
import APIHelper from '@APIHelper';

import * as GrowlNotification from 'growl-notification/dist/growl-notification.min.js';
import 'growl-notification/dist/colored-theme.min.css';
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
          const userData = response.data.user;
          Cookies.set('uuid', userData.token, { path: '/' });
          Cookies.set('isLogged', true, { path: '/' });
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

export default Index;
