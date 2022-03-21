/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import './elements/tp-table/tp-table.js';
import { LitElement, html, css } from 'lit';
import shared from './styles/shared';
import { fetchMixin } from '@tp/helpers/fetch-mixin';

class TheTransactions extends fetchMixin(LitElement) {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: flex;
          flex-direction: row;
          flex: 1;
        }

        tp-table {
          flex: 1;
          --scrollbar-track: var(--bg0);
          --scrollbar-thumb: var(--hl1);
          --tp-icon-color: var(--hl1);
        }

        tp-table::part(header) {
          background: var(--bg0);
        }

        tp-table::part(sort-icon) {
          --tp-icon-width: 22px;
          --tp-icon-height: 22px;
        }

        tp-table::part(width-handle-bar):hover {
          background: var(--bg0);
        }

        tp-table::part(column-label) {
          border-right: solid 2px var(--bg1);
        }

        tp-table::part(cell) {
          border-right: solid 2px var(--bg0);
        }

        tp-table::part(row):hover {
          background-color: var(--bg1);
        }

        .list {
          height: 100px;
          width: 200px;
          overflow-y: auto;
        }
      `
    ];
  }

  render() {
    const { records, columns } = this;

    return html`
      <tp-table .columns=${columns} .items=${records}></tp-table>
    `;
  }

  static get properties() {
    return {
      records: { type: Array },
    };
  }

  firstUpdated() {
    super.firstUpdated();

    this.columns = [
      {name: 'base', label: 'Base', visible: true, width: '100px'},
      {name: 'amount', label: 'Amount', visible: true, width: '100px'},
      {name: 'cost', label: 'Cost', visible: true, width: '100px'},
      {name: 'costC', label: 'Cost C', visible: true, width: '100px'},
      {name: 'fee', label: 'Fee', visible: true, width: '163px'},
      {name: 'feeC', label: 'Fee C', visible: true, width: '100px'},
      {name: 'quote', label: 'Quote', visible: true, width: '100px'},
      {name: 'side', label: 'Side', visible: true, width: '97px'},
      {name: 'source', label: 'Source', visible: true, width: '203px'},
      {name: 'ticker', label: 'Ticker', visible: true, width: '117px'},
      {name: 'ts', label: 'Date', visible: true, width: '223px'},
      {name: 'txId', label: 'Tx-ID', visible: true, width: '100px'}
    ];

    this.fetchTransactions();
  }

  async fetchTransactions() {
    const resp = await this.get('/transactions/all');
    this.records = resp.data;
    console.log(this.records);
  }
}

window.customElements.define('the-transactions', TheTransactions);