import { Component } from './../Component';

export class RunningJobs extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    super.makeTitle('Running Jobs');
    this.run();
  }

  run() {
    /**
     * your Code Logic HERE
     */
  }
}
