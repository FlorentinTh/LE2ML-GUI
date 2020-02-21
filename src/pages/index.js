import { PageController } from './PageController';
import { Router } from '../router/Router';
import { Theme } from '../components/Theme';
import axios from 'axios';

export class Index extends PageController {
	constructor() {
		super();
		this.run();
	}

	run() {
		const ctx = document.querySelector('*[class^="theme-"]');
		const theme = new Theme(ctx);
		theme.toggle();

		const registerButton = document.getElementById('register');

		registerButton.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopImmediatePropagation();
			Router.setRoute('/register.html');
		});

		const signInForm = document.querySelector('form');

		signInForm.addEventListener('submit', (event) => {
			event.preventDefault();
			event.stopImmediatePropagation();

			const formData = new FormData(jsonData);
			const jsonData = JSON.stringify(Object.fromEntries(formData));

			signIn('mountains').then((data) => {
				if (data) {
					console.log(data);
				}
			});
		});
	}
}

async function signIn(url) {
	try {
		const response = await axios.get(url, {});
		return response.data;
	} catch (error) {
		console.log('error florentin');
	}
}
