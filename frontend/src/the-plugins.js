/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-button/tp-button.js';
import '@tp/tp-icon/tp-icon.js';
import '@tp/tp-dialog/tp-dialog.js';
import '@tp/tp-tooltip/tp-tooltip-wrapper.js';
import './elements/card-box.js';
import './elements/the-source-form.js';
import { LitElement, html, css } from 'lit';
import shared from './styles/shared.js';
import icons from './icons.js';
import { DomQuery } from '@tp/helpers/dom-query.js'
import { WsListener } from './helpers/ws-listener.js';
import { fetchMixin } from '@tp/helpers/fetch-mixin.js';

const mixins = [
  fetchMixin,
  DomQuery,
  WsListener,
];

const BaseElement = mixins.reduce((baseClass, mixin) => {
  return mixin(baseClass);
}, LitElement);

class ThePlugins extends BaseElement {
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

        card-box {
          max-width: 800px;
          margin: auto;
        }

        .empty {
          padding: 40px;
          text-align: center;
          font-size: 20px;
        }

        .plugin {
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: 1fr 1fr auto;
          gap: 0 20px;
          grid-auto-flow: row;
          grid-template-areas:
            "icon label actions"
            "icon key actions";
          margin-top: 20px;
          background: var(--bg0);
          padding: 10px;
          border-radius: 4px;
        }

        .icon {
          padding: 10px;
          font-size: 30px;
          grid-area: icon;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 8px;
          background: var(--white);
        }

        .icon img {
          max-width: 80px;
        }

        .label {
          grid-area: label;
          align-items: center;
        }

        .key {
          grid-area: key;
        }

        .label,
        .key {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-column-gap: 20px;
        }

        .label > div,
        .key > div {
          display: flex;
          align-items: center;
        }

        .actions {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          grid-area: actions;
        }

        .actions > * + * {
          margin-left: 10px;
        }

        .plugin label {
          color: var(--text-low);
          margin-right: 10px;
        }

        .social {
          margin-left: 10px;
        }

        .social tp-icon {
          --tp-icon-width: 14px;
          --tp-icon-height: 14px;
        }
      `
    ];
  }

  render() {
    const { plugins } = this;

    return html`
      <card-box>
        <h2>Plugins allow you to extend F-Taxes with new data sources for your tax reports.<br>All thanks to community contributions.</h2>
        <header>
          <h3>We found ${plugins.length} plugins</h3>
          <tp-button id="reloadBtn" @click=${this.reloadList} extended>Reload <tp-icon .icon=${icons.refresh}></tp-icon></tp-button>
        </header>
        <div class="list">
          ${plugins.length > 0 ? plugins.map(plugin => html`
            <div class="plugin">
              <div class="icon">
                <img src=${plugin.icon}></img>
              </div>
              <div class="label">
                <div>
                  <label>Label:</label>${plugin.label}
                </div>
                <div>
                  <label>Author:</label>
                  ${plugin.author.name}
                  ${plugin.author.twitter ? html`<a class="social" href=${plugin.author.twitter} target="_blank"><tp-icon .icon=${icons.twitter}></tp-icon></a>` : null}
                </div>
              </div>
              <div class="key">
                <div><label>Version:</label>${plugin.version}</div>
                <div><label>Status:</label>Not Installed</div>
              </div>
              <div class="actions">
                <tp-tooltip-wrapper text="Install this plugin" tooltipValign="top">
                  <tp-button class="only-icon" extended @click=${e => this.install(e, plugin)}><tp-icon .icon=${icons.download}></tp-icon></tp-button>
                </tp-tooltip-wrapper>

                <tp-tooltip-wrapper text="Uninstall this plugin" tooltipValign="top">
                  <tp-button class="only-icon" extended @click=${() => this.confirmUninstall(plugin)}><tp-icon .icon=${icons.delete}></tp-icon></tp-button>
                </tp-tooltip-wrapper>
              </div>
            </div>
          `): html`<div class="empty">Please wait until the list of available plugins was loaded...</div>`}
        </div>
      </card-box>

      <tp-dialog id="uninstallPluginDialog" showClose>
        <h2>Confirm removal</h2>
        <p>Do you want to remove the source "${this.selPlugins.label}"?<br>This will also delete all associated transactions and so on.</p>
        <div class="buttons-justified">
          <tp-button dialog-dismiss>Cancel</tp-button>
          <tp-button class="danger" @click=${() => this.uninstallPlugin()}>Yes, Remove</tp-button>
        </div>
      </tp-dialog>
    `;
  }

  static get properties() {
    return {
      items: { type: Array },
      active: { type: Boolean, reflect: true },
      plugins: { type: Array },
      settings: { type: Object },
      selPlugins: { type: Object },
    };
  }

  constructor() {
    super();
    this.plugins = [];
    this.selPlugins = {};
  }

  firstUpdated() {
    setTimeout(() => {
      this.reloadList();
    }, 0);
  }

  async reloadList() {
    this.$.reloadBtn.showSpinner();

    const resp = await this.get('/plugins/list');
    
    if (resp.result) {
      this.$.reloadBtn.showSuccess();
      this.plugins = resp.data;
    } else {
      this.$.reloadBtn.showError();
    }
  }

  async install(e, plugin) {
    const btn = e.target;
    btn.showSpinner();
    const resp = await this.post('/plugins/install', { id: plugin.id });
    if (!resp.result) {
      btn.showError();
    }
  }

  confirmUninstall(plugin) {
    this.selPlugins = plugin;
    this.$.uninstallPluginDialog.show();
  }

  uninstallPlugin() {
    this.post('/plugin/uninstall', { srcId: this.selPlugins._id });
    this.$.uninstallPluginDialog.close();
  }

  onMsg(msg) {
    if (msg.event === 'job-progress' && msg.data.srcConId !== undefined) {
      const { data } = msg;
      const btn = this.shadowRoot.querySelector('#fetch_' + data.srcConId);

      if (data.progress === '100' && btn) {
        btn.hideSpinner();
      } else {
        if (!btn.hasAttribute('locked')) {
          btn.showSpinner();
        }
      }
    }
  }
}

window.customElements.define('the-plugins', ThePlugins);