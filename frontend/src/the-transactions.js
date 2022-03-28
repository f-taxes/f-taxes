/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-popup/tp-popup.js';
import './elements/column-manager.js';
import './elements/pagination-bar.js';
import './elements/tx-row.js';
import './elements/tp-table/tp-table.js';
import { LitElement, html, css } from 'lit';
import shared from './styles/shared';
import Pagination from './helpers/pagination.js';
import { fetchMixin } from '@tp/helpers/fetch-mixin';
import icons from './icons.js';
import { Store } from '@tp/tp-store/store';

class TheTransactions extends fetchMixin(Store(LitElement)) {
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

        .tools {
          padding: 10px 32px 10px 20px;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
        }
      `
    ];
  }

  render() {
    const { items, columns, pageStats } = this;

    return html`
      <div class="tools">
        <div></div>
        <div>
          <tp-popup halign="right">
            <tp-icon slot="toggle" tooltip="Edit columns" .icon=${icons.columns}></tp-icon>
            <column-manager slot="content" settingsKey="transactions" .columns=${columns}></column-manager>
          </tp-popup>
        </div>
      </div>
      <tp-table .columns=${columns} .items=${items} @sorting-changed=${e => this.sortingChanged(e)}></tp-table>
      <pagination-bar .stats=${pageStats} @next-page=${this.nextPage} @prev-page=${this.prevPage} @goto-page=${this.goto}></pagination-bar>
    `;
  }

  static get properties() {
    return {
      items: { type: Array },
      pageStats: { type: Object },
      columns: { type: Array },
    };
  }

  constructor() {
    super();
    this.pagination = new Pagination(1, 5000, 'ts', 'asc');

    this.storeSubscribe([
      'settings'
    ]);
  }

  shouldUpdate(changes) {
    super.shouldUpdate(changes);
    return this.settings !== undefined;
  }

  firstUpdated() {
    super.firstUpdated();

    this.columns = this.settings.transactions.columns;
    this.shadowRoot.querySelector('tp-table').renderItem = this.renderItem.bind(this);
    this.fetchTransactions();
  }

  storeUpdated(key, newValue, targetProperty) {
    super.storeUpdated(key, newValue, targetProperty);
  
    if (key === 'settings') {
      this.columns = this.settings.transactions.columns;
      const pagS = this.settings.transactions.pagination;
      this.pagination.setPage(pagS.page);

      if (pagS.sort[0] === '-') {
        this.pagination.updateSort(pagS.sort.substring(1), 'desc');
      } else {
        this.pagination.updateSort(pagS.sort, 'asc');
      }
      
      this.pagination.setLimit(pagS.limit);
    }
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
    this.settings.transactions.pagination = this.pagination.value;
    this.post('/settings/save', this.settings);
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