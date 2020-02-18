import { Component } from './../Component';

export class RunningJobs extends Component {
	constructor(context = null) {
		super(context);
	}

	build() {
		super.clearContent();
		super.makeTitle('Running Jobs');
	}
}
