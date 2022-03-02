/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import { LitElement, html, css } from 'lit';
import { Tooltip } from './tp-tooltip-mixin.js';

/**
# tp-tooltip-wrapper

This element can be used to add a tooltip to elements that don't implement the tooltip mixin.
It is a simple wrapper. It can be shown conditionally based on the value of `disabled`.
For this you have to use the `text` property instead of the inherited `tooltip` property.

## Example
```html
<tp-tooltip-wrapper tooltip="Text of the tooltip">
  <div>Content with a tooltip</div>
</tp-tooltip-wrapper>
```

## Styling
Name | Type | Default | Description
---|---|---
--tp-tooltip-wrapper | mixin || Styling on :host.

*/
class TpTooltipWrapper extends Tooltip(LitElement) {
  static get styles() {
    return css`
      :host {
        display: block;
      }
    `;
  }

  render() {
    return html`
      <slot></slot>
    `;
  }

  static get properties() {
    return {
      text: { type: String },
      disabled: { type: Boolean }
    };
  }

  constructor() {
    super();
    this.disabled = false;
  }

  shouldUpdate(changes) {
    if (changes.has('text') || changes.has('disabled')) {
      this._setTooltipText(this.text, this.disabled);
    }
    return true;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._hideTooltip();
  }

  _setTooltipText(text, disabled) {
    this.tooltip = disabled ? '' : text;
  }
}

window.customElements.define('tp-tooltip-wrapper', TpTooltipWrapper);
