import { Router } from './../../router/Router';
import { Theme } from './../Theme';
import { URL } from '../../utils/URL';

import menu from '../../pages/fragment/admin/menu.html';

const defaultContext = document.querySelector('nav.menu');

const defaultItems = [
	{ label: 'Home', icon: 'fas fa-home', url: null },
	{ label: 'Running Jobs', icon: 'fas fa-tasks', url: null },
	{ label: 'Cluster Management', icon: 'fab fa-docker', url: 'https://www.portainer.io/' },
	{ label: 'Proxy Management', icon: 'fas fa-network-wired', url: 'https://containo.us/traefik/' },
	{ label: 'Logout', icon: 'fas fa-sign-out-alt', url: '#' }
];

export class Menu {
	constructor(context = defaultContext, items = defaultItems, theme = true) {
		this.context = context;
		this.items = items;
		this.theme = theme;
		this._init();
	}

	_init() {
		this._build();
		let hash = URL.getHash();

		if (hash === null) {
			hash = URL.toSlug(this.items[0].label);
			Router.setRoute(URL.getPage() + URL.toAnchor(hash));
		}

		Router.route(hash);
		this.setActive(hash);

		window.onhashchange = (event) => {
			Router.route();
			this.setActive(URL.getHash());
		};
	}

	_build() {
		this.context.insertAdjacentHTML('beforeend', menu);

		let content = '';

		Array.from(this.items, (item) => {
			content += `<li>
							<i class="${item.icon}"></i>`;
			if (item.url === null) {
				content += `<a href="${URL.toAnchor(URL.toSlug(item.label))}">${item.label}</a>`;
			} else {
				content += `<a href="${item.url}">${item.label}</a>`;
			}
			content += '</li>';
		});

		this.context.querySelector('ul').insertAdjacentHTML('beforeend', content);
	}

	enableTheme() {
		if (this.theme) {
			const context = document.body.querySelector('*[class^="theme-"]');
			const theme = new Theme(context);
			theme.toggle();
		}
	}

	setActive(hash) {
		let list = null;

		if (this.theme) {
			list = [].slice.call(this.context.querySelectorAll('ul > li')).slice(1);
		} else {
			list = [].slice.call(this.context.querySelectorAll('ul > li'));
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
		this.items.splice(position, 0, { label: label, icon: icon });
		this.build();
		this.enableTheme();
		this.switchMenu();
	}

	switch(handler) {
		const links = this.context.querySelectorAll('a');

		for (let i = 0; i < links.length; ++i) {
			const link = links[i];
			link.addEventListener('click', (event) => {
				event.preventDefault();
				event.stopImmediatePropagation();

				if (link.getAttribute('href').startsWith('#')) {
					this.setActive(URL.getHashName(event.target.hash));
					Router.setRoute(URL.getPage() + event.target.hash);

					if (typeof handler === 'function') {
						handler(event.target.hash);
					} else {
						throw new Error('handler must be a function.');
					}
				} else {
					if (typeof handler === 'function') {
						handler(null, link.getAttribute('href'));
					} else {
						throw new Error('handler must be a function.');
					}
				}
			});
		}
	}
}
