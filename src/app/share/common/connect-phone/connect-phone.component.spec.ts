import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ConnectPhoneComponent} from './connect-phone.component';

describe('ConnectPhoneComponent', () => {
  let component: ConnectPhoneComponent;
  let fixture: ComponentFixture<ConnectPhoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectPhoneComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectPhoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
