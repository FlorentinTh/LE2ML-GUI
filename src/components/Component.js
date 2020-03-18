class Component {
  constructor(context) {
    if (context === null) {
      let ctx = document.querySelector('main.content');
      if (ctx === null) {
        ctx = document.querySelector('div.wrap');

        let child = ctx.lastElementChild;
        while (child) {
          ctx.removeChild(child);
          child = ctx.lastElementChild;
        }

        const div = ctx.createElement('div');
        div.setAttribute('class', 'center');
      }

      this.context = ctx;
    } else {
      if (typeof context === 'string') {
        this.context = document.querySelector(context);
      } else {
        throw new Error('Expected type for argument context is String.');
      }
    }
  }

  clearContent() {
    let child = this.context.lastElementChild;
    while (child) {
      this.context.removeChild(child);
      child = this.context.lastElementChild;
    }
  }

  injectHTMLPage(html) {
    if (typeof html === 'string') {
      this.context.insertAdjacentHTML('beforeend', html);
    } else {
      throw new Error('Expected type for argument html is String.');
    }
  }

  makeTitle(title) {
    if (typeof title === 'string') {
      this.context.insertAdjacentHTML('beforeend', `<h1>${title}</h1>`);
    } else {
      throw new Error('Expected type for argument title is String.');
    }
  }
}

export default Component;
