import windowingTemplate from './windowing.hbs';
import Task from '../Task';

let slider;
let sliderTooltip;

class Windowing extends Task {
  constructor(context) {
    super(context);
    this.context = context;
    this.make();
  }

  initSlider() {
    sliderTooltip.textContent = slider.value + ' %';
  }

  sliderChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    sliderTooltip.textContent = this.value + ' %';
  }

  make() {
    this.context.innerHTML = windowingTemplate({
      title: 'Windowing'
    });

    slider = this.context.querySelector('input#overlap');
    sliderTooltip = this.context.querySelector('.range-value');
    this.initSlider();
    slider.addEventListener('input', this.sliderChangeListener, false);
  }
}

export default Windowing;
