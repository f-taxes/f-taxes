/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import './elements/menu-button.js';
import { LitElement, html, css } from 'lit';
import { Store } from './elements/tp-store/tp-store.js'

class TheMenu extends Store(LitElement) {
  static get styles() {
    return [
      css`
        :host {
          display: flex;
          height: 80px;
          justify-content: space-between;
          padding: 0 20px;
          background: var(--menu-background);
          color: var(--menu-color);
        }

        .title {
          font-weight: bold;
          font-size: 24px;
        }

        .title,
        nav {
          display: flex;
          align-items: center;
        }
      `
    ];
  }

  render() {
    const { items } = this;
    const routeData = this.routeParams.join('-');

    return html`
      <div class="title">F-TAXES</div>
      <nav>
        ${items.map(item => html`
          <menu-button ?active=${item.match.test(routeData)} @click=${() => this.nav(item)}>${item.label}</menu-button>
        `)}
      </nav>
    `;
  }

  static get properties() {
    return {
      items: { type: Array },
      routeParams: { type: Array },
    };
  }

  constructor() {
    super();
    this.items = [
      { label: 'Trades', path: '/trades', match: /^trades.*/ },
      { label: 'Sources', path: '/sources', match: /^sources.*/ }
    ];

    this.routeParams = [];

    this._storeSubscribe([
      'routeParams'
    ]);
  }

  nav(item) {
    this.dispatchEvent(new CustomEvent('trigger-router', { detail: { path: item.path }, bubbles: true, composed: true }));
  }
}

window.customElements.define('the-menu', TheMenu);