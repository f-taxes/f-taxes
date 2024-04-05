/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import { LitElement, html, css } from 'lit';

class CardBox extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
          border-radius: 10px;
          padding: 25px;
          background-color: var(--card-box-background);
        }
      `
    ];
  }

  render() {
    return html`
      <slot></slot>
    `;
  }
}

window.customElements.define('card-box', CardBox);