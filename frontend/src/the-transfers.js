/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-popup/tp-popup.js';
import '@tp/tp-popup/tp-popup-menu.js';
import '@tp/tp-popup/tp-popup-menu-item.js';
import '@tp/tp-table/tp-table.js';
import '@tp/tp-dialog/tp-dialog.js';
import '@tp/tp-date-input/tp-date-input.js';
import './elements/column-manager.js';
import './elements/pagination-bar.js';
import './elements/transfer-row.js';
import './elements/transfer-editor.js';
import './elements/tp-filter-builder/tp-filter-builder.js';
import './elements/cb-options.js';
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

class TheTransfers extends BaseElement {
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
          <tp-filter-builder .fields=${filterFields} .defaultOptions=${defaultOptions} @filters-changed=${this.applyFilter}></tp-filter-builder>
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
            </tp-popup-menu>
          </tp-popup>

          <tp-popup halign="right">
            <tp-icon slot="toggle" tooltip="Edit columns" .icon=${icons.columns}></tp-icon>
            <column-manager slot="content" settingsKey="transfers" .columns=${columns}></column-manager>
          </tp-popup>
        </div>
      </div>
      <tp-table
        .columns=${columns}
        .items=${items}
        @dblclick=${this.tableDoubleClick}
        @sorting-changed=${e => this.sortingChanged(e)}
        @column-width-changed=${e => this.colWidthChanged(e)}>
      </tp-table>
      <pagination-bar .stats=${pageStats} @next-page=${this.nextPage} @prev-page=${this.prevPage} @goto-page=${this.goto}></pagination-bar>

      <tp-dialog id="transferEditorDialog">
        <transfer-editor .transfer=${this.selTransfer}></transfer-editor>
      </tp-dialog>

      <tp-dialog id="costBasisDialog">
        <cb-options .ws=${ws} target="transfers"></cb-options>
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
      selTransfer: { type: Object },
    };
  }

  constructor() {
    super();
    this.pagination = new Pagination(1, 5000, 'ts', 'asc');
    this.selTransfer = {};

    this.storeSubscribe([
      'settings',
      'srcConnections'
    ]);
  }

  shouldUpdate(changes) {
    super.shouldUpdate(changes);
    return this.settings !== undefined;
  }

  firstUpdated() {
    super.firstUpdated();

    this.columns = this.settings.transfers.columns;
    this.shadowRoot.querySelector('tp-table').renderItem = this.renderItem.bind(this);
    this.fetchTransfers();
  }

  storeUpdated(key, newValue, targetProperty) {
    super.storeUpdated(key, newValue, targetProperty);
  
    if (key === 'settings') {
      this.columns = this.settings.transfers.columns;
      const pagS = this.settings.transfers.pagination;
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
      { name: 'asset', label: 'Asset', type: 'text' },
      { name: 'feeCurrency', label: 'Fee Currency', type: 'text' },
      { name: 'action', label: 'Action', type: 'enum', enums: [ { value: 'deposit', label: 'Deposit' }, { value: 'withdrawal', label: 'Withdrawal' } ] }
    ];
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
      <transfer-row
        exportparts="cell,odd,row"
        item
        .index=${idx}
        .item=${item}
        .selectable=${this.selectable}
        .columns=${columns}
        @selection-changed=${e => this._selectionChanged(e)}>
      </transfer-row>
    `;
  }

  async fetchTransfers() {
    this.shadowRoot.querySelector('tp-table').sorting = { column: this.pagination.sortBy, direction: this.pagination.sortDir };
    const resp = await this.post('/transfers/page', this.pagination.value, true);
    this.items = resp.data.items;
    this.pageStats = resp.data;
    this.settings.transfers.pagination = this.pagination.value;
    this.post('/settings/save', this.settings);
  }

  /**
   * @param {MouseEvent} e 
   */
  tableDoubleClick(e) {
    for (const el of e.composedPath()) {
      if (el.hasAttribute && el.getAttribute('part') === 'cell') {
        this.selTransfer = {};
        setTimeout(() => {
          this.selTransfer = closest(el, 'transfer-row', true).item;
        }, 0);
        this.$.transferEditorDialog.show();
      }
    }
  }

  applyFilter(e) {
    this.pagination.setFilter(e.detail);
    this.fetchTransfers();
  }

  sortingChanged(e) {
    this.pagination.updateSort(e.detail.column, e.detail.direction);
    this.fetchTransfers();
  }

  colWidthChanged(e) {
    this.settings.transfers.columns = e.detail;
    this.post('/settings/save', this.settings);
  }

  nextPage() {
    this.pagination.nextPage();
    this.fetchTransfers();
  }

  prevPage() {
    this.pagination.prevPage();
    this.fetchTransfers();
  }

  goto(e) {
    this.pagination.setPage(e.detail.page);
    this.pagination.setLimit(e.detail.limit);
    this.fetchTransfers();
  }

  showTxEditor() {
    this.selTransfer = {};
    this.$.transferEditorDialog.show();
  }
}

window.customElements.define('the-transfers', TheTransfers);