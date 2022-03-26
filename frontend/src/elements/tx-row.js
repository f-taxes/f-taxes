/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import TpTableItem from './tp-table/tp-table-item';
import './cells/txid-cell.js';
import { formatTs } from '../helpers/time.js';
import { html } from 'lit';
import { Store } from '@tp/tp-store/store';

class TxRow extends Store(TpTableItem) {
  renderColumn(column, item) {
    if (!item) return;
    const srcCon = this.srcConnectionsMap.get(item['source']);
    
    switch (column.name) {
      case 'currency':
        return html`<div part="cell">${formatTs(item[column.name], this.settings?.dateTimeFormat)}</div>`;
      case 'date':
        return html`<div part="cell">${formatTs(item[column.name], this.settings?.dateTimeFormat)}</div>`;
      case 'txId':
        return html`<txid-cell part="cell" .txid=${item[column.name]} .srcCon=${srcCon}></txid-cell>`;
      case 'source':
        return html`<div part="cell">${srcCon.label}</div>`;
      default:
        return html`<div part="cell">${item[column.name]}</div>`;
    }
  }

  constructor() {
    super();

    this.storeSubscribe([
      'settings',
      'srcConnectionsMap'
    ]);
  }

  shouldUpdate(changes) {
    super.shouldUpdate(changes);
    return this.settings !== undefined && this.srcConnectionsMap !== undefined;
  }
}

window.customElements.define('tx-row', TxRow);