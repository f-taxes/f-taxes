/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import './elements/tp-button.js';
import './elements/tp-icon.js';
import './elements/tp-dialog.js';
import './elements/card-box.js';
import './elements/the-source-form.js';
import { LitElement, html, css } from 'lit';
import shared from './styles/shared.js';
import icons from './icons.js';
import { DomQuery } from './helpers/dom-query.js'
import { fetchMixin } from './helpers/fetch-mixin.js';

class TheSources extends fetchMixin(DomQuery(LitElement)) {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: block;
          flex: 1;
          padding: 20px;
        }

        header {
          display: flex;
          justify-content: space-between;
        }

        .empty {
          padding: 40px;
          text-align: center;
          font-size: 20px;
        }
      `
    ];
  }

  render() {
    const { sources } = this;

    return html`
      <h2>Add your exchange accounts here</h2>
      <card-box>
        <header>
          <h3>You have ${sources.length} sources set up</h3>
          <tp-button @click=${this.startAddSource}>Add <tp-icon .icon=${icons.add}></tp-icon></tp-button>
        </header>
        <div class="list">
          ${sources.length == 0 ? html`
            <div class="empty">Click the "Add"-Button on the top right to add your first source</div>
          ` : null}
        </div>
      </card-box>

      <tp-dialog id="addSourceDialog" showClose>
        <h2>Add source to pull transaction history from</h2>
        <the-source-form @submit=${this.addSource}></the-source-form>
        <div class="buttons-justified">
          <tp-button dialog-dismiss>Cancel</tp-button>
          <tp-button id="addSourceBtn" @click=${() => this.shadowRoot.querySelector('the-source-form').submit()} extended>Add</tp-button>
        </div>
      </tp-dialog>
    `;
  }

  static get properties() {
    return {
      sources: { type: Array },
      items: { type: Array },
      active: { type: Boolean, reflect: true },
    };
  }

  constructor() {
    super();
    this.sources = [];
  }

  startAddSource() {
    this.$.addSourceDialog.show();
  }

  async addSource(e) {
    this.$.addSourceBtn.showSpinner();
    const resp = await this.post('/source/add', e.detail);
    
    if (resp.result) {
      this.$.addSourceBtn.showSuccess();
      this.$.addSourceDialog.close();
    } else {
      this.$.addSourceBtn.showError();
    }
  }
}

window.customElements.define('the-sources', TheSources);