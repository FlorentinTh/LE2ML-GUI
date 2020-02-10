/* eslint-disable no-undef */

export class Theme {
	constructor(context) {
		this.context = context;
		this.switchLight = $(this.context).find('div.switch-theme input#switch-light');
		this.switchDark = $(this.context).find('div.switch-theme input#switch-dark');
	}

	init() {
		let theme;

		if (window.localStorage.getItem('theme') === null) {
			localStorage.setItem('theme', 'dark');
			theme = 'dark';
		} else {
			theme = window.localStorage.getItem('theme');
		}

		if (theme === 'dark') {
			this.switchDark.prop('checked', true);
		} else {
			this.switchLight.prop('checked', true);
		}
		this.context.removeClass().addClass(`theme-${theme}`);
	}

	toggle() {
		let input = $(this.context).find('div.switch-theme input[name="switch"]');
		$(input).on('change', (event) => {
			if (event.target.id === 'switch-dark') {
				localStorage.setItem('theme', 'dark');
				this.switchDark.prop('checked', true);
			} else {
				localStorage.setItem('theme', 'light');
				this.switchLight.prop('checked', true);
			}
			this.context.removeClass().addClass(`theme-${window.localStorage.getItem('theme')}`);
		});
	}
}
