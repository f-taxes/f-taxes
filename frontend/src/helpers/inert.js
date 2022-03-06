/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

/**
 * This helper provides sort of a inert polyfill.
 * The `inert` property and a helper method is added that can be used
 * to update tabindex for example. The implementing element also is styled with
 * pointer-events: none if the inert property is set true.
 */
export const Inert = function(superClass) {
  return class extends superClass {
    static get properties() {
      return {
        inert: {
          type: Boolean,
          value: false,
          observer: '_inertChanged',
          reflectToAttribute: true
        }
      };
    }

    updated(changes) {
      if (changes.has('inert')) {
        this._inertChanged(this.inert);
      }
    }

    _inertChanged(state) {
      if (state) {
        this.style.pointerEvents = 'none';
        this._inertTapIndex = this.getAttribute('tabindex');
      } else {
        this.style.pointerEvents = '';
        if (this._inertTapIndex) {
          this.setAttribute('tabindex', this._inertTapIndex);
        }
      }
    }
  };
}
