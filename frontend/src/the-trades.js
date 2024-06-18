/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-icon/tp-icon.js';
import '@tp/tp-popup/tp-popup.js';
import '@tp/tp-popup/tp-popup-menu.js';
import '@tp/tp-popup/tp-popup-menu-item.js';
import '@tp/tp-dialog/tp-dialog.js';
import '@tp/tp-date-input/tp-date-input.js';
import './elements/column-manager.js';
import './elements/pagination-bar.js';
import './elements/trade-row.js';
import './elements/trade-editor.js';
import './elements/tp-filter-builder/tp-filter-builder.js';
import './elements/cb-options.js';
import { TpTable } from '@tp/tp-table/tp-table.js';
import { LitElement, html, css } from 'lit';
import { fetchMixin } from '@tp/helpers/fetch-mixin';
import { Store } from '@tp/tp-store/store';
import { getLocalDateFormat } from './helpers/time.js';
import { DomQuery } from '@tp/helpers/dom-query.js';
import shared from './styles/shared';
import Pagination from './helpers/pagination.js';
import icons from './icons.js';
import { closest } from '@tp/helpers/closest.js';
import { WsListener } from './helpers/ws-listener.js';
import tableview from './styles/tableview.js';

const mixins = [
  WsListener,
  fetchMixin,
  Store,
  DomQuery,
];

const BaseElement = mixins.reduce((baseClass, mixin) => {
  return mixin(baseClass);
}, LitElement);

class TheTrades extends BaseElement {
  static get styles() {
    return [
      shared,
      tableview
    ];
  }

  render() {
    const { items, columns, pageStats, filterFields, defaultOptions, ws } = this;

    return html`
      <div class="tools">
        <div>
          <tp-filter-builder .fields=${filterFields} .defaultOptions=${defaultOptions} @filters-changed=${this.applyFilter} @filters-cleared=${this.applyFilter}></tp-filter-builder>
        </div>
        <div>
          <tp-button @click=${() => this.showTxEditor()}>
            Add Manually
            <tp-icon .icon=${icons.add}></tp-icon>
          </tp-button>

          <tp-popup halign="right">
            <tp-icon slot="toggle" tooltip="Tools" .icon=${icons.tools}></tp-icon>
            <tp-popup-menu slot="content">
              <tp-popup-menu-item .icon=${icons.money} @click=${() => this.$.costBasisDialog.show()}>Cost-Basis</tp-popup-menu-item>
              <tp-popup-menu-item .icon=${icons.delete} @click=${() => this.$.deleteFilteredDialog.show()}>Delete All Trades (as filtered)</tp-popup-menu-item>
            </tp-popup-menu>
          </tp-popup>

          <tp-popup halign="right">
            <tp-icon slot="toggle" tooltip="Edit columns" .icon=${icons.columns}></tp-icon>
            <column-manager slot="content" settingsKey="trades" .columns=${columns}></column-manager>
          </tp-popup>
        </div>
      </div>
      <tp-table
        .columns=${columns}
        .items=${items}
        @dblclick=${this.tableDoubleClick}
        @sorting-changed=${e => this.sortingChanged(e)}
        @column-width-changed=${e => this.colWidthChanged(e)}
        @toggle-row-mark=${this.toggleRowMark}>
      </tp-table>
      <pagination-bar .stats=${pageStats} @next-page=${this.nextPage} @prev-page=${this.prevPage} @goto-page=${this.goto}></pagination-bar>

      <tp-dialog id="tradeEditorDialog">
        <trade-editor .tx=${this.selTrade}></trade-editor>
      </tp-dialog>

      <tp-dialog id="costBasisDialog">
        <cb-options .ws=${ws} target="trades" .filter=${this.activeFilter || []}></cb-options>
      </tp-dialog>

      <tp-dialog id="deleteFilteredDialog">
        <h3>Please Confirm</h3>
        <p>Delete all trades as currently filtered?</p>
        <div class="buttons-justified">
          <tp-button dialog-dismiss>Cancel</tp-button>
          <tp-button class="danger" @click=${this.deleteFilteredTrades} extended>Yes, Delete Trades</tp-button>
        </div>
      </tp-dialog>
    `;
  }

  static get properties() {
    return {
      items: { type: Array },
      pageStats: { type: Object },
      columns: { type: Array },
      filterFields: { type: Array },
      defaultOptions: { type: Object },
      selTrade: { type: Object },
      activeFilter: { type: Array },
      markedRows: { type: Object },
    };
  }

  constructor() {
    super();
    this.pagination = new Pagination(1, 5000, 'ts', 'asc');
    this.selTrade = {};
    this.markedRows = new Set();

    this.storeSubscribe([
      'settings',
      'srcConnections'
    ]);
  }

  get table() {
    if (this._table === undefined) {
      this._table = this.shadowRoot.querySelector('tp-table');
    }
    
    return this._table;
  }

  shouldUpdate(changes) {
    super.shouldUpdate(changes);
    return this.settings !== undefined;
  }

