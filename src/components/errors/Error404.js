import { ErrorComponent } from './ErrorComponent';

export class Error404 extends ErrorComponent {
  constructor(context = null) {
    // eslint-disable-next-line quotes
    super(context, 404, `Make sure the address is correct and the page hasn't moved.`);
  }

  trigger() {
    super.trigger();
  }
}
