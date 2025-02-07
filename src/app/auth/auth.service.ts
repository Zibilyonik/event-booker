import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { User } from './user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_KEY = 'users';
  private readonly CURRENT_USER_KEY = 'currentUser';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private users: User[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router) {
    if (isPlatformBrowser(this.platformId)) {
      const savedUsers = localStorage.getItem(this.USERS_KEY);
      if (savedUsers) {
        this.users = JSON.parse(savedUsers);
      }

      const savedUser = localStorage.getItem(this.CURRENT_USER_KEY);
      if (savedUser) {
        this.currentUserSubject.next(JSON.parse(savedUser));
      }
    }
  }

  signup(email: string): Observable<User> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Cannot access localStorage on server'));
    }

    const existingUser = this.users.find(u => u.email === email);
    if (existingUser) {
      return throwError(() => new Error('Email already registered'));
    }

    const newUser: User = {
      email,
      isAdmin: email.includes('admin')
    };

    this.users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(this.users));

    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(newUser));
    this.currentUserSubject.next(newUser);

    return this.currentUserSubject.asObservable() as Observable<User>;
  }

  login(email: string): Observable<User | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Cannot access localStorage on server'));
    }

    const user = this.users.find(u => u.email === email);
    if (!user) {
      return throwError(() => new Error('User not found'));
    }

    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    return this.currentUserSubject.asObservable()!;
  }
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.isAdmin || false;
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }
}