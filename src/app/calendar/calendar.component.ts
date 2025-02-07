import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BookedSlot, BookingService } from '../booking.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil, take, map } from 'rxjs/operators';
import { OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import {
  trigger,
  style,
  animate,
  transition,
  AnimationEvent
} from '@angular/animations';


interface Timeslot {
  date: string;
  time: string;
  category: string;
  isBooked: boolean;
  currentUserBooking: boolean;
}

interface Day {
  date: string;
  timeslots: Timeslot[];
}

// interface Timezone {
//   name: string;
//   offset: number;
// }

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [MatTabsModule,
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  animations: [
    trigger('weekAnimation', [
      transition('* => slideLeft', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition('* => slideRight', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class CalendarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  bookedSlots: BookedSlot[] = [];
  currentUserBooking: boolean = false;

  constructor(
    private authService: AuthService,
    private bookingService: BookingService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.generateWeek();
  }

  ngOnInit() {
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
        }
      });

    this.bookingService.getBookedSlots()
      .pipe(takeUntil(this.destroy$))
      .subscribe(slots => {
        this.bookedSlots = slots;
        this.generateWeek();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  tabIndex: number = 0;
  tabTitles: string[] = ['First', 'Second', 'Third'];
  selectedDate: Date | null = null;
  selectedTime: string | null = null;
  weekDays: Day[] = [];
  currentWeekStart: Date = new Date();

  // timezones: Timezone[] = [
  //   { name: 'UTC', offset: 0 },
  //   { name: 'EST', offset: -5 },
  //   { name: 'CET', offset: 1 },
  // ];
  // selectedTimezone: Timezone = this.timezones[0];

  generateWeek(): void {
    const startOfWeek = this.getStartOfWeek(this.currentWeekStart);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      this.generateTimeslots(date).subscribe((timeslots: any) => {
        this.weekDays[i] = {
          date: date.toISOString(),
          timeslots
        };
        this.cdr.markForCheck();
      });
    }
  }


  getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return start;
  }
  generateTimeslots(currentDate: Date): Observable<Timeslot[]> {
    return this.authService.getCurrentUser().pipe(
      take(1),
      map(currentUser => {
        const timeslots: Timeslot[] = [];

        for (let i = 0; i <= 23; i++) {
          const date = currentDate.toISOString();
          const time = `${i}:00`;
          const category = this.tabTitles[this.tabIndex];

          const bookedSlot = this.bookedSlots.find(slot => {
            const slotDate = new Date(slot.date);
            return slotDate.toDateString() === currentDate.toDateString() &&
              slot.time === time &&
              slot.category === category;
          });

          const isBooked = !!bookedSlot;
          const currentUserBooking = isBooked && bookedSlot?.userEmail === currentUser?.email;

          timeslots.push({
            date,
            time,
            category,
            isBooked,
            currentUserBooking
          });
        }

        return timeslots;
      })
    );
  }

  selectTimeslot(date: string, time: string): void {
    const bookedSlot = this.bookedSlots.find(slot => {
      const slotDate = new Date(slot.date);
      const compareDate = new Date(date);
      return slotDate.toDateString() === compareDate.toDateString() &&
        slot.time === time &&
        slot.category === this.tabTitles[this.tabIndex];
    });

    if (bookedSlot) {
      this.authService.getCurrentUser().pipe(take(1)).subscribe(user => {
        if (user && bookedSlot.userEmail === user.email) {
          this.currentUserBooking = true;
          this.selectedDate = new Date(date);
          this.selectedTime = time;
          this.cdr.markForCheck();
        } else {
          alert('This slot is already taken.');
        }
      });
      return;
    }

    this.currentUserBooking = false;
    this.selectedDate = new Date(date);
    this.selectedTime = time;
    this.cdr.markForCheck();
  }

  bookSelectedSlot(): void {
    if (!this.selectedDate || !this.selectedTime) {
      return;
    }
    this.authService.getCurrentUser().pipe(take(1)).subscribe(user => {
      const email = user?.email || '';

      const newBooking: BookedSlot = {
        date: this.selectedDate!.toISOString(),
        time: this.selectedTime!,
        category: this.tabTitles[this.tabIndex],
        userEmail: email
      };

      const updatedSlots: BookedSlot[] = [...this.bookedSlots, newBooking];
      this.bookingService.saveBookedSlots(updatedSlots);

      this.generateWeek();
      this.selectedDate = null;
      this.selectedTime = null;
      this.cdr.markForCheck();
    });
  }


  isSlotTaken(date: string, time: string): boolean {
    return this.bookedSlots.some(slot => {
      const slotDate = new Date(slot.date);
      const compareDate = new Date(date);
      return slotDate.toDateString() === compareDate.toDateString() &&
        slot.time === time &&
        slot.category === this.tabTitles[this.tabIndex];
    });
  }

  unBookTimeslot(date: Date, time: string, category: string): void {
    // Use the date string directly without creating a new Date object
    this.bookingService.cancelBooking(date.toISOString(), time, category)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.currentUserBooking = false;
          this.selectedDate = null;
          this.selectedTime = null;
          this.generateWeek();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
        }
      });
  }

  isSelected(date: string, time: string): boolean {
    const convertedDate = new Date(date);
    return this.selectedDate?.getTime() === convertedDate.getTime() && this.selectedTime === time;
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.tabIndex = event.index;
    this.selectedDate = null;
    this.selectedTime = null;
    this.generateWeek(); // Add this line to refresh the view
    this.cdr.markForCheck();
  }
  // onTimezoneChange(timezone: Timezone): void {
  //   this.selectedTimezone = timezone;
  //   this.generateWeek();
  // }

  transitionDirection: 'slideLeft' | 'slideRight' | '' = '';

  previousWeek(): void {
    this.transitionDirection = 'slideRight';
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateWeek();
  }

  nextWeek(): void {
    this.transitionDirection = 'slideLeft';
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateWeek();
  }

  animationDone(_event: AnimationEvent) {
    this.transitionDirection = '';
  }
}