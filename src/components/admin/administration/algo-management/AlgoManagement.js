import Component from '@Component';
import algoManagementTemplate from './algo-management.hbs';
import algoListTemplate from './algo-list.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';

let allAlgorithms;

class AlgoManagement extends Component {
  constructor(reload = false, context = null) {
    super(context);
    this.title = 'Manage Algorithms';
    this.reload = reload;
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('administration');
    this.initData();
  }

  initData() {
    const algoStore = Store.get('algorithms');

    if (this.reload || algoStore === undefined) {
      this.initView(true);
      getAlgorithms('/algos', this.context).then(response => {
        if (response) {
          Store.add({
            id: 'algorithms',
            data: response.data
          });
          allAlgorithms = response.data;
          this.render();
        }
      });
    } else {
      allAlgorithms = algoStore.data;
      this.render();
    }
  }

  initView(loading = false) {
    const total = allAlgorithms === undefined ? 0 : allAlgorithms.total;
    this.context.innerHTML = algoManagementTemplate({
      title: this.title,
      total: total
    });

    if (loading) {
      this.buildAlgoList('#algorithms', { defaultSort: false, loading: loading });
    }
  }

  render() {
    this.initView();
    this.buildAlgoList('#algorithms');

    super.addSearchListener(allAlgorithms.algorithms, ['slug'], data => {
      allAlgorithms.algorithms = data;
      this.buildAlgoList('#algorithms');
    });
  }

  buildAlgoList(id, opts = { defaultSort: true, loading: false }) {
    const container = document.querySelector(id + ' > .grid-algos');

    if (opts.loading) {
      container.innerHTML = algoListTemplate({
        algorithms: [],
        loading: opts.loading
      });
    } else {
      container.innerHTML = algoListTemplate({
        algorithms: allAlgorithms.algorithms,
        loading: opts.loading
      });
    }
  }
}

async function getAlgorithms(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context, true);
  }
}

export default AlgoManagement;
