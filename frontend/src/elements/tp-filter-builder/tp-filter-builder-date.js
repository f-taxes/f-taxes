/**
@license
Copyright (c) 2022 trading_peter
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

class TpFilterBuilderDate extends FilterBuilderField(LitElement) {
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
    const { field, fields, filter, lists, popupSelector } = this;
    const dateFormat = this.options.dateFormat;
    const tz = this.options.timeZone || 'UTC';
    const { from, to } = this.value || {};

    console.log(this.value);

    return html`
      <tp-form>
        <form class="wrap">
          ${popupSelector ? html`
            <tp-filter-builder-field-selector name="field" class="field" .items=${fields}></tp-filter-builder-field-selector>
          ` : html`
            <tp-dropdown class="field" name="field" .default=${(fields[0] || {}).value} .value=${field} .items=${fields} @value-changed=${e => this.updateValue('selection', e.detail)}></tp-dropdown>
          `}
          <tp-dropdown class="filter" name="filter" .default=${(lists.filter[0] || {}).value} .value=${filter} .items=${lists.filter} @value-changed=${e => this.updateValue('filter', e.detail)}></tp-dropdown>
          <tp-date-input name="from" minYear="100" class="from" .format=${dateFormat} .timeZone=${tz} value=${from} @value-changed=${e => this.from = e.detail}></tp-date-input>
          ${filter === 'between' ? html`
            <tp-date-input name="to" minYear="100" .format=${dateFormat} value=${to} .timeZone=${tz} @value-changed=${e => this.to = e.detail}></tp-date-input>
          ` : null}
          <div class="remove" @click=${this._removeFilterField}>
            <tp-icon .icon=${TpFilterBuilderDate.iconRemove} tooltip="Remove this filter"></tp-icon>
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
      popupSelector: { type: Boolean },
      lists: { type: Object },
      from: { type: String },
      to: { type: String },
    };
  }

  constructor() {
    super();
    this.type = 'date';

    this.lists = {
      filter: [
        { value: 'is', label: 'is' },
        { value: 'after', label: 'after' },
        { value: 'before', label: 'before' },
        { value: 'between', label: 'between' },
      ]
    };
  }

  shouldUpdate(changes) {
    super.shouldUpdate(changes);

    if (changes.has('from') || changes.has('to')) {
      this._datesChanged();
    }

    return true;
  }

  _datesChanged() {
    if (this.filter === 'between') {
      this.value = {
        from: this.from,
        to: this.to
      };
    } else {
      this.value = {
        from: this.from
      };
    }

    this.updateValue('value', this.value);
  }

  _setDates(value) {
    if (!value) {
      this.from = null;
      this.to = null;
      return;
    }

    if (typeof value === 'string') {
      this.from = value;
    } else {
      this.from = value.from;
      this.to = value.to;
    }
  }

  _removeFilterField() {
    this.dispatchEvent(new CustomEvent('remove-filter-field', { detail: null, bubbles: true, composed: true }));
  }
}

window.customElements.define('tp-filter-builder-date', TpFilterBuilderDate);