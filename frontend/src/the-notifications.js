/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-icon/tp-icon.js';
import '@lit-labs/virtualizer';
import { LitElement, html, css } from 'lit';
import { WsListener } from './helpers/ws-listener';
import { fetchMixin } from '@tp/helpers/fetch-mixin';
import { formatTs } from './helpers/time.js';
import { Store } from '@tp/tp-store/store';
import icons from './icons';

class TheNotifications extends Store(fetchMixin(WsListener(LitElement))) {
  static get styles() {
    return [
      css`
        :host {
          display: block;
          width: 480px;
          height: 800px;
          bottom: 0;
          display: flex;
          flex-direction: column;
          padding: 0 20px;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 40px;
          margin-bottom: 20px;
        }

        header tp-icon + tp-icon {
          margin-left: 10px;
        }

        lit-virtualizer {
          flex: 1;
          margin-bottom: 20px;
        }

        .rec {
          padding: 5px 10px;
          width: 100%;
          margin-bottom: 20px;
          background: var(--bg0);
          border-radius: 4px;
        }

        .rec:hover {
          background: var(--hl2);
        }

        .rec .msg,
        .rec .date {
          color: var(--text);
        }

        .rec .level {
          min-width: 80px;
        }

        .rec .bottom {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .date {
          font-size: 12px;
        }

        .tags {
          margin-top: 5px;
        }

        .tag {
          display: inline-block;
          font-size: 12px;
          background: var(--hl1);
          color: var(--text-dark);
          padding: 3px 3px 3px 0;
          border-radius: 4px;
          border-left: solid 3px transparent;
        }

        .tag + .tag {
          margin-left: 5px;
        }

        .error {
          border-left: solid 3px var(--red);
        }

        .warning {
          border-left: solid 3px var(--amber);
        }

        .empty {
          position: absolute;
          inset: 0px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
      `
    ];
  }

  render() {
    const { records } = this;

    return html`
      <header>
        <h2>Notifications</h2>
        <div>
          <tp-icon .icon=${icons['database-export']} tooltip="Export log as CSV" tooltipValign="top" @click=${this.exportLog}></tp-icon>
          <tp-icon .icon=${icons['clear-all']} tooltip="Clear log" tooltipValign="top" @click=${this.clearLog}></tp-icon>
        </div>
      </header>
      ${records.length === 0 ? html`<div class="empty">No Notifications</div>` : null}
      <lit-virtualizer scroller class="scrollbar" .items=${records || []} .renderItem=${rec => this.renderRecord(rec)}></lit-virtualizer>
    `;
  }

  renderRecord(rec) {
    if (!rec) return;
    return html`
      <div class="rec ${rec.level.toLowerCase()}">
        <div class="msg">${rec.data}</div>
        <div class="bottom">
          <div class="tags">${Array.isArray(rec.tags) ? rec.tags.map(tag => html`<div class="tag">${tag}</div>`) : null}</div>
          <div class="date">${formatTs(new Date(rec.ts), this.settings?.dateTimeFormat)}</div>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      records: { type: Array },
    };
  }

  constructor() {
    super();
    this.records = [];
    this.storeSubscribe([
      'settings'
    ]);
  }

  firstUpdated() {
    super.firstUpdated();
    this.fetchRecords();
  }

  updated(changes) {
    if (changes.has('records')) {
      this.dispatchEvent(new CustomEvent('notification-count', { detail: this.records.length, bubbles: true, composed: true }));
    }
  }

  onMsg(msg) {
    if (msg.event === 'applog') {
      this.records = [msg.data, ...this.records];
    }
  }

  async fetchRecords() {
    const resp = await this.get('/applog/list');

    if (resp?.result) {
      this.records = resp.data;
    } else {
      this.records = [];
    }
  }

  async clearLog() {
    await this.post('/applog/clear');
    this.fetchRecords();
  }

  async exportLog() {
    const resp = await this.post('/applog/export');

    if (resp.result) {
      const anchor = document.createElement('a');
      anchor.href = '/applog/download/' + resp.data;
      anchor.download = resp.data;
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.removeChild(anchor);
    }
  }
}

window.customElements.define('the-notifications', TheNotifications);