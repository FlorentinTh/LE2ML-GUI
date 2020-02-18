import { Theme } from '../components/Theme';
import { URL } from '../utils/URL';
import routes from './routes';
import { Error404 } from '../components/errors/Error404';
import { Menu } from './../components/Menu';

export class Router {
	static _loadPage(page) {
		if (page === 'index') {
			const ctx = document.querySelector('*[class^="theme-"]');
			const theme = new Theme(ctx);
			theme.toggle();
		}

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
		Router.route(URL.getHash());
	}

	static route(hash = null) {
		hash === null && URL.getHash() !== '' ? (hash = URL.getHash()) : null;
		const page = URL.getPageName();

		if (hash === null) {
			if (URL.getPage() === '') {
				this._loadPage('index');
			} else {
				this._loadPage(page);
			}
		} else {
			this._loadPage(page);
			this._loadComponent(hash);
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
			window.location.replace(decodeURI(route));
		} else {
			throw new Error('specified route is not valid.');
		}
	}
}
