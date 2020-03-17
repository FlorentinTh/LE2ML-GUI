import Router from '@Router';
import Theme from '@Theme';
import Controller from '@Controller';
import APIHelper from '@APIHelper';

import * as GrowlNotification from 'growl-notification/dist/growl-notification.min.js';
import 'growl-notification/dist/colored-theme.min.css';
import axios from 'axios';

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

  cancelListener() {
    const cancelButton = document.getElementById('cancel');

    cancelButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      Router.setRoute('/index.html');
    });
  }
}

async function register(url, data) {
  try {
    const response = await axios.put(url, data, {});
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

export default Register;
