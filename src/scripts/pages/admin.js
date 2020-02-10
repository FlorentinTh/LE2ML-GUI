/* eslint-disable no-undef */
import { Menu } from '../components/Menu';
import { Router } from './../middleware/Router';
import { Url } from './../utils/Url';

let menu = new Menu();
let router = new Router();

function switchMenu() {
	let hash = router.getHash();

	if (hash === '') {
		hash = Url.toAnchor(Url.toSlug(menu.items[0].label));
	}

	menu.setActive(hash);
	router.setRoute(router.getPath() + hash);

	menu.context.find('a').on('click', (event) => {
		menu.setActive(event.target.hash);
		router.setRoute(router.getPath() + event.target.hash);
	});
}

(function() {
	menu.build();
	menu.enableTheme();
	switchMenu();
})();
