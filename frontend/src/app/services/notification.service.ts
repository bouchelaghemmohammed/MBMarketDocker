import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _chatCount = new BehaviorSubject<number>(0);
  chatCount$ = this._chatCount.asObservable();

  increment() {
    this._chatCount.next(this._chatCount.value + 1);
  }

  clearChat() {
    this._chatCount.next(0);
  }
}
