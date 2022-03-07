export const WsListener = function(superClass) {
  return class extends superClass {
    static get properties() {
      return {
        ws: { type: Object },
      };
    }

    constructor() {
      super();
      this.boundWsCb = this.onMsg.bind(this);
    }

    shouldUpdate(changes) {
      super.shouldUpdate(changes);
      if (changes.has('ws') && this.ws) {
        this.ws.onMsg(this.boundWsCb);
      }

      return this.ws;
    }

    onMsg(msg) {
      console.log(msg);
    }
  };
};
