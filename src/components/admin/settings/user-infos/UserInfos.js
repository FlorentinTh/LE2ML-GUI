import Component from '@Component';
import userInfosHTML from './user-infos.html';

class UserInfos extends Component {
  constructor(context = null) {
    super(context);
    super.clearContent();
    super.makeTitle('My Information');
    super.injectHTMLPage(userInfosHTML);
    this.mount();
  }

  mount() {}
}

export default UserInfos;
