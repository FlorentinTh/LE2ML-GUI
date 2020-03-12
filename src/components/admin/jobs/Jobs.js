import Component from '@Component';

class Jobs extends Component {
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

export default Jobs;
