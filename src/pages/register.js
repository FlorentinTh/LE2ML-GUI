import { Router } from './../router/Router';
import { Theme } from './../components/Theme';

const ctx = document.querySelector('*[class^="theme-"]');
const theme = new Theme(ctx);
theme.toggle();

const cancelButton = document.getElementById('cancel');

cancelButton.addEventListener('click', (event) => {
	event.preventDefault();
	event.stopImmediatePropagation();
	Router.setRoute('/index.html');
});
