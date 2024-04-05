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

class TradeEditor extends fetchMixin(LitElement) {
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
    const tx = this.tx || {}

    return html`
      <tp-form @submit=${this.save}>
        <form>
          <div class="grid">
            <input type="hidden" name="_id" .value=${tx._id || ''}>

            <label>*Account</label>
            <tp-input name="account" .value=${tx.account} required errorMessage="required">
              <input type="text">
            </tp-input>

            <label>TxID</label>
            <tp-input name="txId" .value=${tx.txId}>
              <input type="text">
            </tp-input>
  
            <label>*Timestamp</label>
            <tp-input name="ts" .value=${typeof tx.ts == 'string' ? tx.ts : tx.ts?.toISOString() || new Date().toISOString()} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>Ticker</label>
            <tp-input name="ticker" .value=${tx.ticker}>
              <input type="text">
            </tp-input>
  
            <label>*Quote</label>
            <tp-input name="quote" .value=${tx.quote} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>*Asset</label>
            <tp-input name="asset" .value=${tx.asset} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>*Price</label>
            <tp-input name="price" .value=${tx.price} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>Price Converted</label>
            <tp-input name="priceC" .value=${tx.priceC}>
              <input type="text">
            </tp-input>
  
            <label>*Amount</label>
            <tp-input name="amount" .value=${tx.amount} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>*Fee</label>
            <tp-input name="fee" .value=${tx.fee} required errorMessage="required">
              <input type="text">
            </tp-input>

            <label>*Fee Price Converted</label>
            <tp-input name="feePriceC" .value=${tx.feePriceC} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>*Fee Currency</label>
            <tp-input name="feeCurrency" .value=${tx.feeCurrency} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>Fee Rate</label>
            <tp-input name="feeRate" .value=${tx.feeRate}>
              <input type="text">
            </tp-input>
  
            <label>*Action</label>
            <tp-dropdown name="action" .value=${tx.action} .items=${[{ value: 0, label: 'Buy' }, { value: 1, label: 'Sell' }]} .default=${0} required></tp-dropdown>
  
            <label>*Order Type</label>
            <tp-dropdown name="orderType" .value=${tx.orderType} .items=${[{ value: 0, label: 'Taker' }, { value: 1, label: 'Maker' }]} .default=${0} required></tp-dropdown>
  
            <label>Order ID</label>
            <tp-input name="orderId" .value=${tx.orderId}>
              <input type="text">
            </tp-input>
  
            <label>*Asset Type</label>
            <tp-dropdown name="assetType" .value=${tx.assetType} .items=${[{ value: 0, label: 'Spot' }, { value: 1, label: 'Futures' }]} .default=${0} required></tp-dropdown>
  
            <label>Comment</label>
            <tp-input name="comment" .value=${tx.comment}>
              <input type="text">
            </tp-input>
          </div>

          <div class="buttons-justified">
            <tp-button dialog-dismiss @click=${this.reset}>Cancel</tp-button>
            <tp-button submit>${tx._id ? 'Save' : 'Create'}</tp-button>
            <tp-button submit close>${tx._id ? 'Save & Close' : 'Create & Close'}</tp-button>
          </div>
        </form>
      </tp-form>
    `;
  }

  static get properties() {
    return {
      tx: { type: Object },
    };
  }

  reset() {
    this.shadowRoot.querySelector('tp-form').reset();
  }

  async save(e) {
    const btn = e.target.submitButton;
    btn.showSpinner();

    const resp = await this.post('/trades/manually/save', e.detail);

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

window.customElements.define('trade-editor', TradeEditor);