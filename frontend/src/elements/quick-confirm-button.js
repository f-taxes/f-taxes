/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-button/tp-button.js';
import '@tp/tp-popup/tp-popup.js';
import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import shared from '../styles/shared';

class QuickConfirmButton extends LitElement {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: block;
        }

        div[slot="content"] {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          background: var(--bg1);
          padding: 10px;
          border-radius: 4px;
        }

        div[slot="content"] tp-button + tp-button {
          margin-left: 10px;
        }
      `
    ];
  }

  render() {
    const { label, danger, extended, confirmLabel, cancelLabel } = this;

    return html`
      <tp-popup valign="top">
        <tp-button slot="toggle" class=${classMap({danger})} ?extended=${extended}>${label}</tp-button>
        <div slot="content">
          ${cancelLabel ? html`<tp-button close-popup>${cancelLabel}</tp-button>` : null}
          <tp-button class=${classMap({danger})} @click=${() => this.dispatchEvent(new CustomEvent('confirm', { detail: null, bubbles: true, composed: true }))} close-popup>${confirmLabel}</tp-button>
        </div>
      </tp-popup>
    `;
  }

  get button() {
    return this.shadowRoot.querySelector('tp-button');
  }

  static get properties() {
    return {
      danger: { type: Boolean },
      extended: { type: Boolean },
      label: { type: String },
      confirmLabel: { type: String },
      cancelLabel: { type: String },
    };
  }
}

window.customElements.define('quick-confirm-button', QuickConfirmButton);