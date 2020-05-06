import Component from '@Component';
import dataTemplate from './data.hbs';

class Data extends Component {
  constructor(context = null) {
    super(context);
    this.context.innerHTML = dataTemplate({
      title: 'Data'
    });
    this.run();
  }

  run() {
    super.initGridMenu();
  }
}

export default Data;
