/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

export const ControlState = function(superClass) {
  return class extends superClass {
    static get properties() {
      return {
        focused: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
      };
    }

    constructor() {
      super();
      this._boundFocus = this._focusHandler.bind(this);
    }

    firstUpdated() {
      super.firstUpdated();
      this.addEventListener('focus', this._boundFocus, true);
      this.addEventListener('blur', this._boundFocus, true);
    }

    _focusHandler(e) {
      this.focused = e.type === 'focus';
    }

    _disabledChanged(disabled) {
      this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      this.style.pointerEvents = disabled ? 'none' : '';
      if (disabled) {
        // Read the `tabindex` attribute instead of the `tabIndex` property.
        // The property returns `-1` if there is no `tabindex` attribute.
        // This distinction is important when restoring the value because
        // leaving `-1` hides shadow root children from the tab order.
        this._prevTabIndex = this.getAttribute('tabindex');
        this.focused = false;
        this.tabIndex = -1;
        this.blur();
      } else if (this._prevTabIndex !== undefined) {
        if (this._prevTabIndex === null) {
          this.removeAttribute('tabindex');
        } else {
          this.setAttribute('tabindex', this._prevTabIndex);
        }
      }
    }
  };
}