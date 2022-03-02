/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

/**
 * Used to import other scripts dynamically based on a route change from the-router for example.
 * Do this by defining lazyMap for the importer and then calling `import` with the new path segments.
 *
 * ## Example lazyMp
 *
 * ```js
 * [
 *    {
 *      match: /^user$/,  // Would match /user/
 *      imports: [ 'user-element-1.html', 'user-element-2.html' ],
 *      map: [
 *        {
 *          match: /^settings$/,  // Would match /user/settings
 *          imports: [ 'settings.html' ]
 *        }
 *      ]
 *     }
 * ]
 * ```
 *
 * Use the _lazyImport method to start processing the map.
 * _lazyImport needs an array of strings that describe the path segments it should
 * match the map and sub maps against.
 *
 * So, if for example your route is /user/settings you need to split
 * the path to [ 'user', 'settings' ] and feed it to the _lazyImport function.
*/
export default class {
  constructor(lazyMap) {
    this.lazyMap = lazyMap;
  }

  import(segments) {
    if (typeof segments === 'object' && !Array.isArray(segments)) {
      segments = Object.values(segments).filter(v => v !== undefined);
    }

    if (!this.lazyMap || !Array.isArray(segments)) return;

    const imports = [];
    this.__processLazyMap(this.lazyMap, segments, 0, imports);

    const promises = imports.map(url => {
      return import(url);
    });

    return promises.length === 1 ? promises[0] : Promise.all(promises);
  }

  __processLazyMap(map, segments, level, list) {
    const segment = segments[level];
    if (segment === undefined) return [];

    map.forEach(entry => {
      if (!entry.match.test(segment)) return;

      if (Array.isArray(entry.imports)) {
        if (entry.match.test(segment)) {
          list.push(...entry.imports);
        }
      }

      if (Array.isArray(entry.map)) {
        this.__processLazyMap(entry.map, segments, level + 1, list);
      }
    });
  }
}
