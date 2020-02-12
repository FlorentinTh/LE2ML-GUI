import { Theme } from '../components/Theme';
import { Url } from './../utils/Url';
import routes from './routes';

export class Router {
	static route(hash = null) {
		hash === null && this.getHash() !== '' ? (hash = this.getHash()) : null;

		if (hash === null) {
			if (this.getPath() === '/') {
				this.loadIndex();
			} else {
				this.loadPage();
			}
		} else {
			this.loadComponent(hash);
		}
	}

	static getPath() {
		return window.location.pathname;
	}

	static getHash() {
		return window.location.hash;
	}

	static getRoute() {
		return window.location.pathname + window.location.hash;
	}

	static getFullRoute() {
		return window.location.href;
	}

	static setRoute(route) {
		if (Url.isRouteValid(route)) {
			window.location.replace(decodeURI(route));
		} else {
			throw new Error('Specified route is not valid.');
		}
	}

	static loadIndex() {
		const ctx = document.querySelector('*[class^="theme-"]');
		const theme = new Theme(ctx);
		theme.init();
		theme.toggle();
		require('../pages/index');
	}

	static loadPage() {
		const page = this.getPath().split('.')[0].split('/')[1];
		require(`../pages/${page}`);
	}

	static loadComponent(hash) {
		this.loadPage();

		let routeObj = null;

		routes.forEach((route) => {
			if (route.hash === hash) {
				routeObj = route;
			}
		});

		if (routeObj !== null) {
			const component = new routeObj.component();
			component.build();
		} else {
			throw new Error(`No component found for hash: ${hash}`);
		}
	}
}
