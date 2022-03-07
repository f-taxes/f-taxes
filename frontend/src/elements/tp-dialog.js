/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import './tp-icon.js';
import { LitElement, html, css } from 'lit';
import { EventHelpers } from '../helpers/event-helpers.js';
import { closest } from '../helpers/closest.js';
import icons from '../icons';

class TpDialog extends EventHelpers(LitElement) {
  static get styles() {
    return [
      css`
        :host {
          display: flex;
          justify-content: center;
          align-items: center;
          position: fixed;
          inset: 0px;
          pointer-events: none;
          overflow: auto;
        }

        :host([open]) {
          pointer-events: all;
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
          right: 4px;
          top: 5px;
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
            <tp-icon .icon=${icons.close} dialog-dismiss></tp-icon>
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

  connectedCallback() {
    super.connectedCallback();
    this.listen(this, 'click', '_onDialogClick');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unlisten(this, 'click', '_onDialogClick');
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

  _onDialogClick(event) {
    var rootTarget = event.composedPath()[0];
    var target = closest(rootTarget, '[dialog-dismiss]', true) || closest(rootTarget, '[dialog-confirm]', true);
    while (target && target !== this) {
      if (target.hasAttribute) {
        if (target.hasAttribute('dialog-dismiss')) {
          var reason = target.getAttribute('dialog-dismiss');
          this.dispatchEvent(new CustomEvent('dismissed', { detail: reason.length > 0 ? reason : true, bubbles: true, composed: true }));
          this.close();
          event.stopPropagation();
          break;
        } else if (target.hasAttribute('dialog-confirm')) {
          var reason = target.getAttribute('dialog-confirm');
          this.dispatchEvent(new CustomEvent('confirmed', { detail: reason.length > 0 ? reason : true, bubbles: true, composed: true }));
          this.close();
          event.stopPropagation();
          break;
        }
      }
      target = target.parentNode;
    }
  }
}

window.customElements.define('tp-dialog', TpDialog);