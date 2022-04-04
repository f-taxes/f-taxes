/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-form/tp-form.js';
import '@tp/tp-icon/tp-icon.js';
import '@tp/tp-input/tp-input.js';
import { LitElement, html, css } from 'lit';
import icons from '../icons.js';
import shared from '../styles/shared.js';

class PaginationBar extends LitElement {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: block;
          padding: 20px;
          background: var(--bg1);
        }

        form {
          display: grid;
          grid-template-columns: 150px auto auto auto 1fr;
          grid-column-gap: 40px;
        }

        form > div {
          display: flex;
          flex-direction: row;
          align-items: center;
        }

        div.nav {
          margin-left: 40px;
        }

        div * + * {
          margin-left: 10px;
        }

        .page-counter {
          text-align: center;
        }

        tp-icon {
          padding: 5px;
          border-radius: 4px;
          background: var(--hl2);
          --tp-icon-color: var(--text);
        }

        tp-icon:focus,
        tp-icon:hover {
          background: var(--hl1);
          --tp-icon-color: var(--text-dark);
        }

        form tp-input {
          width: 75px;
          margin: 0 0 0 10px;
          text-align: center;
        }

        .counter {
          text-align: left;
          display: grid;
          grid-template-columns: auto auto;
        }

        .counter > div {
          margin: 0;
        }
      `
    ];
  }

  render() {
    const { stats } = this;

    return html`
      <tp-form @submit=${this.submit}>
        <form>
          <div class="counter">
            <div>Showing:</div><div>${stats.filteredCount}</div>
            <div>Total:</div><div>${stats.totalCount}</div>
          </div>
          <div class="page-counter">
            Page ${stats.page} of ${stats.totalPages}
          </div>
          <div>
            <tp-icon .icon=${icons['chevron-left']} @click=${this.prevPage}></tp-icon>
            <tp-icon .icon=${icons['chevron-right']} @click=${this.nextPage}></tp-icon>
          </div>
          <div>
            Goto Page:
            <tp-input name="page" .value=${stats.page}>
              <input type="number" min="1">
            </tp-input>
            <tp-button submit>Go</tp-button>
          </div>
          <div>
            Per Page:
            <tp-input name="limit" .value=${stats.limit}>
              <input type="number" min="1" max="99999">
            </tp-input>
            <tp-button submit>Set</tp-button>
          </div>
        </form>
      </tp-form>
    `;
  }

  static get properties() {
    return {
      stats: { type: Object },
    };
  }

  shouldUpdate() {
    return this.stats !== undefined;
  }

  prevPage() {
    if (this.stats.page === 1) return;
    this.dispatchEvent(new CustomEvent('prev-page', { detail: null, bubbles: true, composed: true }));
  }
  
  nextPage() {
    if (this.stats.page === this.stats.totalPages) return;
    this.dispatchEvent(new CustomEvent('next-page', { detail: null, bubbles: true, composed: true }));
  }

  submit(e) {
    this.dispatchEvent(new CustomEvent('goto-page', { detail: e.detail, bubbles: true, composed: true }));
  }
}

window.customElements.define('pagination-bar', PaginationBar);