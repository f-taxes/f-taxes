/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import { LitElement, html, css, svg } from 'lit';
import { debounce } from '@tp/helpers/debounce';
import './tp-filter-builder-text.js';
import './tp-filter-builder-number.js';
import './tp-filter-builder-enum.js';
import './tp-filter-builder-date.js';

/*
Build filter queries using a simple GUI.

## Data structure

```json
[ // "OR" collection
  [ // "AND" collection
    { "field": "name", "type": "string", "filter": "contains|equals|startsWith|endsWith", "value": "foo", "not": true|false },
    { "field": "name", "type": "enum", "filter": "is|not", "value": "foo" },
    { "field": "name", "type": "date", "filter": "is|before|after|between", "value": { "from": "ISODateString", "to": "ISODateString" } | "ISODateString" },
  ],
  [ // "AND" collection
    { "field": "birthday", "type": "date", "filter": "equals|before|after|between", "value": "01/01/2000"|["01/01/2000", "01/01/2005"], "not": true|false },
    { "field": "age", "type": "number", "filter": "in|gte|lte", "value": 15|[15, 18]|[30, 40, 50, 60, 75], "not": true|false },
  ]
]
```
*/

const mixins = [
  
];

const BaseElement = mixins.reduce((baseClass, mixin) => {
  return mixin(baseClass);
}, LitElement);

