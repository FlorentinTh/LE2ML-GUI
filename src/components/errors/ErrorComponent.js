import Component from '../Component';
import errorTemplate from './error.hbs';

class ErrorComponent extends Component {
  constructor(context = null, code, message) {
    super(context);

    this.code = code;
    this.message = message;
  }

  trigger() {
    this.context.innerHTML = errorTemplate({
      code: this.code,
      message: this.message
    });
  }
}

export default ErrorComponent;
