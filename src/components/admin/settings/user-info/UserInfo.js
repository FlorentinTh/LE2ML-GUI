import Component from '@Component';
import Store from '@Store';
import APIHelper from '@APIHelper';
import URLHelper from '@URLHelper';
import StringHelper from '@StringHelper';
import Router from '@Router';
import ModalHelper from '@ModalHelper';
import userInfosTemplate from './user-info.hbs';
import axios from 'axios';
import Cookies from 'js-cookie';

class UserInfos extends Component {
  constructor(context = null) {
    super(context);

    this.context.innerHTML = userInfosTemplate({
      title: 'My Information'
    });

    this.mount();
  }

  mount() {
    this.notify();

    const user = APIHelper.getConnectedUser();

    const menu = Store.get('menu-admin').data;
    menu.setActive('my-account');

    this.initInputs(user);
    this.submitForm(user);
    this.cancelListener();
  }

  notify() {
    const isChanged = Cookies.get('isChanged');
    if (isChanged === 'true') {
      ModalHelper.notification('success', 'Information successfully modified.');
      Cookies.remove('isChanged', { path: '/' });
    }
  }

  initInputs(user) {
    const emailInput = this.context.querySelector('input#email');
    const lastnameInput = this.context.querySelector('input#lastname');
    const firstnameInput = this.context.querySelector('input#firstname');

    emailInput.value = user.email.toLowerCase();
    lastnameInput.value = StringHelper.capitalizeFirst(user.lastname);
    firstnameInput.value = StringHelper.capitalizeFirst(user.firstname);

    this.inputListener(lastnameInput);
    this.inputListener(firstnameInput);
  }

  inputListener(input) {
    input.addEventListener('focusout', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = StringHelper.capitalizeFirst(input.value.toLowerCase());
    });
  }

  submitForm(user) {
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

      changeUserInfo('/users/' + user._id, data, this.context)
        .then(response => {
          if (response) {
            const userData = response.data.user;

            Cookies.remove('uuid', { path: '/' });
            Cookies.set('uuid', userData.token, {
              path: '/',
              secure: true,
              expires: 365,
              sameSite: 'strict'
            });
            Cookies.set('isChanged', true, { path: '/' });
            window.location.reload(false);
          }
        })
        .catch(error => {
          ModalHelper.notification('error', error);
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

async function changeUserInfo(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

export default UserInfos;
