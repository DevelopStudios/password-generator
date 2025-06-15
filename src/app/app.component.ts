import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SliderComponent } from './components/slider/slider.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SliderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {

  title = 'password-generator';
  mySliderValue = 9; // Initial value
  ngAfterViewInit(): void {  
  }

}
