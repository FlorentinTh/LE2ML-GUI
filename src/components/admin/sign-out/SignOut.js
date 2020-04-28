import Component from '@Component';
import signOutTemplate from './sign-out.hbs';

class SignOut extends Component {
  constructor(context = null) {
    super(context);

    this.context.innerHTML = signOutTemplate({
      title: 'Sign Out',
      message: 'Please wait, you will be automatically redirected.'
    });

    this.run();
  }

  run() {}
}

export default SignOut;
