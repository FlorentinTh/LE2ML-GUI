/* eslint-disable no-undef */
var $rootApp = $('#root');
var $switchLight = $('input#switch-light');
var $switchDark = $('input#switch-dark');
var theme;

export function init() {
	if (window.localStorage.getItem('theme') === null) {
		localStorage.setItem('theme', 'dark');
		theme = 'dark';
	} else {
		theme = window.localStorage.getItem('theme');
	}

	if (theme === 'dark') {
		$switchDark.prop('checked', true);
	} else {
		$switchLight.prop('checked', true);
	}

	$rootApp.removeClass().addClass('theme-' + theme);
}

export function toggle() {
	$('input[name="switch"]').on('change', (event) => {
		if (event.target.id === 'switch-dark') {
			localStorage.setItem('theme', 'dark');
			$switchDark.prop('checked', true);
		} else {
			localStorage.setItem('theme', 'light');
			$switchLight.prop('checked', true);
		}

		$rootApp.removeClass().addClass('theme-' + window.localStorage.getItem('theme'));
	});
}
