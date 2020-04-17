import processTemplate from './process.hbs';
import Task from '../Task';

let process;

class Process extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.make();
  }

  make() {
    const activeNav = document.querySelector('li.item-active');
    process = activeNav.childNodes[1].textContent;

    this.context.innerHTML = processTemplate({
      title: process + ' Process'
    });
  }
}

export default Process;
