/* eslint-disable no-undef */
import { Theme } from './Theme';
import { Url } from './../utils/Url';

const defaultContext = $('#root').find('nav.menu');

const defaultItems = [
	{ label: 'Home', icon: 'fas fa-home' },
	{ label: 'Running Jobs', icon: 'fas fa-tasks' },
	{ label: 'Cluster Management', icon: 'fab fa-docker' },
	{ label: 'Proxy Management', icon: 'fas fa-network-wired' },
	{ label: 'Logout', icon: 'fas fa-sign-out-alt' }
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
							<i class="${item.icon}"></i>
							<a href="${Url.toAnchor(Url.toSlug(item.label))}">${item.label}</a>
						</li>`;
		});

		content += '</ul>';
		this.context.html(content);
	}

	enableTheme() {
		if (this.theme) {
			let ctx = $('body').find('*[class^="theme-"]');
			let theme = new Theme(ctx);
			theme.init();
			theme.toggle();
		}
	}

	setActive(hash) {
		let list = null;

		if (this.theme) {
			list = this.context.children('ul').children('li').slice(1);
		} else {
			list = this.context.children('ul').children('li');
		}

		for (let i = 0; i < list.length; ++i) {
			let item = list[i];
			item.removeAttribute('class');
			if (item.children[1].hash === hash) {
				item.setAttribute('class', 'active');
			}
		}
	}
}
