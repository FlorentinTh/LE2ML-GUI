import Menu from '@Menu/Menu.js';
import Controller from '@Controller';
import Router from '@Router';
import Store from '@Store';
import APIHelper from '@APIHelper';
import ListHelper from '@ListHelper';
import StringHelper from '@StringHelper';
import URLHelper from '@URLHelper';
import Cookies from 'js-cookie';

const context = document.querySelector('nav.menu');

const items = [
  {
    name: 'Home',
    icon: 'fas fa-home',
    url: null,
    selected: true
  },
  {
    name: 'Jobs',
    icon: 'fas fa-tasks',
    url: null
  },
  {
    name: 'Sign Out',
    icon: 'fas fa-sign-out-alt',
    url: '#signout'
  }
];

let menu = null;

class Admin extends Controller {
  constructor() {
    super();

    if (!APIHelper.isUserConnected()) {
      Router.setRoute('/index.html');
    } else {
      if (menu === null) {
        const user = APIHelper.getConnectedUser();

        menu = this.createMenu(user);

        Store.add({
          id: 'menu-admin',
          data: menu
        });

        this.run();
      }
    }
  }

  buildItemList(user) {
    if (!(typeof user === 'object')) {
      throw new Error('expected type for argument user is object.');
    }

    if (user.role === 'admin') {
      const adminData = [
        {
          name: 'Cluster Management',
          icon: 'fab fa-docker',
          url: 'https://www.portainer.io/'
        },
        {
          name: 'Proxy Management',
          icon: 'fas fa-network-wired',
          url: 'https://containo.us/traefik/'
        },
        {
          name: 'Administration',
          icon: 'fas fa-shield-alt',
          url: null
        }
      ];
      ListHelper.insertAt(items, 2, adminData);
    }

    const accountItem = {
      name: 'My Account',
      label: `${StringHelper.capitalizeFirst(
        user.firstname
      )} ${StringHelper.capitalizeFirst(user.lastname)}`,
      icon: 'fas fa-user-cog',
      url: null
    };

    ListHelper.insertAt(items, items.length - 1, accountItem);

    return items;
  }

  createMenu(user) {
    if (!(typeof user === 'object')) {
      throw new Error('expected type for argument user is object.');
    }

    const itemList = this.buildItemList(user);

    const options = {
      context: context,
      items: itemList,
      theme: true,
      logoURL: URLHelper.toAnchor(URLHelper.toSlug(itemList[0].name))
    };

    return new Menu(options);
  }

  run() {
    menu.listen((hash, link) => {
      if (hash === '#signout') {
        Cookies.remove('uuid', { path: '/' });
        Router.setRoute('/index.html');
      }
    });
  }
}

export default Admin;
