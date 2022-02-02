import routes from '@Routes';
import Error404 from '@Error404';
import Menu from '@Menu/Menu.js';
import URLHelper from '@URLHelper';

class Router {
  static loadPage(page) {
    if (typeof page === 'string') {
      let route = null;

      routes.forEach(r => {
        if (r.name === page) {
          route = r;
        }
      });

      if (route !== null) {
        // eslint-disable-next-line no-new
        new route.Controller();
      } else {
        new Error404().trigger();
      }
    }
  }

  static loadComponent(page, hash, menu) {
    if (typeof hash === 'string') {
      let route = null;
      let parent = null;

      routes.forEach(r => {
        if (r.name === page && r.Components.length > 0) {
          r.Components.forEach(c => {
            if (c.name === hash) {
              route = c;
            }
          });
        }
      });

      if (route !== null) {
        // eslint-disable-next-line no-new
        new route.Controller();
      } else {
        routes.forEach(r => {
          if (r.name === page && r.Components.length > 0) {
            r.Components.forEach(c => {
              if (!(c.SubComponents === undefined)) {
                c.SubComponents.forEach(sc => {
                  if (sc.name === hash) {
                    parent = c;
                    route = sc;
                  } else {
                    if (!(sc.SubComponents === undefined)) {
                      sc.SubComponents.forEach(sc => {
                        if (sc.name === hash) {
                          parent = c;
                          route = sc;
                        }
                      });
                    }
                  }
                });
              }
            });
          }
        });

        if (!(route === null)) {
          // eslint-disable-next-line no-new
          new route.Controller();

          if (!(menu === null)) {
            menu.setActive(parent.name);
          }
        } else {
          new Error404().trigger();
        }
      }
    } else {
      throw new Error('Expected type for argument hash is String.');
    }
  }

  static onHashChangeHandler(menu = null) {
    if (!(menu === null)) {
      if (menu instanceof Menu) {
        menu.setActive(URLHelper.getHash());
      } else {
        throw new Error('Argument menu should be an instance of Object Menu.');
      }
    }

    if (URLHelper.getHash() === null) {
      Router.setRoute(URLHelper.getPage());
    } else {
      if (!(menu === null)) {
        Router.route({ hash: URLHelper.getHash(), menu });
      } else {
        Router.route({ hash: URLHelper.getHash() });
      }
    }
  }

  static route(
    options = {
      page: null,
      hash: null,
      menu: null
    }
  ) {
    if (
      (options.hash === null || options.hash === undefined) &&
      URLHelper.getHash() !== ''
    ) {
      options.hash = URLHelper.getHash();
    }

    if (
      (options.page === null || options.page === undefined) &&
      URLHelper.getPage() !== ''
    ) {
      options.page = URLHelper.getPageName();
    }

    if (options.hash === null) {
      if (options.page === null) {
        Router.loadPage('index');
      } else {
        Router.loadPage(options.page);
      }
    } else {
      Router.loadPage(options.page);
      Router.loadComponent(options.page, options.hash, options.menu);
    }

    window.addEventListener('hashchange', Router.onHashChangeHandler, true);
  }

  static follow(link) {
    if (typeof link === 'string') {
      link === '' ? (location.href = '#') : (location.href = link);
    } else {
      throw new Error('Expected type for argument link is String.');
    }
  }

  static setRoute(route, redirect = false) {
    if (URLHelper.isRouteValid(route)) {
      if (!redirect) {
        window.history.pushState('', '', window.location.href);
      }

      window.location.replace(decodeURI(route));
    } else {
      throw new Error('Specified route is not valid.');
    }
  }
}

export default Router;
