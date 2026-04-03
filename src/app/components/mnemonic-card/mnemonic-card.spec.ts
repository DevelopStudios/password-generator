import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MnemonicCard } from './mnemonic-card';

describe('MnemonicCard', () => {
  let component: MnemonicCard;
  let fixture: ComponentFixture<MnemonicCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MnemonicCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MnemonicCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
