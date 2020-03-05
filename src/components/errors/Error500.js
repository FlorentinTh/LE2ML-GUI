import { ErrorComponent } from './ErrorComponent';

export class Error500 extends ErrorComponent {
  constructor(context = null) {
    // eslint-disable-next-line quotes
    super(context, 500, `Internal server error. Try again later.`);
  }

  trigger() {
    super.trigger();
  }
}
