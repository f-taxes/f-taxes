/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import { LitElement, html, css } from 'lit';

class TheRoute extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
        }
      `
    ];
  }

  static get properties() {
    return {
      path: { type: String },
      data: { type: String },
      namespace: { type: String },
      redirect: { type: String },
    };
  }

  constructor() {
    super();
    this.path = '*';
    this.namespace = 'default';
  }
}

window.customElements.define('the-route', TheRoute);
