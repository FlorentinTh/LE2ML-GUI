import processTemplate from './process.hbs';
import Task from '../Task';
import StringHelper from '@StringHelper';

let process;

class Process extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.make();
  }

  make() {
    process = sessionStorage.getItem('process-type');

    this.context.innerHTML = processTemplate({
      title: StringHelper.capitalizeFirst(process) + 'ing Process'
    });
  }
}

export default Process;
