import { Router } from './../router/Router';
import { Theme } from './../components/Theme';

const ctx = document.querySelector('*[class^="theme-"]');
const theme = new Theme(ctx);
theme.toggle();

const registerButton = document.getElementById('register');

registerButton.addEventListener('click', (event) => {
	event.preventDefault();
	event.stopImmediatePropagation();
	Router.setRoute('/register.html');
});
