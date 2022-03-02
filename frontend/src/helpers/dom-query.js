/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

/**
 * Helps to automatically query elements in the shadow dom of the extended element.
 */
export const DomQuery = function(superClass) {
  return class extends superClass {

    constructor() {
      super();

      const handler = {
        get: (o, selector) => {
          const root = this.shadowRoot || this;
          const el = selector[0] === '?' ? root.querySelector(selector.substring(1)) : root.querySelector(`#${selector}`);
          if (el !== null) {
            return el;
          }
        }
      };

      this.$ = new Proxy({}, handler);
    }
  };
}
