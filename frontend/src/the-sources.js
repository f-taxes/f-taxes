/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-button/tp-button.js';
import '@tp/tp-icon/tp-icon.js';
import '@tp/tp-dialog/tp-dialog.js';
import '@tp/tp-tooltip/tp-tooltip-wrapper.js';
import './elements/card-box.js';
import './elements/the-source-form.js';
import { LitElement, html, css } from 'lit';
import shared from './styles/shared.js';
import icons from './icons.js';
import { DomQuery } from '@tp/helpers/dom-query.js'
import { fetchMixin } from '@tp/helpers/fetch-mixin.js';
import { Store } from '@tp/tp-store/store.js';
import { logos } from './logos.js';
import { isZero, formatTs } from './helpers/time.js';

class TheSources extends Store(fetchMixin(DomQuery(LitElement))) {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: block;
          flex: 1;
          padding: 20px;
        }

        header {
          display: flex;
          justify-content: space-between;
        }

        card-box {
          max-width: 800px;
          margin: auto;
        }

        .empty {
          padding: 40px;
          text-align: center;
          font-size: 20px;
        }

        .src {
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: 1fr 1fr auto;
          gap: 0 20px;
          grid-auto-flow: row;
          grid-template-areas:
            "logo label actions"
            "logo key actions";
          margin-top: 20px;
          background: var(--bg0);
          padding: 10px;
          border-radius: 4px;
        }

        .logo {
          padding: 10px;
          font-size: 30px;
          grid-area: logo;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 8px;
          background: var(--white);
        }

        .logo img {
          max-width: 80px;
        }

        .label {
          grid-area: label;
          align-items: center;
        }

        .key {
          grid-area: key;
        }

        .label,
        .key {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-column-gap: 20px;
        }

        .label > div,
        .key > div {
          display: flex;
          align-items: center;
        }

        .actions {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          grid-area: actions;
        }

        .src label {
          color: var(--text-low);
          margin-right: 10px;
        }
      `
    ];
  }

  render() {
    const { srcConnections, settings } = this;

    return html`
      <card-box>
        <h2>Add your exchange accounts here</h2>
        <header>
          <h3>You have ${srcConnections.length} sources set up</h3>
          <tp-button @click=${this.startAddSource}>Add <tp-icon .icon=${icons.add}></tp-icon></tp-button>
        </header>
        <div class="list">
          ${srcConnections.length == 0 ? html`
            <div class="empty">Click the "Add"-Button on the top right to add your first source</div>
          ` : srcConnections.map(con => html`
            <div class="src">
              <div class="logo">
                <img src=${logos[con.source]}></img>
              </div>
              <div class="label">
                <div><label>Label:</label>${con.label}</div>
                <div><label>Last Fetched:</label>${isZero(con.lastFetched) ? 'Never' : formatTs(con.lastFetched, settings?.dateTimeFormat)}</div>
              </div>
              <div class="key">
                <div><label>Api Key:</label>${con.key.substring(0, 6)}...</div>
                <div><label>Api Secret:</label>***</div>
              </div>
              <div class="actions">
                <tp-tooltip-wrapper text="Fetch newest data from this source" tooltipValign="top">
                  <tp-button class="only-icon" extended @click=${e => this.fetchData(e, con)}><tp-icon .icon=${icons.refresh}></tp-icon></tp-button>
                </tp-tooltip-wrapper>
              </div>
            </div>
          `)}
        </div>
      </card-box>

      <tp-dialog id="addSourceDialog" showClose>
        <h2>Add source to pull transaction history from</h2>
        <the-source-form @submit=${this.addSource}></the-source-form>
        <div class="buttons-justified">
          <tp-button dialog-dismiss>Cancel</tp-button>
          <tp-button id="addSourceBtn" @click=${() => this.shadowRoot.querySelector('the-source-form').submit()} extended>Add</tp-button>
        </div>
      </tp-dialog>
    `;
  }

  static get properties() {
    return {
      items: { type: Array },
      active: { type: Boolean, reflect: true },
      srcConnections: { type: Array },
      settings: { type: Object },
    };
  }

  constructor() {
    super();
    this.srcConnections = [];

    this.storeSubscribe([
      'srcConnections',
      'settings'
    ]);
  }

  startAddSource() {
    this.$.addSourceDialog.show();
  }

  async addSource(e) {
    this.$.addSourceBtn.showSpinner();
    const resp = await this.post('/source/add', e.detail);
    
    if (resp.result) {
      this.$.addSourceBtn.showSuccess();
      this.$.addSourceDialog.close();
    } else {
      this.$.addSourceBtn.showError();
    }
  }

  async fetchData(e, con) {
    const btn = e.target;
    btn.showSpinner();
    const resp = await this.post('/source/fetch/all', { srcId: con._id });
    if (!resp.result) {
      btn.showError();
    }
  }
}

window.customElements.define('the-sources', TheSources);