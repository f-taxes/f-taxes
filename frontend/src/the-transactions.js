/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import './elements/pagination-bar.js';
import './elements/tx-row.js';
import './elements/tp-table/tp-table.js';
import { LitElement, html, css } from 'lit';
import shared from './styles/shared';
import Pagination from './helpers/pagination.js';
import { fetchMixin } from '@tp/helpers/fetch-mixin';

class TheTransactions extends fetchMixin(LitElement) {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: flex;
          flex-direction: column;
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

        pagination-bar {
          
        }
      `
    ];
  }

  render() {
    const { items, columns, pageStats } = this;

    return html`
      <tp-table .columns=${columns} .items=${items} @sorting-changed=${e => this.sortingChanged(e)}></tp-table>
      <pagination-bar .stats=${pageStats} @next-page=${this.nextPage} @prev-page=${this.prevPage} @goto-page=${this.goto}></pagination-bar>
    `;
  }

  static get properties() {
    return {
      items: { type: Array },
      pageStats: { type: Object },
    };
  }

  constructor() {
    super();
    this.pagination = new Pagination(1, 5000, 'ts', 'asc');
  }

  firstUpdated() {
    super.firstUpdated();

    this.columns = [
      { name: 'base', label: 'Base', visible: true, width: '100px' },
      { name: 'amount', label: 'Amount', visible: true, width: '100px' },
      { name: 'cost', label: 'Cost', visible: true, width: '100px' },
      { name: 'costC', label: 'Cost C', visible: true, width: '100px' },
      { name: 'fee', label: 'Fee', visible: true, width: '163px' },
      { name: 'feeC', label: 'Fee C', visible: true, width: '100px' },
      { name: 'quote', label: 'Quote', visible: true, width: '100px' },
      { name: 'side', label: 'Side', visible: true, width: '97px' },
      { name: 'source', label: 'Source', visible: true, width: '203px' },
      { name: 'ticker', label: 'Ticker', visible: true, width: '117px' },
      { name: 'ts', label: 'Date', type: 'date', visible: true, width: '223px' },
      { name: 'txId', label: 'Tx-ID', visible: true, width: '100px' }
    ];

    this.shadowRoot.querySelector('tp-table').renderItem = this.renderItem.bind(this);
    this.fetchTransactions();
  }

  renderItem(item, idx, columns) {
    return html`
      <tx-row
        exportparts="cell,odd,row"
        item
        .index=${idx}
        .item=${item}
        .selectable=${this.selectable}
        .columns=${columns}
        @selection-changed=${e => this._selectionChanged(e)}>
      </tx-row>
    `;
  }

  async fetchTransactions() {
    this.shadowRoot.querySelector('tp-table').sorting = { column: this.pagination.sortBy, direction: this.pagination.sortDir };
    const resp = await this.post('/transactions/page', this.pagination.value, true);
    this.items = resp.data.items;
    this.pageStats = resp.data;
  }

  sortingChanged(e) {
    this.pagination.updateSort(e.detail.column, e.detail.direction);
    this.fetchTransactions();
  }

  nextPage() {
    this.pagination.nextPage();
    this.fetchTransactions();
  }

  prevPage() {
    this.pagination.prevPage();
    this.fetchTransactions();
  }

  goto(e) {
    this.pagination.setPage(e.detail.page);
    this.pagination.setLimit(e.detail.limit);
    this.fetchTransactions();
  }
}

window.customElements.define('the-transactions', TheTransactions);