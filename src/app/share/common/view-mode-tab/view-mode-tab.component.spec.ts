import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ViewModeTabComponent} from './view-mode-tab.component';

describe('ViewModeTabComponent', () => {
  let component: ViewModeTabComponent;
  let fixture: ComponentFixture<ViewModeTabComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ViewModeTabComponent],
    });
    fixture = TestBed.createComponent(ViewModeTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
