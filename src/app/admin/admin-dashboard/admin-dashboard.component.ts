import { Component, OnInit } from '@angular/core';
import { BookingService, BookedSlot } from '../../booking.service';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="admin-container">
      <h2>Admin Dashboard</h2>
      
      <app-slot-management></app-slot-management>

      <h3>All Bookings</h3>
      <table mat-table [dataSource]="bookedSlots">
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef> Date </th>
          <td mat-cell *matCellDef="let slot"> {{slot.date | date}} </td>
        </ng-container>

        <ng-container matColumnDef="time">
          <th mat-header-cell *matHeaderCellDef> Time </th>
          <td mat-cell *matCellDef="let slot"> {{slot.time}} </td>
        </ng-container>

        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef> Category </th>
          <td mat-cell *matCellDef="let slot"> {{slot.category}} </td>
        </ng-container>

        <ng-container matColumnDef="userEmail">
          <th mat-header-cell *matHeaderCellDef> Booked By </th>
          <td mat-cell *matCellDef="let slot"> {{slot.userEmail || 'Available'}} </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    table {
      width: 100%;
      margin-top: 20px;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  bookedSlots: BookedSlot[] = [];
  displayedColumns: string[] = ['date', 'time', 'category', 'userEmail'];

  constructor(private bookingService: BookingService) { }

  ngOnInit() {
    this.bookingService.getBookedSlots().subscribe(slots => {
      this.bookedSlots = slots;
    });
  }
}