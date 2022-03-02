/*
Copyright (c) 2020 EDV Wasmeier
This program is available under Apache License Version 2.0
*/

import { LitElement, html, css } from 'lit-element/lit-element.js';
import { Position } from '../../helpers/position.js';

/*
# tp-tooltip

This element is used by `tp-tooltip-mixin` to show a tooltip on the implementing element.
It is not meant to be used stand alone.

## Example
```html
<x-foo tooltip="Show this text in the tooltip"></x-foo>
```

## Styling
Name | Type | Default | Description
---|---|---
--tp-tooltip-spacing | var | 5px | Spacing between target and the tooltip.

*/
class TpTooltip extends Position(LitElement) {
  static get styles() {
    return css`
      :host {
        display: none;
        opacity: 0;
        position: fixed;
        left: 0;
        z-index: 1;
        background: #1B1B1B;
        color: #ffffff;
        font-size: 12px;
        padding: 5px;
        border-radius: 2px;
        transition: transform 80ms, opacity 180ms;
        transform: scale(0.90);
        will-change: transform, opacity;
        white-space: nowrap;
      }

      :host([visible]) {
        transform: scale(1);
        opacity: 1;
      }
    `;
  }

  render() {
    return html`
      <div class="wrap"><slot></slot></div>
    `;
  }

  static get properties() {
    return {
      /**
       * Element to align the tooltip to.
       */
      target: { type: Object },

      /**
       * Indicates if the tooltip is currently visible.
       */
      visible: { type: Boolean, reflect: true },

      /**
       * Delay till the tooltip is switched visible.
       */
      delay: { type: Number },

      /**
       * Vertical align of the tooltip.
       */
      valign: { type: String }
    };
  }

  constructor() {
    super();

    this.delay = 400;
    this.valign = 'bottom';
    this.visible = false;
  }

  show() {
    if (this._showJob) {
      clearTimeout(this._showJob);
      this._showJob = null;
    }

    this._showJob = setTimeout(() => {
      this.style.display = 'block';
      const spacing = parseInt((window.ShadyCSS ? ShadyCSS.getComputedStyleValue(this.target, '--tp-tooltip-spacing') : getComputedStyle(this.target).getPropertyValue('--tp-tooltip-spacing')), 10);
      setTimeout(() => {
        this.visible = true;
        this._posFixed(this.target, this, {
          valign: this.valign,
          halign: 'middle',
          // See: https://github.com/webcomponents/shadycss/issues/83
          spacing: spacing || 5
        });
      }, 10);
    }, this.delay);
  }

  hide(cb) {
    if (this._showJob) {
      clearTimeout(this._showJob);
      this._showJob = null;
    }
    this.visible = false;
    setTimeout(() => {
      cb();
    }, 200);
  }
}

window.customElements.define('tp-tooltip', TpTooltip);
