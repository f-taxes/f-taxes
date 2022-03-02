/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import { LitElement, html, css } from 'lit';

class MenuButton extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          padding: 10px;
          margin: 0 5px;
          font-size: 20px;
          border-radius: 4px;
          cursor: pointer;
        }

        :host(:hover),
        :host([active]) {
          background: var(--menu-color);
          color: var(--menu-background);
        }
      `
    ];
  }

  render() {
    return html`
      <slot></slot>
    `;
  }
}

window.customElements.define('menu-button', MenuButton);