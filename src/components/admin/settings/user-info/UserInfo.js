import Component from '@Component';
import userInfosHTML from './user-info.html';
import Store from '@Store';
import APIHelper from '@APIHelper';
import URLHelper from '@URLHelper';
import StringHelper from '@StringHelper';
import Router from '@Router';

import axios from 'axios';
import Cookies from 'js-cookie';
import * as GrowlNotification from 'growl-notification/dist/growl-notification.min.js';
import 'growl-notification/dist/colored-theme.min.css';

class UserInfos extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    super.makeTitle('My Information');
    super.injectHTMLPage(userInfosHTML);
    this.mount();
  }

  mount() {
    const isChanged = Cookies.get('isChanged');
    if (isChanged === 'true') {
      GrowlNotification.notify({
        title: 'Changes were made',
        description: 'Your information were successfully changed.',
        position: 'top-right',
        type: 'success',
        closeTimeout: 3000
      });
      Cookies.remove('isChanged', { path: '/' });
    }

    const menu = Store.get('menu-admin').data;
    menu.setActive('my-account');

    const emailInput = this.context.querySelector('input#email');
    const lastnameInput = this.context.querySelector('input#lastname');
    const firstnameInput = this.context.querySelector('input#firstname');

    const user = APIHelper.getConnectedUser();

    emailInput.value = user.email.toLowerCase();
    lastnameInput.value = StringHelper.capitalizeFirst(user.lastname);
    firstnameInput.value = StringHelper.capitalizeFirst(user.firstname);

    const changeInfoForm = document.querySelector('form');

    changeInfoForm.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const jsonData = Object.fromEntries(new FormData(changeInfoForm));

      const data = {
        email: jsonData.email.toLowerCase(),
        lastname: jsonData.lastname.toLowerCase(),
        firstname: jsonData.firstname.toLowerCase(),
        password: jsonData.password.trim(),
        passwordConfirm: jsonData.passwordConfirm.trim()
      };

      changeUserInfo(`/user/${user._id}`, data).then(response => {
        if (response) {
          const userData = response.data.user;
          Cookies.remove('uuid', { path: '/' });
          Cookies.set('uuid', userData.token, { path: '/' });
          Cookies.set('isChanged', true, { path: '/' });
          window.location.reload(false);
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

async function changeUserInfo(url, data) {
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

export default UserInfos;
