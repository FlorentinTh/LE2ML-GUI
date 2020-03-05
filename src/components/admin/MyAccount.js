import { Component } from '../Component';
import myAccountHTMLComponent from '../../pages/fragment/admin/my-account.html';

export class Settings extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    super.makeTitle('My Account');
    super.injectHTMLPage(myAccountHTMLComponent);
    this.run();
  }

  run() {}
}
