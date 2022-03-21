/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-scroll-threshold/tp-scroll-threshold.js';
import '@lit-labs/virtualizer';
import '@tp/tp-icon/tp-icon.js';
import '@tp/tp-checkbox/tp-checkbox.js';
import './tp-table-item.js';
import { DomQuery } from '@tp/helpers/dom-query.js';
import { closest } from '@tp/helpers/closest.js';
import ColumResizer from './column-resizer.js';
import { LitElement, html, css, svg } from 'lit';

export class TpTable extends DomQuery(LitElement) {
  static get styles() {
    return [
      css`
        :host {
          display: block;
          padding: 20px;
          position: relative;
        }

        [hidden] {
          display: none;
        }

        .wrap {
          overflow-y: auto;
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
        }

        .list {
          position: relative;
          flex: 1;
        }

        #tableHeader {
          display: grid;
          overflow-x: hidden;
        }

        #virtualList,
        .empty-message {
          position: absolute !important;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
        }

        #virtualList {
          height: auto;
        }

        .empty-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        a.sort-link,
        a.no-sort-link {
          text-decoration: none;
          font-weight: bold;
          position: relative;
          border-right: solid 1px #c1c1c1;
          padding: 10px 20px 10px 20px;
          display: flex;
          flex-direction: row;
          overflow: hidden;
          cursor: pointer;
          user-select: none;
        }

        a.sort-link:hover,
        a.no-sort-link:hover {
          border-right: solid 1px #c1c1c1;
        }

        a.sort-link tp-icon {
          position: absolute;
          left: 0;
          --tp-icon-width: 18px;
          --tp-icon-height: 18px;
        }

        div.col-label {
          flex: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .width-handle {
          position: absolute;
          z-index: 1;
          top: 0;
          right: -2px;
          cursor: col-resize;
          width: 6px;
          height: 100%;
        }

        .width-handle > div {
          margin: auto;
          width: 2px;
          height: 100%;
          background: transparent;
        }

        #tableHeader:not(.col-dragging) a.sort-link .width-handle:hover > div {
          background: var(--pc-blue);
        }

        a.sort-link .width-handle.dragging {
          position: fixed;
          height: 300px;
          z-index: 100;
          border-style: none;
          width: 3px;
          background: linear-gradient(180deg, rgba(59, 164, 240, 1), rgba(59, 164, 240, 0));
        }

        .select-col {
          padding: 0px 20px 10px;
        }

        lit-virtualizer {
          overflow-x: hidden;
        }

        lit-virtualizer::-webkit-scrollbar {
          width: 12px;
        }

        lit-virtualizer::-webkit-scrollbar-track {
          background: var(--scrollbar-track);
        }

        lit-virtualizer::-webkit-scrollbar-thumb {
          background-color: var(--scrollbar-thumb);
          outline: none;
          border-radius: var(--scrollbar-thumb-border-radius, 4px);
        }

        [item]:not(.odd) {
          background: var(--table-bg-1);
        }

        [item].odd {
          background: var(--table-bg-2);
        }

        [item]:hover {
          background: var(--table-row-hl);
          --list-columns-h-borders: var(--list-columns-h-borders-hover);
        }
      `
    ];
  }

  render() {
    const columns = this.columns || [];
    const items = this.items || [];

    return html`
      <div class="wrap">
        <div id="tableHeader" part="header" class="list-headline" @track=${this._colResizeTracked}>
          ${this.selectable ? html`
            <div class="select-col"><tp-checkbox @checked-changed=${e => this._checkedChanged(e)}></tp-checkbox></div>
          ` : null}
          ${columns.map(column => this.renderColumnHeader(column))}
        </div>
        <div class="list">
          ${this._emptyMessage}
          <lit-virtualizer id="virtualList" part="list" @scroll=${this._onScroll} scroller .items=${items} .renderItem=${(item, idx) => this.renderItem(item, idx, columns)}></lit-virtualizer>
        </div>

        <tp-scroll-threshold id="threshold" lowerThreshold="40"></tp-scroll-threshold>
      </div>
    `;
  }

  renderColumnHeader(column) {
    if (column.visible !== true && column.required !== true) return null;

    const { name, width, label, sortable } = column;
    const sorting = this.sorting || {};
    const isSortedBy = sorting.column === name;
    const sortDirection = isSortedBy ? sorting.direction : 'desc';
    const canSort = sortable !== false;

    return html`
      <a part="column-label" class="${canSort ? 'sort-link' : 'no-sort-link'}" @click=${() => canSort ? this._sort(column, sortDirection) : null} .type=${name} .width=${width}>
        ${canSort ? html`
          <tp-icon part="sort-icon" .icon=${sortDirection === 'asc' ? TpTable.downIcon : TpTable.upIcon} ?hidden=${!isSortedBy}></tp-icon>
        ` : null}
        <div class="col-label">${label}</div>
        <div class="width-handle" part="width-handle"><div part="width-handle-bar"></div></div>
      </a>
    `;
  }

  static get downIcon() {
    return svg`<path fill="var(--tp-table-icon-color)" d="M7,10L12,15L17,10H7Z">`;
  }

  static get upIcon() {
    return svg`<path fill="var(--tp-table-icon-color)" d="M7,15L12,10L17,15H7Z">`;
  }

  renderItem(item, idx, columns) {
    return html`
      <tp-table-item
        exportparts="cell,odd,row"
        item
        .index=${idx}
        .item=${item}
        .selectable=${this.selectable}
        .columns=${columns}
        @selection-changed=${(e) => this._selectionChanged(e)}>
      </tp-table-item>
    `;
  }

