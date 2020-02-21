import routes from './routes';
import { Error404 } from '../components/errors/Error404';
import { Menu } from './../components/Menu';
import { URL } from './../helpers/utils';
export class Router {
	static _loadPage(page) {
		if (typeof page === 'string') {
			let route = null;

			routes.forEach((r) => {
				if (r.name === page) {
					route = r;
				}
			});

			if (route !== null) {
				new route.controller();
			} else {
				new Error404().trigger();
			}
		}
	}

	static _loadComponent(page, hash) {
		if (typeof hash === 'string') {
			let route = null;

			routes.forEach((r) => {
				if (r.name === page && r.components.length > 0) {
					r.components.forEach((c) => {
						if (c.name === hash) {
							route = c;
						}
					});
				}
			});

			if (route !== null) {
				new route.component();
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
			this._loadComponent(options.page, options.hash);
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

	static setRoute(route, redirect = false) {
		if (URL.isRouteValid(route)) {
			if (!redirect) {
				window.history.pushState('', '', window.location.href);
			}

			window.location.replace(decodeURI(route));
		} else {
			throw new Error('specified route is not valid.');
		}
	}
}
