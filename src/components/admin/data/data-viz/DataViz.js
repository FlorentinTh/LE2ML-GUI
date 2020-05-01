import Component from '@Component';
import dataVizTemplate from './data-viz.hbs';
import Store from '@Store';

class DataViz extends Component {
  constructor(context = null) {
    super(context);
    this.mount();

    this.context.innerHTML = dataVizTemplate({
      title: 'Data Visualisation'
    });
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('data');
  }
}

export default DataViz;
