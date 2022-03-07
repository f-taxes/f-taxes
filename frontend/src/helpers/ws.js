import { dial } from 'neffos.js';

export default class WS {
  constructor(uri) {
    this.socket = null;
    this.uri = uri;
    this.isConnected = false;
    this.subs = [];
    this.onConnectListeners = [];
    this.onDisconnectListeners = [];
    this._pingJob = null;
  }

  async connect() {
    try {
      const scheme = document.location.protocol == 'https:' ? 'wss' : 'ws';
      const port = document.location.port ? ':' + document.location.port : '';
      const wsURL = scheme + '://' + document.location.hostname + port + '/echo';
      const conn = await dial(wsURL, {
        default: { // "default" namespace.
          _OnNamespaceConnected: (nsConn, msg) => {
            this.socket = nsConn;
            console.log("connected to namespace: " + msg.Namespace);
            for (const cb of this.onConnectListeners) {
              cb(msg);
            }
            this._enablePing();
          },
          _OnNamespaceDisconnect: (nsConn, msg) => {
            this.socket = null;
            console.log("disconnected from namespace: " + msg.Namespace);
            for (const cb of this.onDisconnectListeners) {
              cb(msg);
            }
            this._disablePing();
          },
          msg: (nsConn, msg) => {
            const body = msg.unmarshal();
            for (const cb of this.subs) {
              cb(body);
            }
          }
        }
      }, {
        headers: {
          "X-Username": 'User',
        },
        reconnect: 5000
      });

      await conn.connect("default");
    } catch (err) {
      console.error(err);
    }
  }

  _enablePing() {
    if (this._pingJob !== null) return;

    this._pingJob = setInterval(() => {
      this.socket.emit('ping');
    }, 10000);
  }

  _disablePing() {
    clearInterval(this._pingJob);
    this._pingJob = null;
  }

  onConnect(cb) {
    this.onConnectListeners.push(cb);
  }

  offConnect(cb) {
    this.onConnectListeners = this.onConnectListeners.filter(scb => scb !== cb);
  }

  onDisconnect(cb) {
    this.onDisconnectListeners.push(cb);
  }

  offDisconnect(cb) {
    this.onDisconnectListeners = this.onDisconnectListeners.filter(scb => scb !== cb);
  }

  async send(msg) {
    this.socket.emit('clientMsg', JSON.stringify(msg));
  }

  onMsg(cb) {
    this.subs.push(cb);
  }

  off(cb) {
    this.subs = this.subs.filter(scb => scb !== cb);
  }
}