class TpFilterBuilder extends BaseElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
        }

        [hidden] {
          display: none !important;
        }

        .groups {
          overflow-x: auto;
          overflow-y: hidden;
        }

        .add-filter,
        .add-filter-group,
        .clear-filters {
          display: flex;
          flex-direction: row;
          align-items: center;
          background: var(--tp-filter-builder-bg);
          border-radius: 4px;
          padding: 4px 8px;
          margin-left: 10px;
          cursor: pointer;

          --tp-icon-width: 17px;
          --tp-icon-height: 17px;
        }

        .add-filter tp-icon,
        .add-filter-group tp-icon,
        .clear-filters tp-icon {
          margin-left: 5px;
        }

        .add-filter:hover,
        .add-filter:focus,
        .add-filter-group:hover,
        .add-filter-group:focus,
        .clear-filters:hover,
        .clear-filters:focus {
          background: var(--tp-filter-builder-bg-hover);
          color: var(--tp-filter-builder-color-hover);
          --tp-filter-builder-icon-color: var(--tp-filter-builder-color-hover);
        }

        .add-filter-group,
        .clear-filters {
          margin: 0;
        }

        .or-group,
        .and-group {
          display: flex;
          flex-direction: row;
          align-items: center;
        }

        .or-group {
          padding-bottom: 10px;
        }

        .or,
        .and {
          display: inline-block;
          padding: 0 10px;
        }

        .and:last-of-type {
          display: none;
        }

        .actions {
          display: flex;
          flex-direction: row;
        }

        .actions > * {
          margin-right: 10px;
        }
      `
    ];
  }

  render() {
    const { filters, popupSelector } = this;

    return html`
      <div class="grid" @remove-filter-field=${this._removeFilterField} @updated=${this._filterFieldUpdated}>
        <div class="groups">
          ${filters.map((andGroup, aidx) => html`
            <div class="or-group">
              <div class="or" ?hidden=${!aidx}>or</div>

              <div class="and-group">
                ${andGroup.map((settings, fidx) => html`
                  ${settings.type === 'text' ? html`
                    <tp-filter-builder-text part="text-filter" .aidx=${aidx} .fidx=${fidx} .popupSelector=${popupSelector} @field-changed=${this._fieldChanged} .fields=${this._fieldList} .field=${settings.field} .filter=${settings.filter} .options=${settings.options} .value=${settings.value}></tp-filter-builder-text>
                  ` : null}

                  ${settings.type === 'number' ? html`
                    <tp-filter-builder-number .aidx=${aidx} .fidx=${fidx} .popupSelector=${popupSelector} @field-changed=${this._fieldChanged} .fields=${this._fieldList} .field=${settings.field} .filter=${settings.filter} .options=${settings.options} .value=${settings.value}></tp-filter-builder-number>
                  ` : null}

                  ${settings.type === 'duration' ? html`
                    <tp-filter-builder-duration .aidx=${aidx} .fidx=${fidx} .popupSelector=${popupSelector} @field-changed=${this._fieldChanged} .fields=${this._fieldList} .field=${settings.field} .filter=${settings.filter} .options=${settings.options} .value=${settings.value}></tp-filter-builder-duration>
                  ` : null}

                  ${settings.type === 'enum' ? html`
                    <tp-filter-builder-enum .aidx=${aidx} .fidx=${fidx} .popupSelector=${popupSelector} @field-changed=${this._fieldChanged} .fields=${this._fieldList} .field=${settings.field} .filter=${settings.filter} .enums=${this._getEnum(settings.field)} options=${settings.options} .value=${settings.value}></tp-filter-builder-enum>
                  ` : null}

                  ${settings.type === 'bool' ? html`
                    <tp-filter-builder-bool .aidx=${aidx} .fidx=${fidx} .popupSelector=${popupSelector} @field-changed=${this._fieldChanged} .fields=${this._fieldList} .field=${settings.field} .filter=${settings.filter} .options=${settings.options} .value=${settings.value}></tp-filter-builder-bool>
                  ` : null}

                  ${settings.type === 'date' ? html`
                    <tp-filter-builder-date .aidx=${aidx} .fidx=${fidx} .popupSelector=${popupSelector} @field-changed=${this._fieldChanged} .fields=${this._fieldList} .field=${settings.field} .filter=${settings.filter} .options=${settings.options} .value=${settings.value}></tp-filter-builder-date>
                  ` : null}

                  ${fidx < andGroup.length - 1 ? html`
                    <div class="and">and</div>
                  ` : null}
                `)}

                <div class="add-filter" @click=${() => this._addFilterField(andGroup, aidx)}>
                  <span>and</span>
                  <tp-icon .icon=${TpFilterBuilder.iconAdd} tooltip="Add Field"></tp-icon>
                </div>
              </div>

            </div>
          `)}
        </div>

        <div class="actions">
          <div class="add-filter-group" @click=${this._addOrGroup}>
            <span>${filters.length > 0 ? 'Add Or-Group' : 'Add Filter'}</span>
            <tp-icon .icon=${TpFilterBuilder.iconAdd} tooltip="Add new 'Or' filter group"></tp-icon>
          </div>
          ${filters.length > 0 ? html`
            <div class="clear-filters" @click=${this._clearAllFilters}>
              <span>Clear</span>  
              <tp-icon .icon=${TpFilterBuilder.iconRemove} tooltip="Clear all filters"></tp-icon>
            </div>
          ` : null}
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }

  static get iconAdd() {
    return svg`<path fill="var(--tp-filter-builder-icon-color)" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z">`;
  }

  static get iconRemove() {
    return svg`<path fill="var(--tp-filter-builder-icon-color)" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z">`;
  }

  constructor() {
    super();
    this.fields = [];
    this.filters = [];
    this.popupSelector = false;

    this.defaultFilters = {
      text: 'contains',
      number: 'in',
      duration: 'in',
      enum: 'is',
      date: 'is'
    };

    this.defaultOptions = {
      text: {},
      number: {},
      duration: { baseYear: new Date().getFullYear() },
      enum: {},
      bool: {},
      date: { dateFormat: 'MM-dd-y' }
    };

    this._update = debounce(this._update.bind(this), 100);
  }

  static get properties() {
    return {
      // The fields that can be filtered.
      // Supply a collection of object with the format:
      // ```json
      // [
      // 	 { "name": "name-of-field", "label": "Label for the field", "type": "text|date|number|enum", "enum": [ {"value": "value1", "label", "Value 1"} ]}
      // ]
      // ```
      fields: { type: Array },

      // Holds filters. See docs for structure.
      filters: { type: Array },

      popupSelector: { type: Boolean },

      defaultFilters: { type: Object },

      defaultOptions: { type: Object },

      _fieldList: { type: Array }
    };
  }

  updated(changes) {
    if (changes.has('fields')) {
      var list = [];
      for (var i = 0, li = this.fields.length; i < li; ++i) {
        var field = this.fields[i];
        list.push({
          value: field.name,
          label: field.label,
          category: field.category
        });
      }
      this._fieldList = list;
    }
  }

  _addOrGroup() {
    if (this.fields.length === 0) {
      return;
    }

    this.filters.push([ {
      field: this.fields[0].name,
      type: this.fields[0].type,
      filter: this.defaultFilters[this.fields[0].type],
      options: this.defaultOptions[this.fields[0].type] || {}
    } ]);

    this.requestUpdate('filters');
  }

  _clearAllFilters() {
    this.filters = [];
    this.dispatchEvent(new CustomEvent('filters-cleared', { detail: null, bubbles: true, composed: true }));
  }

  _getEnum(field) {
    if (!this.fields) {
      return [];
    }

    var idx = this.fields.findIndex(f => f.name === field);
    if (idx > -1) {
      return this.fields[idx].enums || [];
    }

    return [];
  }

  _addFilterField(andGroup, aidx) {
    if (this.fields.length === 0) {
      return;
    }

    // Add filter to "and" group.
    if (andGroup) {
      this.filters[aidx].push({
        field: this.fields[0].name,
        type: this.fields[0].type,
        filter: this.defaultFilters[this.fields[0].type],
        options: this.defaultOptions[this.fields[0].type] || {},
      });

      this.requestUpdate('filters');
    }
  }

  _removeFilterField(e) {
    const filterField = e.target;
    this.filters[filterField.aidx].splice(filterField.fidx, 1);

    // Remove and group if no field left.
    if (this.filters[filterField.aidx].length === 0) {
      this.filters.splice(filterField.aidx, 1);
    }

    this.filters = [ ...this.filters ];
    this._update();
  }
  
  _filterFieldUpdated(e) {
    const filterField = e.target;
    const curType = e.detail.type;
    const fieldObj = this.fields.find(f => f.name === e.detail.field);

    if (curType != fieldObj.type) {
      this.filters[filterField.aidx][filterField.fidx] = {
        field: fieldObj.name,
        type: fieldObj.type,
        options: this.defaultOptions[fieldObj.type] || {},
      };
    } else {
      this.filters[filterField.aidx][filterField.fidx] = e.detail;
    }

    this.requestUpdate('filters');
    this._update();
  }
  
  _update() {
    const filters = [];

    for (let i = 0, li = this.filters.length; i < li; ++i) {
      const grp = this.filters[i];
      const fAndGrp = grp.filter(f => f.value !== undefined && f.value !== '');
      
      if (fAndGrp.length > 0) {
        filters.push(fAndGrp);
      }
    }

    this.dispatchEvent(new CustomEvent('filters-changed', { detail: filters, bubbles: true, composed: true }));
  }
}

window.customElements.define('tp-filter-builder', TpFilterBuilder);