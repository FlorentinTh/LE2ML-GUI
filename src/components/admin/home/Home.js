import Component from '@Component';

import homeTemlate from './home.hbs';

class Home extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();

    this.context.innerHTML = homeTemlate({
      title: 'Home'
    });

    this.run();
  }

  run() {
    /**
     * your Code Logic HERE
     */
  }
}

export default Home;
