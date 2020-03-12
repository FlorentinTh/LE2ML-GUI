import Component from '../Component';

import errorHTML from '@Errors/error.html';

class ErrorComponent extends Component {
  constructor(context = null, code, message) {
    super(context);

    this.code = code;
    this.message = message;
  }

  setCode() {
    this.context.querySelector('#code').innerHTML = this.code;
  }

  setMessage() {
    this.context.querySelector('#message').innerHTML = this.message;
  }

  trigger() {
    super.clearContent();
    super.injectHTMLPage(errorHTML);
    this.setCode();
    this.setMessage();
  }
}

export default ErrorComponent;
