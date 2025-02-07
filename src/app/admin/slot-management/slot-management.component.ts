import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BookingService } from '../../booking.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-slot-management',
  templateUrl: './slot-management.component.html',
  styleUrls: ['./slot-management.component.scss']
})
export class SlotManagementComponent implements OnInit {
  slotForm: FormGroup;
  categories = ['First', 'Second', 'Third'];
  timeSlots: string[] = [];

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private snackBar: MatSnackBar
  ) {
    this.slotForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      category: ['', Validators.required]
    });

    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      this.timeSlots.push(`${hour}:00`);
    }
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.slotForm.valid) {
      const newSlot = {
        date: this.slotForm.value.date.toISOString(),
        time: this.slotForm.value.time,
        category: this.slotForm.value.category,
        userEmail: ''
      };

      this.bookingService.addAvailableSlot(newSlot).subscribe({
        next: () => {
          this.snackBar.open('Slot added successfully', 'Close', {
            duration: 3000
          });
          this.slotForm.reset();
        },
        error: (error) => {
          this.snackBar.open('Failed to add slot', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }
}