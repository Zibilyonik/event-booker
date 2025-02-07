import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AuthService } from './auth/auth.service';

export interface BookedSlot {
  date: string;
  time: string;
  category: string;
  userEmail: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly bookedSlotsKey = 'bookedSlots';
  private bookedSlotsSubject = new BehaviorSubject<BookedSlot[]>([]);

  private initialSlots: BookedSlot[] = [
    {
      date: new Date(2025, 1, 7).toISOString(), // February 7, 2025
      time: '10:00',
      category: 'First',
      userEmail: 'johndoe@example.com'
    },
    {
      date: new Date(2025, 1, 7).toISOString(), // February 7, 2025
      time: '14:00',
      category: 'Second',
      userEmail: 'johndoe2@example.com'
    },
    {
      date: new Date(2025, 1, 8).toISOString(), // February 8, 2025
      time: '15:00',
      category: 'Third',
      userEmail: 'johndoe3@example.com'
    }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService
  ) {
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
    return this.bookedSlotsSubject.asObservable();
  }

  saveBookedSlots(slots: BookedSlot[]): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.bookedSlotsKey, JSON.stringify(slots));
    }
    this.bookedSlotsSubject.next(slots);
  }

  addAvailableSlot(slot: BookedSlot): Observable<void> {
    const currentSlots = this.bookedSlotsSubject.value;
    const updatedSlots = [...currentSlots, slot];
    this.saveBookedSlots(updatedSlots);
    return of(void 0);
  }

  bookSlot(date: string, time: string, category: string): void {
    this.authService.getCurrentUser().subscribe(currentUser => {
      if (!currentUser) {
        throw new Error('User must be logged in to book a slot');
      }

      const newBooking: BookedSlot = {
        date,
        time,
        category,
        userEmail: currentUser.email
      };

      const updatedSlots = [...this.bookedSlotsSubject.value, newBooking];
      this.saveBookedSlots(updatedSlots);
    });
  }

  getUserBookings(email: string): BookedSlot[] {
    return this.bookedSlotsSubject.value.filter(slot => slot.userEmail === email);
  }

  cancelBooking(date: string, time: string, category: string): Observable<void> {
    return new Observable<void>(observer => {
      this.authService.getCurrentUser().subscribe({
        next: (currentUser) => {
          if (!currentUser) {
            observer.error(new Error('User must be logged in to cancel a booking'));
            return;
          }

          // Helper function to strip time from date
          const stripTime = (dateStr: string) => {
            const date = new Date(dateStr);
            return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
          };

          const updatedSlots = this.bookedSlotsSubject.value.filter(slot => {
            const slotDateOnly = stripTime(slot.date);
            const cancelDateOnly = stripTime(date);

            return !(
              slotDateOnly === cancelDateOnly &&
              slot.time === time &&
              slot.category === category &&
              slot.userEmail === currentUser.email
            );
          });

          this.saveBookedSlots(updatedSlots);
          observer.next();
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }
}