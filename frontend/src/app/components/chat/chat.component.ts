import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  contacts: any[] = [];
  selectedContact: any = null;
  messages: any[] = [];
  newMessage: string = '';
  currentUser: any = null;
  
  private chatSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private authService: AuthService,
    private socketService: SocketService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Clear message notification badge when chat page opens
    this.notificationService.clearChat();
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (this.currentUser) {
        this.loadContacts();
        
        // Listen to incoming real-time messages specifically for this user
        this.chatSub = this.socketService.listen(`chat:message:${this.currentUser._id}`).subscribe(message => {
          // If the message belongs to the currently open chat, append it
          if (this.selectedContact && 
             (message.senderId._id === this.selectedContact._id || 
              message.receiverId === this.selectedContact._id)) {
            
            // Check if it already exists (since sender might receive their own broadcast)
            const exists = this.messages.find(m => m._id === message._id);
            if (!exists) {
              this.messages.push(message);
              this.scrollToBottom();
            }
          }
        });
      }
    });
  }

  loadContacts() {
    this.apiService.getContacts().subscribe({
      next: (data) => {
        this.contacts = data;
        
        // Check for query param to auto-select a user
        this.route.queryParams.subscribe(params => {
          if (params['user']) {
            const userId = params['user'];
            let existingContact = this.contacts.find(c => c._id === userId);
            
            if (existingContact) {
              this.selectContact(existingContact);
            } else {
              // Not in contacts yet, fetch user details and add to list
              this.apiService.getUser(userId).subscribe({
                next: (newUser) => {
                  this.contacts.unshift(newUser);
                  this.selectContact(newUser);
                },
                error: (err) => console.error('Failed to load user', err)
              });
            }
          }
        });
      },
      error: (err) => console.error('Failed to load contacts', err)
    });
  }

  selectContact(contact: any) {
    this.selectedContact = contact;
    this.apiService.getMessages(contact._id).subscribe({
      next: (data) => {
        this.messages = data;
        this.scrollToBottom();
      },
      error: (err) => console.error('Failed to load messages', err)
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedContact) return;

    this.apiService.sendMessage(this.selectedContact._id, this.newMessage.trim()).subscribe({
      next: (msg) => {
        // We will also receive it via socket, but we can append instantly here for better UX 
        // or just rely on the socket echo. Relying on socket echo ensures order.
        this.newMessage = '';
      },
      error: (err) => console.error('Failed to send message', err)
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chat-messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.chatSub) this.chatSub.unsubscribe();
  }
}
