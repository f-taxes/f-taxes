/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-dropdown/tp-dropdown.js';
import '@tp/tp-form/tp-form.js';
import '@tp/tp-input/tp-input.js';
import { LitElement, html, css } from 'lit';
import { fetchMixin } from '@tp/helpers/fetch-mixin.js';
import shared from '../styles/shared.js';

class TheSourceForm extends fetchMixin(LitElement) {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: block;
        }
      `
    ];
  }

  render() {
    const { selSource } = this;
    const firstSource = this.availSources[0] || {};

    return html`
      <tp-form>
        <form>
          <tp-dropdown name="srcName" .default=${firstSource.id} .items=${this.availSources.map(src => ({ value: src.id, label: src.label }))} @value-changed=${e => this.selSource = e.detail}></tp-dropdown>

          <label>Label</label>
          <tp-input name="label" required errorMessage="Required">
            <input type="text">
          </tp-input>

          <label>API Key</label>
          <tp-input name="key" required errorMessage="Required">
            <input type="text">
          </tp-input>

          <label>API Secret</label>
          <tp-input name="secret" required errorMessage="Required">
            <input type="password">
          </tp-input>

          ${selSource === 'ftx' ? html`
            <label>Subaccount</label>
            <tp-input name="subaccount">
              <input type="text" placeholder="Leave empty for main account">
            </tp-input>
          ` : null}

          <label>Notes</label>
          <textarea name="notes"></textarea>
        </form>
      </tp-form>
    `;
  }

  static get properties() {
    return {
      availSources: { type: Array },
      selSource: { type: String },
    };
  }

  constructor() {
    super();
    this.availSources = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadAvailableSources();
  }

  submit() {
    this.shadowRoot.querySelector('tp-form').submit();
  }

  async loadAvailableSources() {
    const resp = await this.get('/sources/list')

    if (resp.result) {
      this.availSources = resp.data;
    }
  }
}

window.customElements.define('the-source-form', TheSourceForm);