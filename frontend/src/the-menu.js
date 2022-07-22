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

        .logo {
          display: flex;
          justify-content: center;
        }

        .logo img {
          margin-right: 20px;
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

        .unread {
          background: var(--red);
        }

        .wiggle {
          animation: wiggle;
          animation-duration: 500ms;
          animation-iteration-count: 3;
          animation-timing-function: ease-in-out;
        }

        @keyframes wiggle {
          0% {transform: rotate(10deg);}
          25% {transform: rotate(-10deg);}
          50% {transform: rotate(20deg);}
          75% {transform: rotate(-5deg);}
          100% {transform: rotate(0deg);}
        }
      `
    ];
  }

  render() {
    const { items, notifCount } = this;
    const routeData = this.routeParams.join('-');

    return html`
      <div class="logo">
        <img src="/assets/img/logo_48x48.png" alt="F-TAXES Logo" width="48" height="48">
        <div class="title">F-TAXES</div>
      </div>
      <nav>
        <tp-popup>
          <tp-button slot="toggle" class="notifs only-icon" @click=${e => this.shadowRoot.querySelector('.notifs').classList.remove('unread')}>
            <tp-icon .icon=${icons.bell}></tp-icon>
            <div>${notifCount || 0}</div>
          </tp-button>
          <div slot="content">
            <the-notifications .ws=${this.ws} @notification-count=${this.updateNotifCount}></the-notifications>
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
      { label: 'Plugins', path: '/plugins', match: /^plugins.*/ },
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

  updateNotifCount(e) {
    const newCount = e.detail;

    if (newCount > this.notifCount) {
      const btn = this.shadowRoot.querySelector('.notifs');
      btn.classList.add('wiggle');
      btn.classList.add('unread');
      
      setTimeout(() => {
        btn.classList.remove('wiggle');
      }, 10000);
    }

    this.notifCount = newCount;
  }
}

window.customElements.define('the-menu', TheMenu);