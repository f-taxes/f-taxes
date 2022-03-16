/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-button/tp-button.js';
import '@tp/tp-form/tp-form.js';
import '@tp/tp-input/tp-input.js';
import './elements/card-box.js';
import shared from './styles/shared.js';
import { LitElement, html, css } from 'lit';
import { fetchMixin } from '@tp/helpers/fetch-mixin.js';
import { Store } from '@tp/tp-store/store';

class TheSettings extends fetchMixin(Store(LitElement)) {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: block;
          padding: 20px;
        }

        card-box {
          max-width: 800px;
          margin: auto;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 1fr auto;
        }

        .settings-grid label {
          font-weight: bold;
        }
      `
    ];
  }

  render() {
    const { settings } = this;

    return html`
      <card-box>
        <h2>Update your display / calculation settings</h2>
        <tp-form @submit=${this.saveSettings}>
          <form>
            <div class="settings-grid">
              <label>Date & Time Format</label>
              <div>
                <tp-input name="dateTimeFormat" .value=${settings?.dateTimeFormat} autoValidate .validator=${this.validateDTFormat} errorMessage="Invalid format">
                  <input type="text" placeholder="Pp">
                </tp-input>
                <div class="hint">
                  Use a combination of:
                  <ul>
                    <li>- y (year) </li>
                    <li>- M (month)</li>
                    <li>- d (day of month)</li>
                    <li>- H (hour)</li>
                    <li>- m (minute)</li>
                    <li>- s (second)</li>
                    <li>- P (localized date format)</li>
                    <li>- p (localized time format)</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="button-centered">
              <tp-button submit>Save Settings</tp-button>
            </div>
          </form>
        </tp-form>
      </card-box>
    `;
  }

  static get properties() {
    return {
      settings: { type: Object },
    };
  }

  constructor() {
    super();

    this.storeSubscribe([
      'settings'
    ]);
  }

  validateDTFormat(el, value) {
    return /^[yMdHmsPpz:\.-\s]+$/.test(value);
  }

  async saveSettings(e) {
    const btn = e.target.submitButton;
    btn.showSpinner();
    const resp = await this.post('/settings/save', e.detail);

    if (resp.result) {
      btn.showSuccess();
    } else {
      btn.showError();
    }
  }
}

window.customElements.define('the-settings', TheSettings);