import Component from '@Component';
import homeTemplate from './home.hbs';

class Home extends Component {
  constructor(context = null) {
    super(context);
    this.context.innerHTML = homeTemplate({
      title: 'Select a Pipeline'
    });
    this.run();
  }

  async run() {
    super.initGridMenu();
  }
}

export default Home;
