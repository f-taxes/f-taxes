/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-popup/tp-popup.js';
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

        .baseline {
          align-self: baseline;
        }

        tp-checkbox + tp-checkbox {
          margin-top: 10px;
        }
      `
    ];
  }

  render() {
    const trade = this.tx || {}

    return html`
      <tp-form @submit=${this.save}>
        <form>
          <div class="grid">
            <input type="hidden" name="_id" .value=${trade._id || ''}>

            <label>*Account</label>
            <tp-input name="account" .value=${trade.account} required errorMessage="required">
              <input type="text">
            </tp-input>

            <label>TxID</label>
            <tp-input name="txId" .value=${trade.txId}>
              <input type="text">
            </tp-input>
  
            <label>*Timestamp</label>
            <tp-input name="ts" .value=${typeof trade.ts == 'string' ? trade.ts : trade.ts?.toISOString() || new Date().toISOString()} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>Ticker</label>
            <tp-input name="ticker" .value=${trade.ticker}>
              <input type="text">
            </tp-input>
  
            <label>*Quote</label>
            <tp-input name="quote" .value=${trade.quote} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>*Asset</label>
            <tp-input name="asset" .value=${trade.asset} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>*Price</label>
            <tp-input name="price" .value=${trade.price} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>Price Converted</label>
            <tp-input name="priceC" .value=${trade.priceC}>
              <input type="text">
            </tp-input>
  
            <label>*Amount</label>
            <tp-input name="amount" .value=${trade.amount} required errorMessage="required">
              <input type="text">
            </tp-input>

            <label>Quote Price Converted</label>
            <tp-input name="quotePriceC" .value=${trade.quotePriceC} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>*Fee</label>
            <tp-input name="fee.amount" .value=${trade.fee?.amount || 0} required errorMessage="required">
              <input type="text">
            </tp-input>

            <label>*Fee Price Converted</label>
            <tp-input name="fee.priceC" .value=${trade.fee?.priceC || 0} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>*Fee Currency</label>
            <tp-input name="fee.currency" .value=${trade.fee?.currency} required errorMessage="required">
              <input type="text">
            </tp-input>

            <label>*Quote Fee</label>
            <tp-input name="quoteFee.amount" .value=${trade.quoteFee?.amount || 0} required errorMessage="required">
              <input type="text">
            </tp-input>

            <label>*Quote Fee Price Converted</label>
            <tp-input name="quoteFee.priceC" .value=${trade.quoteFee?.priceC || 0} required errorMessage="required">
              <input type="text">
            </tp-input>
  
            <label>Quote Fee Currency</label>
            <tp-input name="quoteFee.currency" .value=${trade.quoteFee?.currency}>
              <input type="text">
            </tp-input>
  
            <label>*Action</label>
            <tp-dropdown name="action" .value=${trade.action} .items=${[{ value: 0, label: 'Buy' }, { value: 1, label: 'Sell' }]} .default=${0} required></tp-dropdown>
  
            <label>*Order Type</label>
            <tp-dropdown name="orderType" .value=${trade.orderType} .items=${[{ value: 0, label: 'Taker' }, { value: 1, label: 'Maker' }]} .default=${0} required></tp-dropdown>
  
            <label>Order ID</label>
            <tp-input name="orderId" .value=${trade.orderId}>
              <input type="text">
            </tp-input>
  
            <label class="baseline">Properties</label>
            <div>
              <tp-checkbox name="props.isMarginTrade" .checked=${trade.props?.isMarginTrade}>Is Margin Trade</tp-checkbox>
              <tp-checkbox name="props.isDerivative" .checked=${trade.props?.isDerivative}>Is Derivative Market</tp-checkbox>
              <tp-checkbox name="props.isPhysical" .checked=${trade.props?.isPhysical}>Is Physical Market</tp-checkbox>
            </div>
  
            <label>Comment</label>
            <tp-input name="comment" .value=${trade.comment}>
              <input type="text">
            </tp-input>
          </div>

          <div class="buttons-justified">
            <tp-button dialog-dismiss @click=${this.reset}>Cancel</tp-button>
            ${trade._id ? html`
            <tp-popup valign="top">
              <tp-button slot="toggle" class="danger">Delete</tp-button>
              <tp-button slot="content" class="danger" submit delete>Yes, Delete Now!</tp-button>
            </tp-popup>
            ` : null}
            <tp-button submit>${trade._id ? 'Save' : 'Create'}</tp-button>
            <tp-button submit close>${trade._id ? 'Save & Close' : 'Create & Close'}</tp-button>
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

    if (btn.hasAttribute('delete')) {
      const resp = await this.post('/trades/manually/delete', { _id: e.detail._id });

      if (resp.result) {
        btn.showSuccess();
        this.dispatchEvent(new CustomEvent('dialog-close', { detail: null, bubbles: true, composed: true }));
      } else {
        btn.showError();
      }
      return;
    }

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