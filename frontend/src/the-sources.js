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
import { WsListener } from './helpers/ws-listener.js';
import { fetchMixin } from '@tp/helpers/fetch-mixin.js';
import { Store } from '@tp/tp-store/store.js';
import { logos } from './logos.js';
import { isZero, formatTs } from './helpers/time.js';

const mixins = [
  Store,
  fetchMixin,
  DomQuery,
  WsListener,
];

const BaseElement = mixins.reduce((baseClass, mixin) => {
  return mixin(baseClass);
}, LitElement);

class TheSources extends BaseElement {
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
          flex-direction: row;
          justify-content: center;
          align-items: center;
          grid-area: actions;
        }

        .actions > * + * {
          margin-left: 10px;
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
                <img src=${logos[con.srcName]}></img>
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
                  <tp-button id=${'fetch_' + con._id} class="only-icon" extended @click=${e => this.fetchData(e, con)}><tp-icon .icon=${icons.refresh}></tp-icon></tp-button>
                </tp-tooltip-wrapper>

                <tp-tooltip-wrapper text="Remove source and it's associated data" tooltipValign="top">
                  <tp-button class="only-icon" extended @click=${() => this.confirmRemoveSrcCon(con)}><tp-icon .icon=${icons.delete}></tp-icon></tp-button>
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

      <tp-dialog id="removeSourceDialog" showClose>
        <h2>Confirm removal</h2>
        <p>Do you want to remove the source "${this.selSrcCon.label}"?<br>This will also delete all associated transactions and so on.</p>
        <div class="buttons-justified">
          <tp-button dialog-dismiss>Cancel</tp-button>
          <tp-button class="danger" @click=${() => this.removeSrcCon()}>Yes, Remove</tp-button>
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
      selSrcCon: { type: Object },
    };
  }

  constructor() {
    super();
    this.srcConnections = [];
    this.selSrcCon = {};

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
    const resp = await this.post('/source/fetch/one', { srcId: con._id });
    if (!resp.result) {
      btn.showError();
    }
  }

  confirmRemoveSrcCon(con) {
    this.selSrcCon = con;
    this.$.removeSourceDialog.show();
  }

  removeSrcCon() {
    this.post('/source/remove', { srcId: this.selSrcCon._id });
    this.$.removeSourceDialog.close();
  }

  onMsg(msg) {
    if (msg.event === 'job-progress' && msg.data.srcConId !== undefined) {
      const { data } = msg;
      const btn = this.shadowRoot.querySelector('#fetch_' + data.srcConId);

      if (data.progress === '100' && btn) {
        btn.hideSpinner();
      } else {
        if (!btn.hasAttribute('locked')) {
          btn.showSpinner();
        }
      }
      this.requestUpdate('jobs');
    }
  }
}

window.customElements.define('the-sources', TheSources);