/**
@license
Copyright (c) 2021 EDV Wasmeier
*/

import '@tp/tp-checkbox/tp-checkbox.js';
import { LitElement, html, css } from 'lit';
import { DomQuery } from '@tp/helpers/dom-query.js';

/**
# ef-base-table-item

## Example
```html
<ef-base-table-item></ef-base-table-item>
```

*/

const mixins = [
  DomQuery
];

/* @litElement */
const BaseElement = mixins.reduce((baseClass, mixin) => {
  return mixin(baseClass);
}, LitElement);

class TpTableItem extends BaseElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
          padding: 0;
        }

        .wrap {
          display: grid;
          grid-template-columns: 0.5fr 3fr 0.5fr 0.5fr 0.5fr; /* Overridden by javascript */
          align-items: center;
        }

        [part="cell"] {
          align-self: stretch;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 10px 20px;
          border-right: solid 1px #c1c1c1;
        }

        .wrap > div.chk {
          border-right: none;
        }
      `
    ];
  }

  render() {
    const { columns, item } = this;

    return html`
      <div id="grid" class="wrap" part="row">
        ${this.selectable ? html`
          <div class="chk">
            <tp-checkbox id="selectionChk" @click=${this._updateSelectionState}></tp-checkbox>
          </div>
        ` : null}
        ${Array.isArray(columns) ? columns.map(column => {
          if (column.visible !== true && column.required !== true) return;
            return this.renderColumn(column, item) || null;
          }) : null
        }
      </div>
    `;
  }

  static get properties() {
    return {
      index: { type: Array },
      item: { type: Object },
      columns: { type: Array },
      selectable: { type: Boolean },
    };
  }

  renderColumn(column, item) {
    return html`<div part="cell">${item[column.name]}</div>`;
  }

  async updated(changes) {
    if (changes.has('item') && this.selectable) {
      this.$.selectionChk.checked = Boolean(this.item.__selected__);
    }

    if (changes.has('columns') && Array.isArray(this.columns)) {
      let colWidths = this.columns.filter(col => col.required || col.visible).map(col => col.width).join(' ');

      if (this.selectable) {
        colWidths = '40px ' + colWidths;
      }

      this.$grid.style.gridTemplateColumns = colWidths;
    }

    if (changes.has('index')) {
      if (this.index % 2 === 0) {
        this.part.add('odd');
      } else {
        this.part.remove('odd');
      }
    }
  }

  get $grid() {
    if (this.__$grid) {
      return this.__$grid;
    }
    this.__$grid = this.shadowRoot.getElementById('grid');
    return this.__$grid;
  }

  _updateSelectionState(e) {
    const target = e.target;

    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('selection-changed', { detail: { item: this.item, selected: target.checked }, bubbles: true, composed: true }));
    }, 0);
  }
}

window.customElements.define('tp-table-item', TpTableItem);

export default TpTableItem
