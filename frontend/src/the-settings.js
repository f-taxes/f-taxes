/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-button/tp-button.js';
import '@tp/tp-form/tp-form.js';
import '@tp/tp-input/tp-input.js';
import '@tp/tp-dropdown/tp-dropdown.js';
import './elements/card-box.js';
import './elements/quick-confirm-button.js';
import shared from './styles/shared.js';
import { LitElement, html, css } from 'lit';
import { fetchMixin } from '@tp/helpers/fetch-mixin.js';
import { Store } from '@tp/tp-store/store';
import { Timezones } from './helpers/tz.js';
import { formatTs } from './helpers/time.js';

class TheSettings extends fetchMixin(Store(LitElement)) {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: block;
          padding: 20px;
          flex: 1;
        }

        card-box {
          max-width: 800px;
          margin: auto;
        }

        card-box + card-box {
          margin-top: 20px;
        }

        .empty {
          padding: 40px;
          text-align: center;
          font-size: 20px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-row-gap: 40px;
        }

        .settings-grid label {
          font-weight: bold;
        }

        tp-form tp-dropdown {
          margin-bottom: 0;
        }

        .snapshots {
          overflow-y: auto;
          max-height: 400px;
        }

        .snapshot {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }

        .snapshot + .snapshot {
          margin-top: 10px;
        }

        h2 {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }

        h2 tp-button {
          font-size: 16px;
        }

        .actions {
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
          align-items: center;
        }

        .actions quick-confirm-button + quick-confirm-button {
          margin-left: 10px;
        }
      `
    ];
  }

  render() {
    const { settings, snapshots } = this;

    return html`
      <card-box>
        <h2>Update your display / calculation settings</h2>
        <tp-form @submit=${this.saveSettings}>
          <form>
            <div class="settings-grid">
              <label>Time Zone</label>
              <div>
                <tp-dropdown name="timeZone" .value=${settings?.timeZone} .default=${Intl.DateTimeFormat().resolvedOptions().timeZone} filterable filterPlaceholder="Search" .items=${Timezones}></tp-dropdown>
              </div>

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

              <label>Delete all trades</label>
              <div>
                <tp-button @click=${this.deleteAllTrades} extended>Delete Trades</tp-button>
              </div>

              <label>Delete all transfers</label>
              <div>
                <tp-button @click=${this.deleteAllTransfers} extended>Delete Transfers</tp-button>
              </div>
            </div>
            <div class="button-centered">
              <tp-button submit>Save Settings</tp-button>
            </div>
          </form>
        </tp-form>
      </card-box>

      <card-box>
        <h2>
          <div>
            Manage Snapshots
          </div>
          <div>
            <tp-button @click=${this.createSnapshot} extended>Create</tp-button>
          </div>
        </h2>
        <div class="snapshots">
          ${snapshots.map(ts => html`
            <div class="snapshot">
              <div class="timestamp">${formatTs(ts, this.settings?.dateTimeFormat, this.settings?.timeZone)}</div>
              <div class="actions">
                <quick-confirm-button label="Restore" confirmLabel="Click To Restore" extended @confirm=${e => this.restoreSnapshot(e, ts)}></quick-confirm-button>
                <quick-confirm-button label="Delete" confirmLabel="Click To Delete" danger extended @confirm=${e => this.deleteSnapshot(e, ts)}></quick-confirm-button>
              </div>
            </div>
          `)}
          ${snapshots.length === 0 ? html`<div class="empty">No Snapshots Available</div>` : null}
        </div>
      </card-box>
    `;
  }

  static get properties() {
    return {
      settings: { type: Object },
      snapshots: { type: Array },
    };
  }

  constructor() {
    super();

    this.snapshots = [];
    this.storeSubscribe([
      'settings'
    ]);
  }

  firstUpdated() {
    this.listSnapshots();
  }

  validateDTFormat(el, value) {
    return /^[yMdHmsPpz:\.-\s]+$/.test(value);
  }

  async saveSettings(e) {
    const btn = e.target.submitButton;
    btn.showSpinner();

    this.settings = Object.assign(this.settings, e.detail);
    const resp = await this.post('/settings/save', this.settings);

    if (resp.result) {
      btn.showSuccess();
    } else {
      btn.showError();
    }
  }

  convertMissingPrices() {
    this.get('/settings/convert/force');
  }

  async deleteAllTrades(e) {
    const btn = e.target;
    btn.showSpinner();
    const resp = await this.get('/trades/clear');

    if (resp.result) {
      btn.showSuccess();
    } else {
      btn.showError();
    }
  }

  async deleteAllTransfers(e) {
    const btn = e.target;
    btn.showSpinner();
    const resp = await this.get('/transfers/clear');

    if (resp.result) {
      btn.showSuccess();
    } else {
      btn.showError();
    }
  }

  async listSnapshots() {
    const resp = await this.get('/snapshots/list');

    if (resp.result) {
      this.snapshots = resp.data || [];
    }
  }

  async createSnapshot(e) {
    const btn = e.target;
    btn.showSpinner();
    const resp = await this.post('/snapshots/create');

    if (resp.result) {
      btn.showSuccess();
      this.snapshots = resp.data || [];
    } else {
      btn.showError();
    }
  }

  async restoreSnapshot(e, ts) {
    const btn = e.target.button;
    btn.showSpinner();
    const resp = await this.post('/snapshots/restore', { ts });

    if (resp.result) {
      btn.showSuccess();
    } else {
      btn.showError();
    }
  }

  async deleteSnapshot(e, ts) {
    const btn = e.target.button;
    btn.showSpinner();
    const resp = await this.post('/snapshots/remove', { ts });

    if (resp.result) {
      btn.showSuccess();
      this.snapshots = resp.data || [];
    } else {
      btn.showError();
    }
  }
}

window.customElements.define('the-settings', TheSettings);