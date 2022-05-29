export const environment = {
  production: true,
  wsEndpoint: 'ws://localhost:8071/chat/',
  RTCPeerConfiguration: {
    iceServers: [
      {
        urls: 'turn:turnserver:3478',
        username: 'user',
        credential: 'password'
      }
    ]
  }
};
