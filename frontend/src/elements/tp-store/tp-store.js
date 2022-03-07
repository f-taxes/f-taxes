/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import { DataStore } from './dataStore';

/**
 * # Store
 *
 * A simple key value store.
 */
export const Store = function(superClass) {
  return class extends superClass {
    _storeSubscribe(keys) {
      if (Array.isArray(keys) === false) {
        keys = [ keys ];
      }

      keys.forEach(key => {
        let targetProperty;
        if (typeof key === 'object') {
          targetProperty = key.targetProperty;
          key = key.key;
        }
        DataStore.addInstance(this, key, targetProperty);
      });
    }

    _storeUpdated(key, newValue, targetProperty) {
      this[targetProperty || key] = newValue;
    }

    _storeWrite(key, value) {
      DataStore.writeKey(key, value);
    }
  };
}
