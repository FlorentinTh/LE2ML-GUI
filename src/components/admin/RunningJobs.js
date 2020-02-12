import { PageComponent } from './../PageComponent';

export class RunningJobs extends PageComponent {
	constructor() {
		super();
	}

	build() {
		this.makeTitle('Running Jobs');
	}

	makeTitle(title) {
		document.querySelector('main.content').innerHTML = `<h1>${title}</h1>`;
	}
}
