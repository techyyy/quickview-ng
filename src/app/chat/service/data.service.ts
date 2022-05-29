import {Subject} from 'rxjs';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {Message} from '../types/message';
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';

export class DataService {

  private socket: WebSocketSubject<any>;

  private messagesSubject = new Subject<Message>();
  public messages = this.messagesSubject.asObservable();

  public connect(roomId: string, router: Router): void {

    if (!this.socket || this.socket.closed) {
      this.socket = this.getNewWebSocket(roomId, router);
      this.socket.subscribe(
        msg => {
          console.log('Received message of type: ' + msg.type);
          this.messagesSubject.next(msg);
        },
        err => {
          console.error(err);
          router.navigate(['/unexpected']);
        }
      );
    }
  }

  sendMessage(msg: Message): void {
    console.log('Sending message: ' + msg.type);
    this.socket.next(msg);
  }

  private getNewWebSocket(roomId: string, router: Router): WebSocketSubject<any> {
    return webSocket({
      url: environment.wsUrl + roomId,
      openObserver: {
        next: () => {
          console.log('[DataService]: connection opened');
        },
      },
      closeObserver: {
        next: () => {
          console.log('[DataService]: connection closed');
          this.socket = undefined;
        }
      }
    });
  }
}
