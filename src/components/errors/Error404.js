import ErrorComponent from '@Errors/ErrorComponent';

class Error404 extends ErrorComponent {
  constructor(context = null) {
    super(context, 404, "Make sure the address is correct and the page hasn't moved.");
  }

  trigger() {
    super.trigger();
  }
}

export default Error404;
