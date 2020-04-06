import Component from '@Component';
import jobsTemplate from './jobs.hbs';

class Jobs extends Component {
  constructor(context = null) {
    super(context);

    this.context.innerHTML = jobsTemplate({
      title: 'Jobs'
    });

    this.run();
  }

  run() {
    /**
     * your Code Logic HERE
     */
  }
}

export default Jobs;
