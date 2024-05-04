import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MultiLazySelectComponent} from './multi-lazy-select.component';

describe('MultiLazySelectComponent', () => {
  let component: MultiLazySelectComponent;
  let fixture: ComponentFixture<MultiLazySelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiLazySelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiLazySelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
