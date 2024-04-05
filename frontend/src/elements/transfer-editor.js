/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-form/tp-form.js';
import '@tp/tp-input/tp-input.js';
import '@tp/tp-date-input/tp-date-input.js';
import '@tp/tp-dropdown/tp-dropdown.js';
import { LitElement, html, css } from 'lit';
import shared from '../styles/shared';
import { fetchMixin } from '@tp/helpers/fetch-mixin.js';

class TransferEditor extends fetchMixin(LitElement) {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: block;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-row-gap: 20px;
          grid-column-gap: 30px;
          align-items: center;
        }

        tp-form tp-input,
        tp-form tp-dropdown {
          margin-bottom: 0;
        }
      `
    ];
  }

  render() {
    const transfer = this.transfer || {}

    return html`
      <tp-form @submit=${this.save}>
        <form>
          <div class="grid">
            <input type="hidden" name="_id" .value=${transfer._id || ''}>

            <label>*Account</label>
            <tp-input name="account" .value=${transfer.account} required errorMessage="required">
              <input type="text">
            </tp-input>

            <label>TxID</label>
            <tp-input name="txId" .value=${transfer.txId}>
              <input type="text">
            </tp-input>
  
            <label>*Timestamp</label>
            <tp-input name="ts" .value=${typeof transfer.ts == 'string' ? transfer.ts : transfer.ts?.toISOString() || new Date().toISOString()} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>*Asset</label>
            <tp-input name="asset" .value=${transfer.asset} required errorMessage="required">
              <input type="text">
            </tp-input>

            <label>*Amount</label>
            <tp-input name="amount" .value=${transfer.amount} required errorMessage="required">
              <input type="text">
            </tp-input>

            <label>*Action</label>
            <tp-dropdown name="action" .value=${transfer.action} .items=${[{ value: 0, label: 'Deposit' }, { value: 1, label: 'Withdrawal' }]} required></tp-dropdown>
  
            <label>Source</label>
            <tp-input name="source" .value=${transfer.source}>
              <input type="text">
            </tp-input>
  
            <label>Destination</label>
            <tp-input name="destination" .value=${transfer.destination}>
              <input type="text">
            </tp-input>
  
            <label>Price Converted</label>
            <tp-input name="priceC" .value=${transfer.priceC}>
              <input type="text">
            </tp-input>
  
            <label>*Fee</label>
            <tp-input name="fee" .value=${transfer.fee} required errorMessage="required">
              <input type="text">
            </tp-input>

            <label>*Fee Price Converted</label>
            <tp-input name="feePriceC" .value=${transfer.feePriceC} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>*Fee Currency</label>
            <tp-input name="feeCurrency" .value=${transfer.feeCurrency} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>Comment</label>
            <tp-input name="comment" .value=${transfer.comment}>
              <input type="text">
            </tp-input>
          </div>

          <div class="buttons-justified">
            <tp-button dialog-dismiss @click=${this.reset}>Cancel</tp-button>
            <tp-button submit>${transfer._id ? 'Save' : 'Create'}</tp-button>
            <tp-button submit close>${transfer._id ? 'Save & Close' : 'Create & Close'}</tp-button>
          </div>
        </form>
      </tp-form>
    `;
  }

  static get properties() {
    return {
      transfer: { type: Object },
    };
  }

  reset() {
    this.shadowRoot.querySelector('tp-form').reset();
  }

  async save(e) {
    const btn = e.target.submitButton;
    btn.showSpinner();

    const resp = await this.post('/transfers/manually/save', e.detail);

    if (resp.result) {
      btn.showSuccess();
      if (btn.hasAttribute('close')) {
        this.dispatchEvent(new CustomEvent('dialog-close', { detail: null, bubbles: true, composed: true }));
      }
    } else {
      btn.showError();
    }
  }
}

window.customElements.define('transfer-editor', TransferEditor);