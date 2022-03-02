/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import './tp-tooltip.js';

/**
 * Elements implementing this mixin are able to show tooltip on mouse over.
 *
 * ## Example
 * ```html
 * <x-foo tooltip="Show this text in the tooltip"></x-foo>
 * ```
 *
 * @polymer
* @mixinFunction
 */
export const Tooltip = function(superClass) {
  return class extends superClass {
    static get properties() {
      return {

        /**
         * Text to show in the tooltip.
         */
        tooltip: { type: String },

        /**
         * Vertical align of the tooltip.
         * Supported are `bottom` and `top`.
         */
        tooltipValign: { type: String }
      };
    }

    constructor() {
      super();
      this.tooltipValign = 'bottom';
      this._showTooltip = this._showTooltip.bind(this);
      this._hideTooltip = this._hideTooltip.bind(this);
    }

    set tooltip(val) {
      const oldTooltip = this.tooltip;
      this._tooltip = val;
      this._tooltipChanged(this.tooltip, oldTooltip);
    }

    get tooltip() {
      return this._tooltip;
    }

    _tooltipChanged(newTooltip, oldTooltip) {
      if (oldTooltip) {
        this.removeEventListener('mouseenter', this._showTooltip);
        this.removeEventListener('focus', this._showTooltip);
      }

      if (newTooltip && newTooltip !== '') {
        this.addEventListener('mouseenter', this._showTooltip);
        this.addEventListener('focus', this._showTooltip);
      }
    }

    _showTooltip() {
      if (this._tooltipInstance || !this.tooltip || this.tooltip === '') {
        return;
      }
      const tooltip = document.createElement('tp-tooltip');
      tooltip.innerHTML = this.tooltip;
      tooltip.valign = this.tooltipValign;
      tooltip.target = this;
      this._tooltipInstance = tooltip;

      this.addEventListener('mouseleave', this._hideTooltip);
      this.addEventListener('blur', this._hideTooltip);
      this.addEventListener('click', this._hideTooltip);

      document.body.appendChild(this._tooltipInstance);
      this._tooltipInstance.show();
    }

    _hideTooltip() {
      if (!this._tooltipInstance) {
        return;
      }
      this._tooltipInstance.hide(function() {
        if (this._tooltipInstance) {
          document.body.removeChild(this._tooltipInstance);
          this.removeEventListener('mouseleave', this._hideTooltip);
          this.removeEventListener('blur', this._hideTooltip);
          this.removeEventListener('click', this._hideTooltip);
          this._tooltipInstance = null;
        }
      }.bind(this));
    }
  };
}
