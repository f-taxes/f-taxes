/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-router/tp-router.js';
import './the-menu.js';
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
        <tp-route path="/sources" data="sources"></tp-route>
      </tp-router>
      
      <div class="main">
        <the-menu></the-menu>
        ${page === '404' ? html`<the-404></the-404>` : null }
        ${page === 'sources' ? html`<the-sources .active=${page === 'sources'}></the-sources>` : null }
      </div>
    `;
  }

  static get properties() {
    return {
      // Data of the currently active route. Set by the router.
      route: { type: String, },

      // Params of the currently active route. Set by the router.
      routeParams: { type: Object },
    };
  }

  constructor() {
    super();
    this.importer = new LazyImports(
      [
        { match: /^404+/, imports: [
          '/assets/the-404.js'
        ] },
        { match: /sources/, imports: [
          '/assets/the-sources.js'
        ] }
      ]
    );
  }

  firstUpdated() {
    super.firstUpdated();
    this.fetchSrcConnections();
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
    })

    await ws.connect();
    return ws;
  }

  async fetchSrcConnections() {
    const resp = await this.get('/sources/connections/list')
    this.storeWrite('srcConnections', resp.data);
  }
}

window.customElements.define('the-app', TheApp);