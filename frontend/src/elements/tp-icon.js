/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import { LitElement, html, svg, css } from 'lit';
import { Tooltip } from './tp-tooltip/tp-tooltip-mixin.js';

class TpIcon extends Tooltip(LitElement) {
  static get styles() {
    return css`
      :host {
        display: inline-block;
        width: var(--tp-icon-width, 24px);
        height: var(--tp-icon-height, 24px);
        cursor: pointer;
        outline: none;
      }

      .wrap {
        display: flex;
        align-items: center;
      }
    `;
  }

  render() {
    return html`
      <div class="wrap">
      ${svg`
        <svg viewBox="0 0 24 24" style="width: 100%; height: 100%;" preserveAspectRatio="xMidYMid meet" focusable="false">
          ${this.icon}
        </svg>
      `}
      </div>
    `;
  }

  static get properties() {
    return {
      icon: { type: Object }
    };
  }

  firstUpdated() {
    this.setAttribute('tabindex', '-1');
  }

  shouldRender() {
    return Boolean(this.icon);
  }
}

window.customElements.define('tp-icon', TpIcon);
