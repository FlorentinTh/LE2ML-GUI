import { URL } from '../utils/URL';
import routes from './routes';
import { Error404 } from '../components/errors/Error404';
import { Menu } from './../components/Menu';
export class Router {
	static _loadPage(page) {
		require(`../pages/${page}.js`);
	}

	static _loadComponent(hash) {
		if (typeof hash === 'string') {
			let route = null;

			routes.forEach((r) => {
				if (r.name === hash) {
					route = r;
				}
			});

			if (route !== null) {
				new route.component().build();
			} else {
				new Error404().trigger();
			}
		} else {
			throw new Error('expected type for argument hash is string.');
		}
	}

	static onHashChange(menu = null) {
		if (menu !== null) {
			if (menu instanceof Menu) {
				menu.setActive(URL.getHash());
			} else {
				throw new Error('argument menu should be an instance of object Menu');
			}
		}

		if (URL.getHash() === null) {
			this.setRoute(URL.getPage());
		} else {
			Router.route({ hash: URL.getHash() });
		}
	}

	static route(
		options = {
			page: null,
			hash: null
		}
	) {
		(options.hash === null || options.hash === undefined) && URL.getHash() !== ''
			? (options.hash = URL.getHash())
			: null;
		(options.page === null || options.page === undefined) && URL.getPage() !== ''
			? (options.page = URL.getPageName())
			: null;

		if (options.hash === null) {
			if (options.page === null) {
				this._loadPage('index');
			} else {
				this._loadPage(options.page);
			}
		} else {
			this._loadPage(options.page);
			this._loadComponent(options.hash);
		}

		window.addEventListener('hashchange', (event) => {
			event.stopImmediatePropagation();
			this.onHashChange();
		});
	}

	static follow(link) {
		if (typeof link === 'string') {
			link === '' ? (location.href = '#') : (location.href = link);
		} else {
			throw new Error('expected type for argument link is string.');
		}
	}

	static setRoute(route) {
		if (URL.isRouteValid(route)) {
			window.history.pushState('', '', window.location.href);
			window.location.replace(decodeURI(route));
		} else {
			throw new Error('specified route is not valid.');
		}
	}
}
