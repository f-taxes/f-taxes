/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-form/tp-form.js';
import '@tp/tp-dropdown/tp-dropdown.js';
import '@tp/tp-checkbox/tp-checkbox.js';
import '@tp/tp-button/tp-button.js';
import { LitElement, html, css } from 'lit';
import shared from '../styles/shared';
import { WsListener } from '../helpers/ws-listener.js';
import { fetchMixin } from '@tp/helpers/fetch-mixin.js';

class CbOptions extends WsListener(fetchMixin(LitElement)) {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: block;
          max-width: 460px;
        }
      `
    ];
  }

  render() {
    const conversionPlugins = this.conversionPlugins || [];

    return html`
      <h3>Convert Prices</h3>
      <p>To determine the cost-basis of assets, price need to be converted into your native currency. That's the job of conversion plugins.</p>

      <tp-form @submit=${this.startConversion}>
        <form>
          <label>Plugin</label>
          <tp-dropdown name="plugin" .default=${conversionPlugins.length > 0 ? conversionPlugins[0].value : null} .items=${conversionPlugins} required errorMessage="Required"></tp-dropdown>

          <label>Currency</label>
          <tp-dropdown name="currency" default="EUR" .items=${[{ value: 'EUR', label: 'EUR' }]} required errorMessage="Required"></tp-dropdown>

          <tp-checkbox name="applyFilter" checked>Filtered only (uncheck to convert prices in all records)</tp-checkbox>

          <div class="buttons-justified">
            <tp-button dialog-dismiss>Cancel</tp-button>
            <tp-button submit>Start Converting</tp-button>
          </div>
        </form>
      </tp-form>
    `;
  }

  static get properties() {
    return {
      conversionPlugins: { type: Array },
      target: { type: String },
      filter: { type: Array },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchConversionPlugins();
  }

  async fetchConversionPlugins() {
    const resp = await this.post('/plugins/list', { types: [ 'Conversion' ], onlyInstalled: true });
    
    if (resp.result) {
      this.conversionPlugins = resp.data.map(p => ({ value: p.id, label: `${p.label} (${p.version})` }));
    }
  }

  onMsg(msg) {
    if (msg.event === 'plugin-install-result' || msg.event === 'plugin-uninstalled') {
      this.fetchConversionPlugins();
    }
  }

  async startConversion(e) {
    const btn = e.target.submitButton;

    if (e.detail.applyFilter) {
      e.detail.filter = this.filter;
    }

    btn.showSpinner();
    const resp = await this.post(`/${this.target}/conversion/start`, e.detail);

    if (resp.result) {
      btn.showSuccess();
      this.dispatchEvent(new CustomEvent('dialog-close', { detail: null, bubbles: true, composed: true }));
    } else {
      btn.showError();
    }
  }
}

window.customElements.define('cb-options', CbOptions);