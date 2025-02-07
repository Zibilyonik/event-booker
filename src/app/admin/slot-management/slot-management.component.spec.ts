import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotManagementComponent } from './slot-management.component';

describe('SlotManagementComponent', () => {
  let component: SlotManagementComponent;
  let fixture: ComponentFixture<SlotManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SlotManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
