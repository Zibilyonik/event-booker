import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import {
  trigger,
  style,
  animate,
  transition,
  AnimationEvent
} from '@angular/animations';
import { BookingService } from '../booking.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OnInit, OnDestroy } from '@angular/core';

interface Timeslot {
  time: string;
  category: string;
  isBooked?: boolean;
  userId?: string;
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

  constructor(
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef
  ) {
    this.generateWeek();
  }

  ngOnInit() {
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
  bookedSlots: { date: string; time: string; category: string }[] = [];

  // timezones: Timezone[] = [
  //   { name: 'UTC', offset: 0 },
  //   { name: 'EST', offset: -5 },
  //   { name: 'CET', offset: 1 },
  // ];
  // selectedTimezone: Timezone = this.timezones[0];

  generateWeek(): void {
    this.weekDays = [];
    const startOfWeek = this.getStartOfWeek(this.currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      this.weekDays.push({
        date: date.toISOString(),
        timeslots: this.generateTimeslots(date)
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

  generateTimeslots(currentDate: Date): Timeslot[] {
    const timeslots: Timeslot[] = [];

    for (let i = 0; i <= 23; i++) {
      const time = `${i}:00`;
      const category = this.tabTitles[this.tabIndex];
      const isBooked = this.bookedSlots.some(slot => {
        const slotDate = new Date(slot.date);
        return slotDate.toDateString() === currentDate.toDateString() &&
          slot.time === time &&
          slot.category === category;
      });

      timeslots.push({
        time,
        category,
        isBooked,
        userId: ''
      });
    }
    return timeslots;
  }

  selectTimeslot(date: string, time: string): void {
    const isBooked = this.isSlotTaken(date, time);
    if (isBooked) {
      alert('This slot is already taken.');
      return;
    }

    this.selectedDate = new Date(date);
    this.selectedTime = time;
    this.cdr.markForCheck();
  }

  bookSelectedSlot(): void {
    if (!this.selectedDate || !this.selectedTime) {
      return;
    }

    const newBooking = {
      date: this.selectedDate.toISOString(), // Store as ISO string
      time: this.selectedTime,
      category: this.tabTitles[this.tabIndex]
    };

    const updatedSlots = [...this.bookedSlots, newBooking];
    this.bookingService.saveBookedSlots(updatedSlots);

    this.generateWeek();
    this.selectedDate = null;
    this.selectedTime = null;
    this.cdr.markForCheck();
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
    const compareDate = date.toISOString();
    this.bookedSlots = this.bookedSlots.filter(
      s => !(s.date === compareDate && s.time === time && s.category === category)
    );
    this.bookingService.saveBookedSlots(this.bookedSlots);
  }

  isSelected(date: string, time: string): boolean {
    const convertedDate = new Date(date);
    return this.selectedDate?.getTime() === convertedDate.getTime() && this.selectedTime === time;
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.tabIndex = event.index;
    this.selectedDate = null;
    this.selectedTime = null;
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