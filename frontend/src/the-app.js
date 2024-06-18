/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-router/tp-router.js';
import './the-menu.js';
import './elements/job-status.js';
import theme from './styles/theme.js';
import { LitElement, html, css } from 'lit';
import { Store } from '@tp/tp-store/store.js';
import { fetchMixin } from '@tp/helpers/fetch-mixin.js';
import LazyImports from '@tp/helpers/lazy-imports.js'
import WS from './helpers/ws.js';
import icons from './icons.js';
import shared from './styles/shared.js';

class TheApp extends fetchMixin(Store(LitElement)) {
  static get styles() {
    return [
      theme,
      shared,
      css`
        :host {
          display: block;
          position: absolute;
          inset: 0;
        }

        .main {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
        }

        the-404 {
          flex: 1;
        }

        footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg1);
          color: var(--hl1);
          padding: 15px 20px;
          margin-top: 3px;
        }

        footer > div {
          display: flex;
          align-items: center;
        }

        .heart {
          --tp-icon-width: 16px;
          --tp-icon-height: 16px;
        }

        .heart,
        a {
          padding: 0 5px;
        }
      `
    ];
  }

  render() {
    const { routeParams } = this;
    const p = routeParams || [];
    const page = p[0];

    return html`
      <tp-router @data-changed=${this.routeDataChanged}>
        <tp-route path="*" data="404"></tp-route>
        <tp-route path="/" data="home"></tp-route>
        <tp-route path="/trades" data="trades"></tp-route>
        <tp-route path="/transfers" data="transfers"></tp-route>
        <tp-route path="/sources" data="sources"></tp-route>
        <tp-route path="/reports" data="reports"></tp-route>
        <tp-route path="/plugins" data="plugins"></tp-route>
        <tp-route path="/settings" data="settings"></tp-route>
        <tp-route path="/contributors" data="contributors"></tp-route>
      </tp-router>
      
      <div class="main">
        <the-menu .ws=${this.ws}></the-menu>
        ${page === '404' ? html`<the-404></the-404>` : null }
        ${page === 'trades' ? html`<the-trades .active=${page === 'trades'} .ws=${this.ws}></the-trades>` : null }
        ${page === 'transfers' ? html`<the-transfers .active=${page === 'transfers'} .ws=${this.ws}></the-transfers>` : null }
        ${page === 'sources' ? html`<the-sources .active=${page === 'sources'} .ws=${this.ws}></the-sources>` : null }
        ${page === 'reports' ? html`<the-reports .active=${page === 'reports'} .ws=${this.ws}></the-reports>` : null }
        ${page === 'plugins' ? html`<the-plugins .active=${page === 'plugins'} .ws=${this.ws}></the-plugins>` : null }
        ${page === 'settings' ? html`<the-settings .active=${page === 'settings'}></the-settings>` : null }
        ${page === 'contributors' ? html`<the-contributors .active=${page === 'contributors'}></the-contributors>` : null }
        <footer>
          <div>
            F-TAXES - The Free And Open Source Tax Reporting Tool For Crypto
          </div>
          <div>
            <a href="https://github.com/f-taxes/f-taxes" target="_blank">
              <tp-icon .icon=${icons.github}></tp-icon>
            </a>
          </div>
          <div>
            Made with <tp-icon class="heart" .icon=${icons.heart}></tp-icon> by <a href="https://x.com/trading_peter" target="_blank">trading_peter</a> and these awesome <a href="/contributors">contributors</a>
          </div>
        </footer>
      </div>


      <job-status .ws=${this.ws}></job-status>
    `;
  }

  static get properties() {
    return {
      // Data of the currently active route. Set by the router.
      route: { type: String, },

      // Params of the currently active route. Set by the router.
      routeParams: { type: Object },

      // Websocket object
      ws: { type: Object },
    };
  }

  constructor() {
    super();
    this.importer = new LazyImports(
      [
        { match: /^404+/, imports: [
          '/assets/the-404.js'
        ] },
        { match: /trades/, imports: [
          '/assets/the-trades.js'
        ] },
        { match: /transfers/, imports: [
          '/assets/the-transfers.js'
        ] },
        { match: /reports/, imports: [
          '/assets/the-reports.js'
        ] },
        { match: /plugins/, imports: [
          '/assets/the-plugins.js'
        ] },
        { match: /settings/, imports: [
          '/assets/the-settings.js'
        ] },
        { match: /contributors/, imports: [
          '/assets/the-contributors.js'
        ] }
      ]
    );
  }

  firstUpdated() {
    super.firstUpdated();
    this.fetchSettings();
  }

  async connectedCallback() {
    super.connectedCallback();
    this.ws = await this._connectWebsocket();
  }

  routeDataChanged(e) {
    this.route = e.detail;
    this.routeParams = this.route.split('-');
    this.storeWrite('routeParams', this.routeParams);
    this.importer.import([ this.route ]);
  }

  async _connectWebsocket() {
    const ws = new WS();

    ws.onConnect(async () => {
      this.connected = true;
    });

    ws.onDisconnect(() => {
      this.connected = false;
    });

    ws.onMsg(async msg => {
      if (msg.event === 'app-settings-updated') {
        this.fetchSettings();
      }
    })

    await ws.connect();
    return ws;
  }

  async fetchSettings() {
    const resp = await this.get('/settings/get')
    this.storeWrite('settings', resp.data);
  }
}

window.customElements.define('the-app', TheApp);