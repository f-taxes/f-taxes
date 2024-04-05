/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-form/tp-form.js';
import '@tp/tp-input/tp-input.js';
import '@tp/tp-dropdown/tp-dropdown.js';
import '@tp/tp-icon/tp-icon.js';
import './tp-filter-builder-field-selector.js';
import { LitElement, html, css, svg } from 'lit';
import { FilterBuilderField } from './tp-filter-builder-field-mixin.js';
import shared from './tp-filter-builder-field-styles.js';

class TpFilterBuilderEnum extends FilterBuilderField(LitElement) {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: block;
        }
      `
    ];
  }

  render() {
    const { field, value, fields, filter, lists, popupSelector, enums } = this;

    return html`
      <tp-form>
        <form class="wrap">
          ${popupSelector ? html`
            <tp-filter-builder-field-selector name="field" class="field" .items=${fields}></tp-filter-builder-field-selector>
          ` : html`
            <tp-dropdown class="field" name="field" .default=${(fields[0] || {}).value} .value=${field} .items=${fields} @value-changed=${e => this.updateValue('selection', e.detail)}></tp-dropdown>
          `}
          <tp-dropdown class="filter" name="filter" .default=${(lists.filter[0] || {}).value} .value=${filter} .items=${lists.filter} @value-changed=${e => this.updateValue('filter', e.detail)}></tp-dropdown>
          <tp-dropdown class="value" name="value" .value=${value} .default=${(enums[0] || {}).value} .items=${enums} @value-changed=${e => this.updateValue('value', e.detail)}></tp-dropdown>
          <div class="remove" @click=${this._removeFilterField}>
            <tp-icon .icon=${TpFilterBuilderEnum.iconRemove} tooltip="Remove this filter"></tp-icon>
          </div>
        </form>
      </tp-form>
    `;
  }

  static get iconRemove() {
    return svg`<path fill="var(--tp-filter-builder-icon-color)" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z">`;
  }

  static get properties() {
    return {
      enums: { type: Array },
      popupSelector: { type: Boolean },
      lists: { type: Object },
    };
  }

  constructor() {
    super();
    this.type = 'enum';

    this.lists = {
      filter: [
        { value: 'is', label: 'is' },
        { value: 'not', label: 'is not' },
      ]
    };
  }

  _removeFilterField() {
    this.dispatchEvent(new CustomEvent('remove-filter-field', { detail: null, bubbles: true, composed: true }));
  }
}

window.customElements.define('tp-filter-builder-enum', TpFilterBuilderEnum);