  static get properties() {
    return {
      sorting: { type: Object },
      selectable: { type: Boolean },
      columns: { type: Array },
      _selItems: { type: Array },
      _visibleColumns: { type: Array },
      items: { type: Array },
      _advFilters: { type: Array },
      _advFilterActive: { type: Boolean },
      _advFilterFields: { type: Object },
      _filter: { type: String },
      _totalCount: { type: Number },
    };
  }

  constructor() {
    super();
    this._selItems = [];
  }

  updated(changes) {
    if (changes.has('columns')) {
      this._updateColumns();
    }
  }

  get _emptyMessage() {
    return null;
  }

  get sortingPath() {
    return `${this.dataKey}.sorting`;
  }

  get statusFilterPath() {
    return `${this.dataKey}.filtering.statusFilter`;
  }

  set filter(val) {
    this._advFilterActive = false;
    this._filter = this._clone(val);
    this.reloadPagedList();
  }

  set statusFilter(val) {
    this._statusFilter = this._clone(val);
    this.reloadPagedList();
  }

  set advancedFilter(val) {
    this._advFilterActive = val ? true : false;
    this._advFilters = this._clone(val);
    this.reloadPagedList();
  }

  firstUpdated() {
    this.shadowRoot.querySelector('tp-scroll-threshold').target = this.shadowRoot.querySelector('lit-virtualizer');
    new ColumResizer(this.$.tableHeader, '.width-handle');
  }
  
  _onScroll(e) {
    this.$.tableHeader.style.paddingRight = (this.$.virtualList.offsetWidth - this.$.virtualList.clientWidth) + 'px';
    this.$.tableHeader.scrollLeft = this.$.virtualList.scrollLeft;
  }

  shouldUpdate(changes) {
    if (changes.has('items')) {
      this._updateSelEntries();
    }
    return true;
  }

  _sort(column, direction) {
    if (this._draggedColumn) return;

    this.sorting = { column: column.name, direction: direction === 'asc' ? 'desc' : 'asc' };
    this.dispatchEvent(new CustomEvent('sorting-changed', { detail: this.sorting, bubbles: true, composed: true }));
  }

  _updateColumns() {
    this.$.tableHeader.style.gridTemplateColumns = this._updateColumnWidths(this.selectable ? [ '40px' ] : []).join(' ');
  }

  _updateColumnWidths(prepend) {
    return [ ...(prepend || []), ...this.columns.filter(col => col.required || col.visible).map(col => col.width) ];
  }

  _colResizeTracked(e) {
    const handle = closest(e.target, '.width-handle');
    const data = e.detail;

    if (data.state === 'start') {
      this._draggedColumn = true;
      const rect = handle.getBoundingClientRect();
      document.body.style.userSelect = 'none';
      handle.style.top = `${rect.top}px`;
      handle.style.left = `${rect.left}px`;
      handle.style.transform = `translateX(${data.dx}px)`;
      handle.classList.add('dragging');
      this.$.tableHeader.classList.add('col-dragging');
    } else if (data.state === 'end') {
      document.body.style.userSelect = '';
      handle.classList.remove('dragging');
      handle.style.transform = '';
      handle.style.top = '';
      handle.style.left = '';
      this.$.tableHeader.classList.remove('col-dragging');

      const colLink = closest(handle, 'a');
      const { type, width } = colLink;
      const newWidth = (parseInt(width, 10) + data.dx) + 'px';
      const colDef = this.columns.find(col => col.name === type);
      colDef.width = newWidth;
      this.columns = [...this.columns];

      setTimeout(() => {
        this._draggedColumn = false;
      });
    } else if (data.state === 'track') {
      handle.style.transform = `translateX(${data.dx}px)`;
    }
  }

  clearTriggers() {
    if (this.$.threshold) {
      this.$.threshold.clearTriggers();
    }
  }

  _listOverflows() {
    return this.$.virtualList.scrollHeight > this.$.virtualList.offsetHeight;
  }

  _checkedChanged(e) {
    if (Array.isArray(this.items) === false) return;

    if (e.detail.value) {
      this._selectAll();
    } else {
      this._selectNone();
    }

    this.items = [...this.times];
  }

  _selectAll() {
    this.items.forEach((entry, idx) => {
      this.items[idx].__selected__ = true;
    });

    this._selectionChanged();
  }

  _selectNone() {
    this._items.forEach((entry, idx) => {
      this._items[idx].__selected__ = false;
    });

    this._selectionChanged();
  }

  _selectionChanged(e) {
    if (this.__restoringSelection) return;

    if (e !== undefined) {
      const item = this._items.find(item => item._id === e.detail.item._id);
      item.__selected__ = e.detail.selected;
    }

    this._selItems = this._items.filter(entry => entry.__selected__ === true);
    this.dispatchEvent(new CustomEvent('item-selection-changed', { detail: this._selItems, bubbles: true, composed: true }));
  }

  _updateSelEntries() {
    this._hiddenSelection = 0;

    if (!this._items) {
      this._selItems = [];
    } else {
      this._selItems.forEach(sel => {
        const idx = this._items.findIndex(entry => entry._id === sel._id);
        if (idx > -1) {
          // Suppress rebuild of the selected invoices list.
          // When we restore the selection on a filtered list of invoices we would loose the selection of hidden onces
          // when _selectionChanged is triggered. So we set a flag that the observer is skipped.
          this.__restoringSelection = true;
          this._items[idx].__selected__ = true;
          this.__restoringSelection = false;
        } else {
          this._hiddenSelection++;
        }
      });
    }
  }
}

window.customElements.define('tp-table', TpTable);
