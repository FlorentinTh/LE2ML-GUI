import ErrorComponent from '@Errors/ErrorComponent';

class Error500 extends ErrorComponent {
  constructor(context = null) {
    super(context, 500, 'Internal server error. Try again later.');
  }

  trigger() {
    super.trigger();
  }
}

export default Error500;
