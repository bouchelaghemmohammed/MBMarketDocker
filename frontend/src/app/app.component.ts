import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SocketService } from './services/socket.service';
import { UiService, ToastMessage } from './services/ui.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'BMMarket';
  notificationMessage = '';
  
  // Custom UI State
  toastMessage: ToastMessage | null = null;
  confirmData: { message: string, resolve: (val: boolean) => void } | null = null;
  
  private notificationSub!: Subscription;
  private toastSub!: Subscription;
  private confirmSub!: Subscription;

  constructor(private socketService: SocketService, private uiService: UiService) {}

  ngOnInit() {
    this.notificationSub = this.socketService.listen('notification:new').subscribe((data: any) => {
      this.notificationMessage = data.message;
      setTimeout(() => this.notificationMessage = '', 5000);
    });

    this.toastSub = this.uiService.toast$.subscribe(toast => {
      this.toastMessage = toast;
      setTimeout(() => this.toastMessage = null, 4000);
    });

    this.confirmSub = this.uiService.confirm$.subscribe(confirmData => {
      this.confirmData = confirmData;
    });
  }

  onConfirm(result: boolean) {
    if (this.confirmData) {
      this.confirmData.resolve(result);
      this.confirmData = null;
    }
  }

  ngOnDestroy() {
    if (this.notificationSub) this.notificationSub.unsubscribe();
    if (this.toastSub) this.toastSub.unsubscribe();
    if (this.confirmSub) this.confirmSub.unsubscribe();
  }
}
