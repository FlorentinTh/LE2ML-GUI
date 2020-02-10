/* eslint-disable no-undef */
import { Theme } from '../components/Theme';
import { Url } from './../utils/Url';

export class Router {
	constructor() {
		this.page = window.location.pathname;
	}

	route() {
		if (this.page === '/') {
			let ctx = $('body').find('*[class^="theme-"]');
			let theme = new Theme(ctx);
			theme.init();
			theme.toggle();
			require('../pages/index');
		} else {
			let page = this.page.split('.')[0].split('/')[1];
			require(`../pages/${page}`);
		}
	}
	getPath() {
		return window.location.pathname;
	}

	getHash() {
		return window.location.hash;
	}

	getRoute() {
		return window.location.pathname + window.location.hash;
	}

	getFullRoute() {
		return window.location.href;
	}

	setRoute(route) {
		if (Url.isRouteValid(route)) {
			window.location.replace(decodeURI(route));
		} else {
			throw new Error('Specified route is not a valid.');
		}
	}
}
