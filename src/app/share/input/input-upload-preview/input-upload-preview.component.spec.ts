import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputUploadPreviewComponent } from './input-upload-preview.component';

describe('InputUploadPreviewComponent', () => {
  let component: InputUploadPreviewComponent;
  let fixture: ComponentFixture<InputUploadPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputUploadPreviewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InputUploadPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
