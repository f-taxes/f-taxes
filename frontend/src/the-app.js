/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-router/tp-router.js';
import './the-menu.js';
import './elements/job-status.js';
import { LitElement, html, css } from 'lit';
import theme from './styles/theme.js';
import { Store } from '@tp/tp-store/store.js';
import LazyImports from '@tp/helpers/lazy-imports.js'
import WS from './helpers/ws.js';
import { fetchMixin } from '@tp/helpers/fetch-mixin.js';

class TheApp extends fetchMixin(Store(LitElement)) {
  static get styles() {
    return [
      theme,
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
        <tp-route path="/transactions" data="transactions"></tp-route>
        <tp-route path="/sources" data="sources"></tp-route>
        <tp-route path="/settings" data="settings"></tp-route>
      </tp-router>
      
      <div class="main">
        <the-menu .ws=${this.ws}></the-menu>
        ${page === '404' ? html`<the-404></the-404>` : null }
        ${page === 'transactions' ? html`<the-transactions .active=${page === 'transactions'}></the-transactions>` : null }
        ${page === 'sources' ? html`<the-sources .active=${page === 'sources'} .ws=${this.ws}></the-sources>` : null }
        ${page === 'settings' ? html`<the-settings .active=${page === 'settings'}></the-settings>` : null }
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
        { match: /transactions/, imports: [
          '/assets/the-transactions.js'
        ] },
        { match: /sources/, imports: [
          '/assets/the-sources.js'
        ] },
        { match: /settings/, imports: [
          '/assets/the-settings.js'
        ] }
      ]
    );
  }

  firstUpdated() {
    super.firstUpdated();
    this.fetchSrcConnections();
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
      if (msg.event === 'update-src-connections') {
        this.fetchSrcConnections();
      }

      if (msg.event === 'app-settings-updated') {
        this.fetchSettings();
      }
    })

    await ws.connect();
    return ws;
  }

  async fetchSrcConnections() {
    const resp = await this.get('/sources/connections/list')
    this.storeWrite('srcConnections', resp.data);

    const srcMap = new Map();
    resp.data.forEach(src => srcMap.set(src._id, src));
    this.storeWrite('srcConnectionsMap', srcMap);
  }

  async fetchSettings() {
    const resp = await this.get('/settings/get')
    this.storeWrite('settings', resp.data);
  }
}

window.customElements.define('the-app', TheApp);