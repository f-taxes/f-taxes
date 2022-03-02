/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

const data = new Map();
const instancesPerKey = new Map();

export const DataStore = new class {
  addInstance(instance, key, targetProperty) {
    if (instancesPerKey.has(key) === false) {
      instancesPerKey.set(key, [ { instance, targetProperty } ]);
    } else {
      instancesPerKey.get(key).push({ instance, targetProperty });
    }

    if (data.has(key)) {
      this._notifyInstance(instance, key, data.get(key), targetProperty);
    }
  }

  writeKey(key, value) {
    data.set(key, value);

    const instances = instancesPerKey.get(key);
    if (Array.isArray(instances)) {
      instances.forEach(entry => {
        this._notifyInstance(entry.instance, key, value, entry.targetProperty);
      });
    }
  }

  _notifyInstance(instance, key, value, targetProperty) {
    instance._storeUpdated(key, value, targetProperty);
  }
};
