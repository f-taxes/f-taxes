/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-popup/tp-popup.js';
import '@tp/tp-icon/tp-icon.js';
import { LitElement, html, css, svg } from 'lit';

class TpFilterBuilderFieldSelector extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
        }

        tp-popup {
          display: flex;
          align-items: center;
        }

        tp-icon {
          display: block;
          padding-left: 10px;
          --tp-icon-width: 18px;
          --tp-icon-height: 18px;
        }

        .cat-item {
          display: flex;
          align-items: center;
          height: 30px;
          padding: 0 10px;
          cursor: pointer;
        }

        .cat-item[selected] {
          background: #039BE5;
          color: #ffffff;
        }

        .field-item:hover,
        .cat-item:not([selected]):hover {
          background: #E0F7FA;
        }

        .cat-item > div {
          display: flex;
          align-items: center;
        }

        .cat-item > div:first-child {
          display: flex;
        }

        .field-item {
          line-height: 30px;
          padding: 0 10px;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        [slot="content"] {
          display: flex;
        }

        [slot="content"] > div {
          width: 150px;
          max-width: 150px;
        }
      `
    ];
  }

  render() {
    const { value, items, _cats, _itemsOfCat, _selCat } = this;

    return html`
      <div class="wrap">
        <tp-popup id="popup" halign="left">
          <div slot="toggle">
            <tp-icon .icon=${TpFilterBuilderFieldSelector.iconDown}></tp-icon>
            <span>${this._getLabel(value, items)}</span>
          </div>
          <div slot="content">
            <div>
              ${_cats.map(category => html`
                <div class="cat-item" ?selected=${_selCat === category} @click=${() => this._selCat = category}>
                  <div>${category}</div>
                  <div>
                    <tp-icon .icon=${TpFilterBuilderFieldSelector.iconRight}></tp-icon>
                  </div>
                </div>
              `)}
            </div>
            <div>
              ${_itemsOfCat.map(item => html`
                <div class="field-item" @click=${() => this.value = item}>${item.label}</div>
              `)}
            </div>
          </div>
        </tp-popup>
      </div>
    `;
  }

  static get properties() {
    return {
      // List items to show in the selector popup.
      // Items can be categorized.
      items: { type: Array },

      _cats: { type: Array },

      _selCat: { type: String },

      _itemsOfCat: { type: Array }
    };
  }

  static get iconDown() {
    return svg`<path fill="var(--tp-filter-builder-icon-color, #000000)" d="M7,10L12,15L17,10H7Z" />`;
  }

  static get iconRight() {
    return svg`<path fill="var(--tp-filter-builder-icon-color)" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />`;
  }

  constructor() {
    super();

    this.items = [];
    this._itemsOfCat = [];
    this._cats = [];
  }

  shouldUpdate(changes) {
    if (changes.has('items') && Array.isArray(this.items)) {
      const cats = new Set();
      this.items.forEach(item => {
        if (item.category) {
          cats.add(item.category);
        }
      });

      this._cats = Array.from(cats);
    }

    this._itemsOfCat = this.items.filter(item => item.category === this._selCat);
    console.log(this._itemsOfCat);
    return true;
  }

  _getLabel() {
    return this.items.find(item => item.id === this.value).label;
  }
}

window.customElements.define('tp-filter-builder-field-selector', TpFilterBuilderFieldSelector);