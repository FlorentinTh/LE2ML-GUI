import { Theme } from './Theme';
import { Url } from './../utils/Url';
import { Router } from './../middleware/Router';

const defaultContext = document.querySelector('nav.menu');

const defaultItems = [
	{ label: 'Home', icon: 'fas fa-home', url: null },
	{ label: 'Running Jobs', icon: 'fas fa-tasks', url: null },
	{ label: 'Cluster Management', icon: 'fab fa-docker', url: 'https://www.portainer.io/' },
	{ label: 'Proxy Management', icon: 'fas fa-network-wired', url: 'https://containo.us/traefik/' },
	{ label: 'Logout', icon: 'fas fa-sign-out-alt', url: null }
];

export class Menu {
	constructor(context = defaultContext, items = defaultItems, theme = true) {
		this.context = context;
		this.items = items;
		this.theme = theme;
	}

	build() {
		let content = `<div class="smartphone-menu-trigger"></div>
					<header class="logo">
						<a href="#">
							<img src="images/logo-liara-large.png" />
						</a>
						<h2>Dashboard</h2>
					</header>
					<ul>`;

		if (this.theme) {
			content += `<li>
							<div class="switch-theme">
								<input type="radio" name="switch" id="switch-light">
								<input type="radio" name="switch" id="switch-dark" checked>

								<label for="switch-light"><i class="fas fa-sun"></i></label>
								<label for="switch-dark"><i class="fas fa-moon"></i></label>

								<span class="toggle"></span>
							</div>
						</li>`;
		}

		Array.from(this.items, (item) => {
			content += `<li>
							<i class="${item.icon}"></i>`;
			if (item.url === null) {
				content += `<a href="${Url.toAnchor(Url.toSlug(item.label))}">${item.label}</a>`;
			} else {
				content += `<a href="${item.url}">${item.label}</a>`;
			}
			content += '</li>';
		});

		content += '</ul>';
		this.context.innerHTML = content;
	}

	enableTheme() {
		if (this.theme) {
			const ctx = document.body.querySelector('*[class^="theme-"]');
			const theme = new Theme(ctx);
			theme.init();
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
			if (item.children[1].hash === hash) {
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

	switchMenu(handler) {
		let hash = Router.getHash();

		if (hash === '') {
			hash = Url.toAnchor(Url.toSlug(this.items[0].label));
		}

		this.setActive(hash);
		Router.setRoute(Router.getPath() + hash);
		Router.route(hash);

		const links = this.context.querySelectorAll('a');

		for (let i = 0; i < links.length; ++i) {
			const link = links[i];
			link.addEventListener('click', (event) => {
				event.preventDefault();
				this.setActive(event.target.hash);
				Router.setRoute(Router.getPath() + event.target.hash);

				if (typeof handler == 'function') {
					handler(event.target.hash);
				}
			});
		}
	}
}
