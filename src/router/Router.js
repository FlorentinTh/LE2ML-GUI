import { Theme } from '../components/Theme';
import { URL } from '../utils/URL';
import routes from './routes';

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
				const component = new route.component();
				component.build();
			} else {
				throw new Error(`No component found for: ${hash}`);
			}
		} else {
			throw new Error('Parameter hash must be a string.');
		}
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
	}

	static follow(link) {
		if (typeof link === 'string') {
			link === '' ? (location.href = '#') : (location.href = link);
		} else {
			throw new Error('Parameter link must be a string.');
		}
	}

	static setRoute(route) {
		if (URL.isRouteValid(route)) {
			window.location.replace(decodeURI(route));
		} else {
			throw new Error('Specified route is not valid.');
		}
	}
}
