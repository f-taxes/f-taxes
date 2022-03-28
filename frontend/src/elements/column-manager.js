/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-sortable/tp-sortable.js';
import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { Store } from '@tp/tp-store/store';
import icons from '../icons';
import shared from '../styles/shared.js';
import { fetchMixin } from '@tp/helpers/fetch-mixin';

class ColumnManager extends Store(fetchMixin(LitElement)) {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: block;
          padding: 10px;
        }

        .list {
          max-height: 300px;
          overflow-y: auto;
          padding-right: 10px;
        }

        .list > div {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 5px;
          background: var(--bg0);
        }

        .list > div + div {
          margin-top: 5px;
        }

        .list > div > div {
          padding: 0 10px;
          flex: 1;
        }

        .handle {
          cursor: move; 
        }

        tp-icon {
          --tp-icon-width: 18px;
          --tp-icon-height: 18px;
        }

        .visible {
          --tp-icon-color: var(--hl2);
        }
        
        .visible[active] {
          --tp-icon-color: var(--hl1);
        }
      `
    ];
  }

  render() {
    const { columns, colSettings } = this;

    return html`
      <tp-sortable @sorting-changed=${this.sort}>
          <div class="list scrollbar" slot="list">
            ${repeat(columns, col => col.name, col => {
              const colS = colSettings.get(col.name);
              const visible = colS ? colS.visible : col.visible;

              return html`
                <div class="col" .col=${col.name} .visible=${col.required || visible}>
                  <tp-icon class="handle" .icon=${icons['dot-grid']}></tp-icon>
                  <div>${col.label}</div>
                  ${!col.required ? html`
                    <tp-icon class="visible" ?active=${visible} .icon=${icons.eye} @click=${() => this.toggle(col, !visible)}></tp-icon>
                  ` : null}
                </div>
              `;
            })}
          </div>
        </tp-sortable>
    `;
  }

  static get properties() {
    return {
      columns: { type: Array },
      colSettings: { type: Map },
      settingsKey: { type: String },
      settings: { type: Object },
    };
  }

  constructor() {
    super();

    this.storeSubscribe([
      'settings'
    ]);
  }

  shouldUpdate(changes) {
    console.log(this.columns);
    if (changes.has('settingsKey') || changes.has('columns') || changes.has('settings')) {
      if (this.settingsKey && this.settings && this.columns) {
        this.colSettings = new Map();
  
        this.settings[this.settingsKey].columns.forEach(settings => {
          this.colSettings.set(settings.name, settings)
        });
      }
    }

    return this.columns !== undefined && this.colSettings !== undefined;
  }

  toggle(col, visible) {
    const colS = this.colSettings.get(col.name) || {};
    colS.visible = visible;
    this.colSettings.set(col.name, colS);
    this.requestUpdate('colSettings');
    setTimeout(() => {
      this.saveSettings();
    }, 0);
  }

  sort(e) {
    const oldIdx = e.detail.oldIndex;
    const newIdx = e.detail.newIndex;
    let origColS = this.settings[this.settingsKey].columns;

    if (newIdx >= origColS.length) {
      var k = newIdx - origColS.length + 1;
      while (k--) {
          origColS.push(undefined);
      }
    }
    origColS.splice(newIdx, 0, origColS.splice(oldIdx, 1)[0]);

    this.settings[this.settingsKey].columns = origColS;
    this.post('/settings/save', this.settings);
  }

  saveSettings() {
    const colSettings = Array.from(this.shadowRoot.querySelectorAll('.col')).map(el => ({ name: el.col, visible: el.visible }));

    const origColS = this.settings[this.settingsKey].columns;
    const newS = [];

    for (let i = 0, li = colSettings.length; i < li; ++i) {
      const colS = colSettings[i];
      const oColS = origColS.find(c => c.name === colS.name);
      newS.push(Object.assign(oColS, colS));
    }

    this.settings[this.settingsKey].columns = newS;
    this.post('/settings/save', this.settings);
  }
}

window.customElements.define('column-manager', ColumnManager);