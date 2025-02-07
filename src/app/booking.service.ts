import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface BookedSlot {
  date: string;
  time: string;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly bookedSlotsKey = 'bookedSlots';
  private bookedSlotsSubject = new BehaviorSubject<BookedSlot[]>([]);

  private initialSlots: BookedSlot[] = [
    { date: new Date('2025-02-07').toISOString(), time: '10:00', category: 'First' },
    { date: new Date('2025-02-07').toISOString(), time: '14:00', category: 'Second' },
    { date: new Date('2025-02-08').toISOString(), time: '15:00', category: 'Third' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    let initialData: BookedSlot[] = [];

    if (isPlatformBrowser(this.platformId)) {
      const savedSlots = localStorage.getItem(this.bookedSlotsKey);
      initialData = savedSlots ? JSON.parse(savedSlots) : this.initialSlots;

      if (!savedSlots) {
        localStorage.setItem(this.bookedSlotsKey, JSON.stringify(this.initialSlots));
      }
    }

    this.bookedSlotsSubject = new BehaviorSubject<BookedSlot[]>(initialData);
  }

  getBookedSlots(): Observable<BookedSlot[]> {
    console.log('getBookedSlots', this.bookedSlotsSubject.asObservable());
    return this.bookedSlotsSubject.asObservable();
  }


  saveBookedSlots(slots: BookedSlot[]): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.bookedSlotsKey, JSON.stringify(slots));
      this.bookedSlotsSubject.next(slots);
    }
  }
}