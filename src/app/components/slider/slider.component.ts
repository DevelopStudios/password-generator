import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // Add this import for common Angular directives

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule], // Include CommonModule here
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss'
})
export class SliderComponent implements OnInit, AfterViewInit {
  @Input() min = 0;
  @Input() max = 100;
  @Input() step = 1;

  @Input()
  get value(): number {
    return this._value;
  }
  set value(newValue: number) {
    const steppedValue = Math.round(newValue / this.step) * this.step;
    const clampedValue = Math.max(this.min, Math.min(this.max, steppedValue));

    // Only update if the value has actually changed to prevent unnecessary re-renders/emits
    if (this._value !== clampedValue) {
      this._value = clampedValue;
      this.valueChange.emit(this._value);
      this.updateSliderPositions(); // Update thumb and fill positions whenever value changes
    }
  }
  private _value = 0; // Internal private value backing the 'value' input

  @Output() valueChange = new EventEmitter<number>();

  // Properties to control HTML elements' styles (bound via [style.left.px] and [style.width.px])
  thumbPosition = 0; // Position for the left edge of the thumb (center will be at this point due to transform)
  fillWidth = 0;     // Width of the filled part of the track

  isDragging = false; // Flag to indicate if the slider is being dragged

  // Use @ViewChild for robust and Angular-idiomatic access to DOM elements within the template
  @ViewChild('sliderTrack') sliderTrack!: ElementRef<HTMLDivElement>;
  @ViewChild('sliderThumb') sliderThumb!: ElementRef<HTMLDivElement>;

  constructor() {
    // Initial value setup: if _value is 0 (default) and min is not 0, set _value to min
    // This provides a good default if 'value' input is not provided initially.
    if (this._value === 0 && this.min !== 0) {
      this._value = this.min;
    }
  }

  ngOnInit(): void {
    // Ensure initial positioning is correct based on the initial value
    // This is called after inputs are bound.
    this.updateSliderPositions();
  }

  ngAfterViewInit(): void {
    // This hook is called after the component's view has been fully initialized,
    // ensuring that @ViewChild references (sliderTrack, sliderThumb) are available.
    this.updateSliderPositions();
    if (this.sliderThumb && this.sliderTrack) {
      this.sliderThumb.nativeElement.addEventListener('touchstart', this.onTouchStart.bind(this),{passive:false});
      this.sliderTrack.nativeElement.addEventListener('touchstart', this.onTouchStart.bind(this), {passive: false});
    }
  }

   /**
   * Calculates the slider value based on a given clientX coordinate.
   * This is a helper to deduplicate logic for mouse and touch events.
   * @param clientX The clientX coordinate from a mouse or touch event.
   * @returns The calculated value for the slider.
   */
  private calculateValueFromClientX(clientX: number): number {
    if (!this.sliderTrack) return this.value; // Fallback if track element isn't available

    const trackRect = this.sliderTrack.nativeElement.getBoundingClientRect();
    const offsetX = clientX - trackRect.left; // Mouse/touch X position relative to track's left edge

    // Clamp the position within the bounds of the track
    let newPosition = Math.max(0, Math.min(trackRect.width, offsetX));

    // Calculate normalized value (0-1) based on clamped position
    const normalizedPosition = newPosition / trackRect.width;
    const newValue = this.min + normalizedPosition * (this.max - this.min);

    return newValue;
  }

  /**
   * Calculates and updates the pixel positions for the thumb and the track fill.
   */
  updateSliderPositions(): void {
    // Ensure elements are available before trying to get their dimensions
    if (!this.sliderTrack || !this.sliderThumb) {
      // This can happen in constructor or ngOnInit if elements aren't rendered yet.
      // ngAfterViewInit helps mitigate this, but a check is still good.
      return;
    }

    const trackWidth = this.sliderTrack.nativeElement.clientWidth;
    // const thumbWidth = this.sliderThumb.nativeElement.clientWidth; // Not directly used in position calc here

    const range = this.max - this.min;
    // Normalize the current value to a 0-1 range based on min/max
    const normalizedValue = range === 0 ? 0 : (this.value - this.min) / range;
    this.thumbPosition = normalizedValue * trackWidth;
    // The fill width extends to the same point as the thumb's center
    this.fillWidth = this.thumbPosition;
  }

  /**
   * Starts the dragging process when the mouse is pressed down on the thumb.
   * @param event The mouse event.
   */
  startDrag(event: MouseEvent): void {
    event.preventDefault(); // Prevent default browser actions (like text selection) during drag
    this.isDragging = true;

    // Add event listeners to the global document to track mouse movement anywhere on the page
    // Using arrow functions for dragHandler and stopDragHandler automatically binds 'this' context
    document.addEventListener('mousemove', this.dragHandler);
    document.addEventListener('mouseup', this.stopDragHandler);

    // Immediately call dragHandler to handle cases where user clicks directly on the thumb to set value
    this.dragHandler(event);
  }

  /**
   * Handles the dragging motion, updating the slider's value based on mouse position.
   * Defined as an arrow function to automatically bind 'this' context.
   * @param event The mouse event.
   */
  dragHandler = (event: MouseEvent): void => {
    if (this.isDragging && this.sliderTrack) {
      const trackRect = this.sliderTrack.nativeElement.getBoundingClientRect();
      const offsetX = event.clientX - trackRect.left; // Mouse X position relative to track's left edge

      // Clamp the mouse position within the bounds of the track
      let newPosition = Math.max(0, Math.min(trackRect.width, offsetX));

      // Calculate normalized value (0-1) based on clamped position
      const normalizedPosition = newPosition / trackRect.width;
      const newValue = this.min + normalizedPosition * (this.max - this.min);

      // Update the component's value. The 'value' setter will handle clamping, stepping,
      // emitting valueChange, and updating thumb/fill positions.
      this.value = newValue;
    }
  };

  /**
   * Stops the dragging process when the mouse button is released.
   * Defined as an arrow function to automatically bind 'this' context.
   */
  stopDragHandler = (): void => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.dragHandler);
    document.removeEventListener('mouseup', this.stopDragHandler);
  };

  // -- Touch Events --

   /**
   * Initiates touch dragging.
   * @param event The touch event.
   */
  onTouchStart(event:TouchEvent): void {
    event.preventDefault();
    this.isDragging = true;
      document.addEventListener('touchmove', this.touchDragHandler, { passive: false });
      document.addEventListener('touchend', this.touchStopDragHandler);
      document.addEventListener('touchcancel', this.touchStopDragHandler); // Handles scenarios like incoming calls

      // Handle initial touch to set value
      if (event.touches.length > 0) {
          this.touchDragHandler(event);
      }
  }
 /**
   * Handles touch movement to update the slider's value.
   * @param event The touch event.
   */
  touchDragHandler = (event: TouchEvent): void => {
      if (this.isDragging && event.touches.length > 0) {
          // Use the clientX of the first touch point
          this.value = this.calculateValueFromClientX(event.touches[0].clientX);
      }
  };

  /**
   * Stops touch dragging.
   */
  touchStopDragHandler = (): void => {
      this.isDragging = false;
      document.removeEventListener('touchmove', this.touchDragHandler);
      document.removeEventListener('touchend', this.touchStopDragHandler);
      document.removeEventListener('touchcancel', this.touchStopDragHandler);
  };
  /**
   * Listens for window resize events to re-calculate slider element positions.
   */
  @HostListener('window:resize')
  onResize(): void {
    // Re-calculate positions when window resizes, as track width might change
    this.updateSliderPositions();
  }
}