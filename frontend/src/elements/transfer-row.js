/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import TpTableItem from '@tp/tp-table/tp-table-item.js';
import './cells/txid-cell.js';
import './cells/src-cell.js';
import { formatTs } from '../helpers/time.js';
import { html, css } from 'lit';
import { Store } from '@tp/tp-store/store';
import icons from '../icons.js';

const actions = [ 'Deposit', 'Withdrawal' ];

class TransferRow extends Store(TpTableItem) {
  static get styles() {
    return [
      ...TpTableItem.styles,
      css`
        :host([marked]) div[part="cell"] {
          background: var(--rec-marked) !important;
        }

        .tools {
          display: flex;
          flex-direction: row;
          justify-content: center;
        }

        .tools tp-icon {
          --tp-icon-width: 16px;
          --tp-icon-height: 1px;
        }

        .tools tp-icon + tp-icon {
          margin-left: 10px;
        }
      `
    ];
  }

  renderColumn(column, item) {
    if (!item) return;
    
    switch (column.name) {
      case 'tools':
        return html`
          <div class="tools" part="cell">
            <tp-icon .icon=${icons.marker} @click=${this.toggleMark}></tp-icon>
          </div>
        `;
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

  toggleMark() {
    this.dispatchEvent(new CustomEvent('toggle-row-mark', { detail: this.item._id, bubbles: true, composed: true }));
  }
}

window.customElements.define('transfer-row', TransferRow);