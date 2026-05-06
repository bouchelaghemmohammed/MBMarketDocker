import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private toastSubject = new Subject<ToastMessage>();
  public toast$ = this.toastSubject.asObservable();
  
  private confirmSubject = new Subject<{message: string, resolve: (value: boolean) => void}>();
  public confirm$ = this.confirmSubject.asObservable();

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastSubject.next({ message, type });
  }

  confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmSubject.next({ message, resolve });
    });
  }
}
