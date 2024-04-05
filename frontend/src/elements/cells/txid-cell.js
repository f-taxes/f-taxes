/**
@license
Copyright (c) 2024 trading_peter
This program is available under Apache License Version 2.0
*/

import { LitElement, html, css } from 'lit';

class TxIdCell extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
        }
      `
    ];
  }

  render() {
    const { txid, srcCon } = this;
    let link = null;

    // TODO: Add direct links to blockchain explorers depending on the source.
    // switch (srcCon.source) {
    //   case 'some chain':
    //     link = '';
    //     break;
    // }

    return html`
      ${link == null ? html`
        <div>${txid}</div>
      ` : html`
        <div><a href=${link} target="_blank">${txid}</a></div>
      `}
    `;
  }

  static get properties() {
    return {
      txid: { type: String },
      sourceCon: { type: Object },
    };
  }


}

window.customElements.define('txid-cell', TxIdCell);