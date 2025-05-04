import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [],
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss'
})
export class SliderComponent {
  @Input() min = 0;
  @Input() max = 100;
  @Input() step = 1;
  @Input()
  get value(): number {
    return this._value;
  }
  set value(newValue: number) {
    this._value = Math.max(this.min, Math.min(this.max, newValue));
    this.valueChange.emit(this._value);
    this.updateThumbPosition();
  }
  private _value = 0;

  @Output() valueChange = new EventEmitter<number>();

  valuePosition = 0;
  isDragging = false;

  constructor() {
    this.updateThumbPosition();
  }

  ngOnInit(): void {
    this.updateThumbPosition();
  }

  updateThumbPosition(): void {
    const range = this.max - this.min;
    const normalizedValue = range === 0 ? 0 : (this.value - this.min) / range;
    this.valuePosition = normalizedValue * (this.getTrackWidth() - this.getThumbWidth());
  }

  getTrackWidth(): number {
    const trackElement = document.querySelector('.slider-track');
    return trackElement ? trackElement.clientWidth : 0;
  }

  getThumbWidth(): number {
    const thumbElement = document.querySelector('.slider-thumb');
    return thumbElement ? thumbElement.clientWidth : 0;
  }

  startDrag(event: MouseEvent): void {
    this.isDragging = true;
    document.addEventListener('mousemove', this.drag);
    document.addEventListener('mouseup', this.stopDrag);
  }

  drag = (event: MouseEvent): void => {
    if (this.isDragging) {
      const trackElement = document.querySelector('.slider-track');
      const thumbElement = document.querySelector('.slider-thumb');
      if (trackElement && thumbElement) {
        const trackRect = trackElement.getBoundingClientRect();
        const thumbRect = thumbElement.getBoundingClientRect();
        const offsetX = event.clientX - trackRect.left;
        const trackWidth = trackRect.width;
        const thumbWidth = thumbRect.width;

        let newPosition = offsetX - thumbWidth / 2;
        newPosition = Math.max(0, Math.min(trackWidth - thumbWidth, newPosition));

        const normalizedPosition = newPosition / (trackWidth - thumbWidth);
        const newValue = this.min + normalizedPosition * (this.max - this.min);
        this.value = Math.round(newValue / this.step) * this.step;
      }
    }
  };

  stopDrag = (): void => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.drag);
    document.removeEventListener('mouseup', this.stopDrag);
  };

  @HostListener('window:resize')
  onResize(): void {
    this.updateThumbPosition();
  }
}
