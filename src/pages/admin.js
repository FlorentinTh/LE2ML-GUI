import { Menu } from '../components/Menu';
import { PageController } from './PageController';
import Cookies from 'js-cookie';
import { Router } from './../router/Router';
import { User } from '../helpers/utils';

let menu = null;

export class Admin extends PageController {
  constructor() {
    super();

    if (User.isConnected()) {
      if (menu === null) {
        menu = new Menu();
      }
      this.run();
    } else {
      Router.setRoute('/index.html');
    }
  }

  run() {
    menu.listen((hash, link) => {
      if (hash === '#logout') {
        Cookies.remove('uid', { path: '/' });
        Router.setRoute('/index.html');
      }
    });
  }
}
