/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import TpTableItem from '@tp/tp-table/tp-table-item.js';
import './cells/txid-cell.js';
import './cells/src-cell.js';
import { formatTs } from '../helpers/time.js';
import { html } from 'lit';
import { Store } from '@tp/tp-store/store';

const actions = [ 'Deposit', 'Withdrawal' ];

class TransferRow extends Store(TpTableItem) {
  renderColumn(column, item) {
    if (!item) return;
    
    switch (column.name) {
      case 'ts':
        return html`<div part="cell">${formatTs(item[column.name], this.settings?.dateTimeFormat, this.settings?.timeZone)}</div>`;
      case 'action':
        return html`<div part="cell" .field=${column.name}>${actions[item[column.name]]}</div>`;
      default:
        return html`<div part="cell" .field=${column.name}>${item[column.name]}</div>`;
    }
  }

  constructor() {
    super();

    this.storeSubscribe([
      'settings',
    ]);
  }

  shouldUpdate(changes) {
    super.shouldUpdate(changes);
    return this.settings !== undefined;
  }
}

window.customElements.define('transfer-row', TransferRow);