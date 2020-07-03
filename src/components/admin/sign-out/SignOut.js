import Component from '@Component';
import signOutTemplate from './sign-out.hbs';
import Cookies from 'js-cookie';
import Router from '@Router';

class SignOut extends Component {
  constructor(context = null) {
    super(context);

    this.context.innerHTML = signOutTemplate({
      title: 'Sign Out',
      message: 'Please wait, you will be automatically redirected.'
    });

    this.run();
  }

  run() {
    setTimeout(() => {
      Cookies.remove('uuid', { path: '/' });
      Router.setRoute('/index.html');
    }, 1000);
  }
}

export default SignOut;
