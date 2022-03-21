/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-button/tp-button.js';
import '@tp/tp-popup/tp-popup.js';
import './elements/menu-button.js';
import './the-notifications.js';
import icons from './icons';
import { LitElement, html, css } from 'lit';
import { Store } from '@tp/tp-store/store.js'
import shared from './styles/shared.js';

class TheMenu extends Store(LitElement) {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: flex;
          height: 80px;
          justify-content: space-between;
          align-items: center;
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

        tp-popup {
          margin-right: 40px;
        }

        tp-button > div {
          font-size: 20px;
          padding-left: 10px;
        }
      `
    ];
  }

  render() {
    const { items, notifCount } = this;
    const routeData = this.routeParams.join('-');

    return html`
      <div class="title">F-TAXES</div>
      <nav>
        <tp-popup>
          <tp-button slot="toggle" class="only-icon">
            <tp-icon .icon=${icons.bell}></tp-icon>
            <div>${notifCount || 0}</div>
          </tp-button>
          <div slot="content">
            <the-notifications .ws=${this.ws} @notification-count=${e => this.notifCount = e.detail}></the-notifications>
          </div>
        </tp-popup>
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
      ws: { type: Object },
      notifCount: { type: Number },
    };
  }

  constructor() {
    super();
    this.items = [
      { label: 'Transactions', path: '/transactions', match: /^transactions.*/ },
      { label: 'Sources', path: '/sources', match: /^sources.*/ },
      { label: 'Settings', path: '/settings', match: /^settings.*/ }
    ];

    this.routeParams = [];

    this.storeSubscribe([
      'routeParams'
    ]);
  }

  nav(item) {
    this.dispatchEvent(new CustomEvent('trigger-router', { detail: { path: item.path }, bubbles: true, composed: true }));
  }
}

window.customElements.define('the-menu', TheMenu);