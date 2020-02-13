import { Menu } from './../components/Menu';
import { Router } from './../router/Router';
import { URL } from './../utils/URL';

const menu = new Menu();

menu.listen((hash, link) => {
	if (hash !== null && link === undefined) {
		Router.route(URL.getHashName(hash));
	} else {
		Router.follow(link);
	}
});
