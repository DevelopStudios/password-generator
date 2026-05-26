import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SliderComponent } from './slider.component';

describe('SliderComponent', () => {
  let component: SliderComponent;
  let fixture: ComponentFixture<SliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SliderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should clamp values to min', () => {
    component.min = 5;
    component.value = 2;
    expect(component.value).toBe(5);
  });

  it('should clamp values to max', () => {
    component.max = 15;
    component.value = 20;
    expect(component.value).toBe(15);
  });

  it('should respect step values', () => {
    component.min = 0;
    component.max = 10;
    component.step = 2;
    component.value = 3;
    expect(component.value).toBe(4); // 3 rounded to nearest multiple of 2
  });

  it('should emit valueChange when value is updated', () => {
    spyOn(component.valueChange, 'emit');
    component.value = 10;
    expect(component.valueChange.emit).toHaveBeenCalledWith(10);
  });

  it('should not emit valueChange if value is the same', () => {
    component.value = 10;
    spyOn(component.valueChange, 'emit');
    component.value = 10;
    expect(component.valueChange.emit).not.toHaveBeenCalled();
  });
});
