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
}

export default Component;
