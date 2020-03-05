import { Menu } from '../components/Menu';
import { PageController } from './PageController';
import Cookies from 'js-cookie';
import { Router } from './../router/Router';
import { User, URL } from '../helpers/utils';
import { Error404 } from './../components/errors/Error404';
import { Error500 } from './../components/errors/Error500';

const context = document.querySelector('nav.menu');

const itemsRoleAdmin = [
  {
    label: 'Home',
    icon: 'fas fa-home',
    url: null,
    selected: true
  },
  {
    label: 'Running Jobs',
    icon: 'fas fa-tasks',
    url: null
  },
  {
    label: 'Cluster Management',
    icon: 'fab fa-docker',
    url: 'https://www.portainer.io/'
  },
  {
    label: 'Proxy Management',
    icon: 'fas fa-network-wired',
    url: 'https://containo.us/traefik/'
  },
  {
    label: 'My Account',
    icon: 'fas fa-user-cog',
    url: null
  },
  {
    label: 'Administration',
    icon: 'fas fa-shield-alt',
    url: null
  },
  {
    label: 'Sign Out',
    icon: 'fas fa-sign-out-alt',
    url: '#logout'
  }
];

const itemsRoleUser = [
  {
    label: 'Home',
    icon: 'fas fa-home',
    url: null,
    selected: true
  },
  {
    label: 'Running Jobs',
    icon: 'fas fa-tasks',
    url: null
  },
  {
    label: 'My Account',
    icon: 'fas fa-user-cog',
    url: null
  },
  {
    label: 'Sign Out',
    icon: 'fas fa-sign-out-alt',
    url: '#logout'
  }
];

let menu = null;

export class Admin extends PageController {
  constructor() {
    super();

    if (!User.isConnected()) {
      Router.setRoute('/index.html');
    } else {
      if (menu === null) {
        User.getSignedUser()
          .then(response => {
            if (response) {
              const data = response.data;
              menu = this.createMenu(data.user.role);
              this.run();
            }
          })
          .catch(() => {
            const errorComponent = new Error404();
            errorComponent.trigger();
          });
      }
    }
  }

  createMenu(role) {
    if (!(typeof role === 'string')) {
      throw new Error('expected type for argument role is string.');
    }

    const isAdmin = role === 'admin';
    const options = {
      context: context,
      items: isAdmin ? itemsRoleAdmin : itemsRoleUser,
      theme: true,
      logoURL: URL.toAnchor(
        URL.toSlug(isAdmin ? itemsRoleAdmin[0].label : itemsRoleUser[0].label)
      )
    };
    return new Menu(options);
  }

  run() {
    menu.listen((hash, link) => {
      if (hash === '#logout') {
        Cookies.remove('uid', { path: '/' });
        Cookies.remove('token', { path: '/' });
        Router.setRoute('/index.html');
      }
    });
  }
}
