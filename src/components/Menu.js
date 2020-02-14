import { Router } from '../router/Router';
import { Theme } from './Theme';
import { URL } from '../utils/URL';

let menu = require('../pages/fragment/menu.html');

const defaultContext = document.querySelector('nav.menu');
const defaultItems = [
	{ label: 'Home', icon: 'fas fa-home', url: null },
	{ label: 'Running Jobs', icon: 'fas fa-tasks', url: null },
	{
		label: 'Cluster Management',
		icon: 'fab fa-docker',
		url: 'https://www.portainer.io/',
	},
	{
		label: 'Proxy Management',
		icon: 'fas fa-network-wired',
		url: 'https://containo.us/traefik/',
	},
	{ label: 'Logout', icon: 'fas fa-sign-out-alt', url: '#logout' },
];
const defaultLogoURL = URL.toAnchor(URL.toSlug(defaultItems[0].label));

export class Menu {
	constructor(
		options = {
			context: defaultContext,
			items: defaultItems,
			theme: true,
			logoURL: defaultLogoURL,
		}
	) {
		this.options = options;
		this.options.context = this.options.context || defaultContext;
		this.options.items = this.options.items || defaultItems;
		this.options.theme = this.options.theme || true;
		this.options.logoURL = this.options.logoURL || defaultLogoURL;
		this._init();
	}

	_init() {
		this._build();
		this._enableTheme();

		let hash = URL.getHash();

		if (hash === null) {
			hash = URL.toSlug(this.options.items[0].label);
			Router.setRoute(URL.getPage() + URL.toAnchor(hash));
		}

		this.setActive(hash);

		window.onhashchange = () => {
			this.setActive(URL.getHash());
		};
	}

	_build() {
		this.options.context.insertAdjacentHTML('beforeend', menu);
		const logo = this.options.context.getElementsByClassName('logo')[0];
		logo.getElementsByTagName('a')[0].setAttribute(
			'href',
			this.options.logoURL
		);

		let content = '';

		Array.from(this.options.items, item => {
			content += `<li>
							<i class="${item.icon}"></i>`;
			if (item.url === null) {
				content += `<a href="${URL.toAnchor(URL.toSlug(item.label))}">${
					item.label
				}</a>`;
			} else {
				content += `<a href="${item.url}">${item.label}</a>`;
			}
			content += '</li>';
		});

		this.options.context
			.querySelector('ul')
			.insertAdjacentHTML('beforeend', content);
	}

	_enableTheme() {
		if (this.options.theme) {
			const context = document.body.querySelector('*[class^="theme-"]');
			const theme = new Theme(context);
			theme.toggle();
		}
	}

	_switch(href, callback) {
		if (href.startsWith('#')) {
			this.setActive(URL.getHashName(href));
			Router.setRoute(URL.getPage() + href);

			if (typeof callback === 'function') {
				callback(href);
			} else {
				throw new Error('callback must be a function.');
			}
		} else {
			if (typeof callback === 'function') {
				callback(null, href);
			} else {
				throw new Error('callback must be a function.');
			}
		}
	}

	setActive(hash) {
		let list = null;

		if (this.options.theme) {
			list = [].slice
				.call(this.options.context.querySelectorAll('ul > li'))
				.slice(1);
		} else {
			list = [].slice.call(
				this.options.context.querySelectorAll('ul > li')
			);
		}

		for (let i = 0; i < list.length; ++i) {
			const item = list[i];
			item.removeAttribute('class');
			const hashAttr = item.children[1].hash;

			if (URL.getHashName(hashAttr) === hash && hashAttr !== '') {
				item.setAttribute('class', 'active');
			}
		}
	}

	addItem(position, label, icon) {
		this.options.items.splice(position, 0, { label: label, icon: icon });
		this._init();
	}

	listen(handler) {
		const logo = this.options.context.querySelector('header > a > img');
		const list = this.options.context.querySelectorAll('ul > li');

		logo.addEventListener('click', event => {
			event.preventDefault();
			event.stopImmediatePropagation();

			const href = logo.parentElement.getAttribute('href');

			this._switch(href, (hash, link) => {
				if (typeof handler === 'function') {
					handler(hash, link);
				} else {
					throw new Error('handler must be a function.');
				}
			});
		});

		for (let i = 1; i < list.length; ++i) {
			const li = list[i];

			li.addEventListener('click', event => {
				event.preventDefault();
				event.stopImmediatePropagation();
				const href = li.children[1].getAttribute('href');
				this._switch(href, (hash, link) => {
					if (typeof handler === 'function') {
						handler(hash, link);
					} else {
						throw new Error('handler must be a function.');
					}
				});
			});
		}
	}
}
