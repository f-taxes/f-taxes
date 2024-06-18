/**
@license
Copyright (c) 2024 trading_peter
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
import { closest } from '@tp/helpers';

const mixins = [
  fetchMixin,
  DomQuery,
  WsListener,
];

const BaseElement = mixins.reduce((baseClass, mixin) => {
  return mixin(baseClass);
}, LitElement);

class TheReports extends BaseElement {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: flex;
          flex-direction: column;
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

        .icon tp-icon {
          --tp-icon-color: var(--black);
          --tp-icon-width: 32px;
          --tp-icon-height: 32px;
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

        #pluginSettingsDialog::part(dialog) {
          width: 80%;
          height: 80%;
        }

        .frame-wrap {
          display: flex;
          flex-direction: row;
          position: absolute;
          inset: 30px 0;
        }
        
        .frame-page {
          display: flex;
          flex: 1;
        }

        #reportFrame,
        #settingsFrame {
          flex: 1;
        }
      `
    ];
  }

  render() {
    const { plugins } = this;

    return html`
      <card-box>
        <header>
          <h3>We found ${plugins.length} report plugins</h3>
          <tp-button id="reloadBtn" @click=${this.reloadList} extended>Reload <tp-icon .icon=${icons.refresh}></tp-icon></tp-button>
        </header>
        <div class="list">
          ${plugins.length > 0 ? plugins.map(plugin => html`
            <div class="plugin" id=${plugin.id}>
              <div class="icon">
                ${plugin.icon ? html`
                  <img src=${plugin.icon} height="32"></img>
                ` : html`
                  <tp-icon .icon=${icons.plugin}></tp-icon>
                `}
              </div>
              <div class="label">
                <div>
                  <label>Label:</label>${plugin.label}
                </div>
                <div>
                  <label>Author:</label>
                  ${plugin.author.name}
                </div>
              </div>
              <div class="key">
                <div><label>Version:</label>${plugin.version}</div>
                <div><label>Status:</label>${this.pluginStatusToString(plugin.status)}</div>
              </div>
              <div class="actions">
                ${plugin.web?.reportPage ? html`
                  <tp-tooltip-wrapper text="Start creating reports using this plugin" tooltipValign="top">
                    <tp-button class="only-icon" extended @click=${e => this.showReportPage(e, plugin)}><tp-icon .icon=${icons.play}></tp-icon></tp-button>
                  </tp-tooltip-wrapper>
                ` : null}

                ${plugin.web?.configPage ? html`
                  <tp-tooltip-wrapper text="Show configuration page for this plugin" tooltipValign="top">
                    <tp-button class="only-icon" extended @click=${e => this.showSettings(e, plugin)}><tp-icon .icon=${icons.settings}></tp-icon></tp-button>
                  </tp-tooltip-wrapper>
                ` : null}
              </div>
            </div>
          `): html`<div class="empty">Please wait until the list of available report plugins was loaded...</div>`}
        </div>
      </card-box>

      <div class="frame-page">
        <iframe id="reportFrame" src="" frameborder="0"></iframe>
      </div>

      <tp-dialog id="pluginSettingsDialog" showClose>
        <div class="frame-wrap">
          <iframe id="settingsFrame" src="" frameborder="0"></iframe>
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

  async reloadList(e) {
    let btn = e?.target;

    if (btn) {
      btn = closest(btn, 'tp-button');
      btn.showSpinner();
    }

    const resp = await this.post('/plugins/list', { onlyInstalled: true, types: [ 'Report' ] });
    
    if (resp.result) {
      if (btn) {
        btn.showSuccess();
      }
      this.plugins = resp.data;
    } else if (btn) {
      btn.showError();
    }
  }

  async install(e, plugin) {
    const btn = e.target;
    btn.showSpinner();
    const resp = await this.post('/plugins/install', plugin);
    if (!resp.result) {
      btn.showError();
    }
  }

  pluginStatusToString(status) {
    switch (status) {
      case 0:
        return 'Installed';
      case 1:
        return 'Not Installed';
      case 2:
        return 'Update Available';
    }
  }

  confirmUninstall(plugin) {
    this.selPlugins = plugin;
    this.$.uninstallPluginDialog.show();
  }

  uninstallPlugin() {
    this.post('/plugin/uninstall', this.selPlugins);
    this.$.uninstallPluginDialog.close();
  }

  onMsg(msg) {
    if (msg.event === 'plugin-install-result') {
      const { data } = msg;
      const pluginEl = this.shadowRoot.getElementById(data.id);

      if (pluginEl) {
        if (data.result) {
          pluginEl.querySelector('tp-button').showSuccess();
        } else {
          pluginEl.querySelector('tp-button').showError();
        }
      }

      this.reloadList();
    }

    if (msg.event === 'plugin-uninstalled') {
      this.reloadList();
    }
  }

  showSettings(e, plugin) {
    this.$.settingsFrame.src = `http://${plugin.web.address}${plugin.web.configPage}`;
    this.$.pluginSettingsDialog.show();
  }

  showReportPage(e, plugin) {
    this.$.reportFrame.src = `http://${plugin.web.address}${plugin.web.reportPage}`;
  }
}

window.customElements.define('the-reports', TheReports);