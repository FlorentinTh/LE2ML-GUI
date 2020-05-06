import learningTemplate from './learning.hbs';
import Task from '../Task';
import StringHelper from '@StringHelper';

let process;

class Learning extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.make();
  }

  make() {
    process = sessionStorage.getItem('process-type');

    this.context.innerHTML = learningTemplate({
      title: StringHelper.capitalizeFirst(process) + 'ing Process'
    });
  }
}

export default Learning;
