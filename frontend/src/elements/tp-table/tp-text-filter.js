/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import { LitElement, html, css } from 'lit';

class TpTextFilter extends LitElement {
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
    const { } = this;

    return html`
      <h1>Test</h1>
      <p>No</p>
    `;
  }

  static get properties() {
    return { };
  }


}

window.customElements.define('tp-text-filter', TpTextFilter);