import Component from '@Component';

import homeHTML from './home.html';

class Home extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    super.makeTitle('Home');
    super.injectHTMLPage(homeHTML);
    this.run();
  }

  run() {
    /**
     * your Code Logic HERE
     */
  }
}

export default Home;
