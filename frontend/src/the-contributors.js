/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import './elements/card-box.js';
import shared from './styles/shared.js';
import { LitElement, html, css } from 'lit';

class TheContributors extends LitElement {
  static get styles() {
    return [
      shared,
      css`
        :host {
          display: block;
          padding: 20px;
          flex: 1;
        }

        card-box {
          max-width: 800px;
          margin: auto;
        }

        a {
          font-weight: bold;
          font-size: 22px;
        }
      `
    ];
  }

  render() {
    return html`
      <card-box>
        <h2>These Awesome Folks Make F-Taxes Possible</h2>
        <div>
          <a href="https://twitter.com/_Nia_john_" target="_blank">_nia_john_</a> - Logo Design
        </div>
      </card-box>
    `;
  }
}

window.customElements.define('the-contributors', TheContributors);