  firstUpdated() {
    super.firstUpdated();

    this.setColumns();
    this.table.renderItem = this.renderItem.bind(this);
    this.fetchTrades();
  }

  storeUpdated(key, newValue, targetProperty) {
    super.storeUpdated(key, newValue, targetProperty);
  
    if (key === 'settings') {
      this.setColumns();
      const pagS = this.settings.trades.pagination;
      this.pagination.setPage(pagS.page);

      if (pagS.sort[0] === '-') {
        this.pagination.updateSort(pagS.sort.substring(1), 'desc');
      } else {
        this.pagination.updateSort(pagS.sort, 'asc');
      }
      
      this.pagination.setLimit(pagS.limit);

      this.defaultOptions = {
        date: { dateFormat: getLocalDateFormat(), timeZone: this.settings.timeZone }
      };
    }

    this.filterFields = [
      { name: 'ts', label: 'Date', type: 'date' },
      { name: 'account', label: 'Account', type: 'text' },
      { name: 'txId', label: 'Tx-ID', type: 'text' },
      { name: 'ticker', label: 'Ticker', type: 'text' },
      { name: 'asset', label: 'Asset', type: 'text' },
      { name: 'quote', label: 'Quote', type: 'text' },
      { name: 'price', label: 'Price', type: 'number' },
      { name: 'priceC', label: 'Price C', type: 'number' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'value', label: 'Value', type: 'number' },
      { name: 'fee', label: 'Fee', type: 'number' },
      { name: 'feeC', label: 'Fee C', type: 'number' },
      { name: 'quoteFee', label: 'Quote Fee', type: 'number' },
      { name: 'quoteFeeC', label: 'Quote Fee C', type: 'number' },
      { name: 'side', label: 'Side', type: 'enum', enums: [ { value: 'buy', label: 'Buy' }, { value: 'sell', label: 'Sell' } ] }
    ];
  }

  setColumns() {
    this.columns = this.settings.trades.columns;
  }

  onMsg(msg) {
    if (msg.event === 'record-edited') {
      const idx = this.items.findIndex(rec => rec._id === msg.data._id);

      if (idx === -1) {
        this.items = [ msg.data, ...this.items ];
      } else {
        this.items[idx] = msg.data;
        this.items = [ ...this.items ];
      }
    }
  }

  renderItem(item, idx, columns) {
    return html`
      <trade-row
        exportparts="cell,odd,row"
        item
        ?marked=${this.markedRows.has(item._id)}
        .index=${idx}
        .item=${item}
        .selectable=${this.selectable}
        .columns=${columns}
        @selection-changed=${e => this._selectionChanged(e)}>
      </trade-row>
    `;
  }

  async fetchTrades() {
    this.table.sorting = { column: this.pagination.sortBy, direction: this.pagination.sortDir };
    const resp = await this.post('/trades/page', this.pagination.value, true);
    this.items = resp.data.items;
    this.pageStats = resp.data;
    this.settings.trades.pagination = this.pagination.value;
    this.post('/settings/save', this.settings);
  }

  /**
   * @param {MouseEvent} e 
   */
  tableDoubleClick(e) {
    for (const el of e.composedPath()) {
      if (el.hasAttribute && el.getAttribute('part') === 'cell') {
        this.selTrade = {};
        setTimeout(() => {
          this.selTrade = closest(el, 'trade-row', true).item;
        }, 0);
        this.$.tradeEditorDialog.show();
      }
    }
  }

  applyFilter(e) {
    this.pagination.setFilter(e.detail);
    this.activeFilter = e.detail;
    this.fetchTrades();
  }

  sortingChanged(e) {
    this.pagination.updateSort(e.detail.column, e.detail.direction);
    this.fetchTrades();
  }

  colWidthChanged(e) {
    this.settings.trades.columns = e.detail;
    this.post('/settings/save', this.settings);
  }

  nextPage() {
    this.pagination.nextPage();
    this.fetchTrades();
  }

  prevPage() {
    this.pagination.prevPage();
    this.fetchTrades();
  }

  goto(e) {
    this.pagination.setPage(e.detail.page);
    this.pagination.setLimit(e.detail.limit);
    this.fetchTrades();
  }

  showTxEditor() {
    this.selTrade = {};
    this.$.tradeEditorDialog.show();
  }

  toggleRowMark(e) {
    const id = e.detail;
    if (this.markedRows.has(id)) {
      this.markedRows.delete(id);
    } else {
      this.markedRows.add(id);
    }
    this.table.requestUpdate();
  }

  async deleteFilteredTrades() {
    const resp = await this.post('/trades/delete', { filter: this.pagination.value.filter }, true);
    const btn = this.$.deleteFilteredDialog.querySelector('tp-button.danger');
    btn.showSpinner();

    if (resp.result) {
      btn.showSuccess();
      this.$.deleteFilteredDialog.close();
      this.fetchTrades();
    } else {
      btn.showError();
    }
  }
}

window.customElements.define('the-trades', TheTrades);