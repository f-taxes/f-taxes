/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import './tp-icon.js';
import { LitElement, html, css } from 'lit';
import icons from '../icons';

class TpDialog extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
        }

        dialog {
          position: relative;
          border-radius: var(--tp-dialog-border-radius);
          background-color: var(--tp-dialog-bg);
          color: var(--text);
          border: var(--tp-dialog-border);
          padding: var(--tp-dialog-padding);
        }

        .close-icon {
          position: absolute;
          right: 6px;
          top: 8px;
          --tp-icon-width: 18px;
          --tp-icon-height: 18px;
        }
      `
    ];
  }

  render() {
    const { showClose } = this;
    return html`
      <dialog>
        ${showClose ? html`
          <div class="close-icon">
            <tp-icon .icon=${icons.close} @click=${() => this.close()}></tp-icon>
          </div>
        ` : null}
        <slot></slot>
      </dialog>
    `;
  }

  static get properties() {
    return {
      open: { type: Boolean, reflect: true },
      showClose: { type: Boolean },
    };
  }

  get dialog() {
    return this.shadowRoot.querySelector('dialog');
  }

  show() {
    this.dialog.show();
    this.open = true;
  }

  showModal() {
    this.dialog.showModal();
    this.open = true;
  }

  close() {
    this.dialog.close();
    this.open = false;
  }
}

window.customElements.define('tp-dialog', TpDialog);