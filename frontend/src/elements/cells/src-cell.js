/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import { logos } from '../../logos.js';
import { LitElement, html, css } from 'lit';

class SrcCell extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
        }

        .logo {
          display: flex;
          padding: 5px;
          justify-content: center;
          align-items: center;
          max-height: 24px;
          max-width: 50px;
        }

        .logo img {
          width: 50px;
        }

        .logo.ftx {
          border-radius: 8px;
          background: var(--white);
        }
      `
    ];
  }

  render() {
    const { srcName } = this;

    return html`
      ${logos[srcName] ? html`
      <div class="logo ${srcName}">
        <img src=${logos[srcName]}></img>
      </div>
      ` : html`
      <div>${srcName}</div>
      `}
    `;
  }

  static get properties() {
    return {
      srcName: { type: String },
    };
  }


}

window.customElements.define('src-cell', SrcCell);