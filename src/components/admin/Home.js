import { PageComponent } from './../PageComponent';

import home from '../../pages/fragment/admin/home.html';

export class Home extends PageComponent {
	constructor() {
		super();
		this.context;
	}

	build() {
		this.context = document.querySelector('main.content');
		super.clearContent(this.context);
		super.makeTitle(this.context, 'Home');
		super.injectHTMLPage(this.context, home);
	}
}
