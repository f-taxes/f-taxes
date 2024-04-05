/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-button/tp-button.js';
import { LitElement, html, css } from 'lit';

class The404 extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        div {
          text-align: center;
        }
      `
    ];
  }

  render() {
    const { } = this;

    return html`
      <div>
        <h2>
          Sorry, we couldn't find the requested page.
        </h2>
  
        <tp-button @click=${this.landingPage}>Back To The Start</tp-button>
      </div>
    `;
  }

  landingPage() {
    this.dispatchEvent(new CustomEvent('trigger-router', { detail: { path: '/' }, bubbles: true, composed: true }));
  }
}

window.customElements.define('the-404', The404);