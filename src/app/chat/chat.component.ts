import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {environment} from '../../environments/environment';
import {DataService} from './service/data.service';
import {Message} from './types/message';
import {ActivatedRoute} from '@angular/router';
import {Router} from "@angular/router";

export const ENV_RTCPeerConfiguration = environment.RTCPeerConfiguration;

const mediaConstraints = {
  audio: true,
  video: {width: 720, height: 480}
};

const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  providers: [DataService]
})
export class ChatComponent implements OnInit, AfterViewInit {

  public currentUrl='';

  @ViewChild('local_video') localVideo: ElementRef;
  @ViewChild('received_video') remoteVideo: ElementRef;

  private peerConnection: RTCPeerConnection;

  private localStream: MediaStream;

  private id: string;

  inCall = false;
  localVideoActive = false;
  cameraOn = false;

  constructor(private dataService: DataService,
              private router: Router,
              private activatedRoute: ActivatedRoute) {
    this.currentUrl = window.location.href;
  }

  async call(): Promise<void> {
    this.createPeerConnection();
    this.localStream.getTracks().forEach(
      track => this.peerConnection.addTrack(track, this.localStream)
    );

    try {
      const offer: RTCSessionDescriptionInit = await this.peerConnection.createOffer(offerOptions);
      await this.peerConnection.setLocalDescription(offer);

      this.inCall = true;

      this.dataService.sendMessage({type: 'offer', data: offer});
    } catch (err) {
      this.handleGetUserMediaError(err);
    }
  }

  hangUp(): void {
    this.dataService.sendMessage({type: 'hangup', data: ''});
    this.closeVideoCall();
  }

  ngOnInit(): void {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
  }

  ngAfterViewInit(): void {
    this.addIncomingMessageHandler();
    this.requestMediaDevices();
  }

  private addIncomingMessageHandler(): void {

    this.dataService.connect(this.id, this.router);
    this.dataService.messages.subscribe(
      msg => {
        switch (msg.type) {
          case 'offer':
            this.handleOfferMessage(msg.data);
            break;
          case 'answer':
            this.handleAnswerMessage(msg.data);
            break;
          case 'hangup':
            this.handleHangupMessage(msg);
            break;
          case 'ice-candidate':
            this.handleICECandidateMessage(msg.data);
            break;
          default:
            console.log('Unknown message of type ' + msg.type);
        }
      }
    );
  }

  private handleOfferMessage(msg: RTCSessionDescriptionInit): void {
    console.log('Handling incoming offer.');
    if (!this.peerConnection) {
      this.createPeerConnection();
    }
    if (!this.localStream) {
      this.startLocalVideo();
    }
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg))
      .then(() => {
        this.localVideo.nativeElement.srcObject = this.localStream;
        this.localStream.getTracks().forEach(
          track => this.peerConnection.addTrack(track, this.localStream)
        );
      }).then(() => {
      return this.peerConnection.createAnswer();

    }).then((answer) => {
      return this.peerConnection.setLocalDescription(answer);
    }).then(() => {
      this.dataService.sendMessage({type: 'answer', data: this.peerConnection.localDescription});
      this.inCall = true;
    }).catch(this.handleGetUserMediaError);
  }

  private handleAnswerMessage(msg: RTCSessionDescriptionInit): void {
    console.log('handle incoming answer');
    this.peerConnection.setRemoteDescription(msg);
  }

  private handleHangupMessage(msg: Message): void {
    console.log(msg);
    this.closeVideoCall();
  }

  private handleICECandidateMessage(msg: RTCIceCandidate): void {
    const candidate = new RTCIceCandidate(msg);
    this.peerConnection.addIceCandidate(candidate).catch(this.reportError);
  }

  private async requestMediaDevices(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      this.pauseLocalVideo();
    } catch (e) {
      console.error(e);
      alert(`getUserMedia() error: ${e.name}`);
    }
  }

  startLocalVideo(): void {
    console.log('Starting local stream');
    this.localStream.getTracks().forEach(track => {
      track.enabled = true;
    });
    this.localVideo.nativeElement.srcObject = this.localStream;

    this.localVideoActive = true;
  }

  pauseLocalVideo(): void {
    console.log('Pausing local stream');
    this.localStream.getTracks().forEach(track => {
      track.enabled = false;
    });
    this.localVideo.nativeElement.srcObject = undefined;
    this.localVideoActive = false;
  }

  private createPeerConnection(): void {
    console.log('Creating PeerConnection...');
    this.peerConnection = new RTCPeerConnection(ENV_RTCPeerConfiguration);
    this.peerConnection.onicecandidate = this.handleICECandidateEvent;
    this.peerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    this.peerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    this.peerConnection.ontrack = this.handleTrackEvent;
  }

  private closeVideoCall(): void {
    console.log('Closing call');
    if (this.peerConnection) {
      console.log('--> Closing the peer connection');
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.onsignalingstatechange = null;
      this.peerConnection.getTransceivers().forEach(transceiver => {
        transceiver.stop();
      });
      this.peerConnection.close();
      this.peerConnection = null;
      this.inCall = false;
    }
  }

  /* ########################  ERROR HANDLER  ################################## */
  private handleGetUserMediaError(e: Error): void {
    switch (e.name) {
      case 'NotFoundError':
        alert('Unable to open your call because no camera and/or microphone were found.');
        break;
      case 'SecurityError':
      case 'PermissionDeniedError':
        break;
      default:
        console.error(e);
        alert('Error opening your camera and/or microphone: ' + e.message);
        break;
    }

    this.closeVideoCall();
  }

  private reportError = (e: Error) => {
    console.log('got Error: ' + e.name);
    console.log(e);
  }
  private handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
    console.log(event);
    if (event.candidate) {
      this.dataService.sendMessage({
        type: 'ice-candidate',
        data: event.candidate
      });
    }
  }

  private handleICEConnectionStateChangeEvent = (event: Event) => {
    console.log(event);
    switch (this.peerConnection.iceConnectionState) {
      case 'closed':
        console.log("Connection closed.");
        break;
      case 'failed':
        console.log("Connection failed.");
        break;
      case 'disconnected':
        this.closeVideoCall();
        break;
    }
  }

  private handleSignalingStateChangeEvent = (event: Event) => {
    console.log(event);
    switch (this.peerConnection.signalingState) {
      case 'closed':
        this.closeVideoCall();
        break;
    }
  }

  private handleTrackEvent = (event: RTCTrackEvent) => {
    console.log(event);
    this.remoteVideo.nativeElement.srcObject = event.streams[0];
  }
}
