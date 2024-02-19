import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FilterTopTableComponent} from './filter-top-table.component';

describe('FilterTopTableComponent', () => {
  let component: FilterTopTableComponent;
  let fixture: ComponentFixture<FilterTopTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FilterTopTableComponent],
    });
    fixture = TestBed.createComponent(FilterTopTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
