/**
@license
Copyright (c) 2024 trading_peter
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
import { parseISO, differenceInSeconds } from 'date-fns';
import { fetchMixin } from '@tp/helpers/fetch-mixin.js';

class TheMenu extends Store(fetchMixin(LitElement)) {
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

        tp-button[warning] {
          background: var(--amber);
          color: var(--text-dark);
        }

        tp-button[warning] tp-icon {
          --tp-icon-color: var(--text-dark);
        }

        .plugin-status-list {
          padding: 10px;
          border-radius: 4px;
        }

        .plugin-status {
          display: flex;
          align-items: center;
          padding: 4px 10px;
          color: var(--white);
        }

        .plugin-status .light {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 15px;
          background: var(--red);
        }

        .plugin-status .light[on] {
          background: var(--green);
        }

        .plugin-status .name {
          opacity: 0.5;
        }

        .plugin-status .name[on] {
          opacity: 1;
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
    const { items, notifCount, pluginStatus } = this;
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

        <tp-popup>
          <tp-button slot="toggle" class="status only-icon" ?warning=${pluginStatus.offline > 0}>
            <tp-icon .icon=${icons.plugin}></tp-icon>
            <div>${pluginStatus.online || 0} / ${pluginStatus.offline || 0}</div>
          </tp-button>
          <div class="plugin-status-list" slot="content">
            ${pluginStatus.manifests.map(manifest => html`
              <div class="plugin-status">
                <div class="light" ?on=${this.isOnline(manifest)}></div>
                <div class="name" ?on=${this.isOnline(manifest)}>${manifest.label} (${manifest.version})</div>
              </div>
            `)}
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
      pluginStatus: { type: Object },
    };
  }

  constructor() {
    super();
    this.items = [
      { label: 'Trades', path: '/trades', match: /^trades.*/ },
      { label: 'Transfers', path: '/transfers', match: /^transfers.*/ },
      { label: 'Reports', path: '/reports', match: /^reports.*/ },
      { label: 'Plugins', path: '/plugins', match: /^plugins.*/ },
      { label: 'Settings', path: '/settings', match: /^settings.*/ }
    ];

    this.routeParams = [];

    this.pluginStatus = {
      online: 0,
      offline: 0,
      manifests: []
    };

    this.storeSubscribe([
      'routeParams'
    ]);
  }

  connectedCallback() {
    super.connectedCallback();
    
    this.fetchPluginStatus();
    setInterval(() => {
      this.fetchPluginStatus();
    }, 5000);
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

  async fetchPluginStatus() {
    const resp = await this.post('/plugins/list', { onlyInstalled: true });
    
    if (resp.result) {
      this.pluginStatus = {
        online: 0,
        offline: 0,
        manifests: []
      };
      
      for (const manifest of resp.data) {
        this.pluginStatus.manifests.push(manifest);

        if (manifest.lastHeartbeat) {
          const diff = differenceInSeconds(new Date(), parseISO(manifest.lastHeartbeat));
          
          if (diff < 10) {
            this.pluginStatus.online++;
          } else {
            this.pluginStatus.offline++;
          }
        }
      }
    }
  }

  isOnline(manifest) {
    return differenceInSeconds(new Date(), parseISO(manifest.lastHeartbeat)) < 10
  }
}

window.customElements.define('the-menu', TheMenu);