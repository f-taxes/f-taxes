/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import './the-route';
import { pathToRegexp } from 'path-to-regexp';
import { closest } from '../../helpers/closest.js';
import { LitElement, html, css } from 'lit';

/*
# the-router

A simple router element to declaratively handle routing in web applications.

## Example

```html
<the-router id="mainRouter" data="{{route}}">
  <the-route path="*" data="404"></the-route>
  <the-route path="/" redirect="/member/list"></the-route>
  <the-route path="/myaccount" redirect="/myaccount/profile"></the-route>
  <the-route path="/myaccount/profile" data="myaccount-profile"></the-route>
</the-router>
```

A `the-route` element with the path set to `*` can be used to catch all routing request that can't be resolved.
The `redirect` attribute lets you redirect to another path.

The router listens for the `trigger-router` event. The event detail is forwarded to the `trigger` function.
*/
export class TheRouter extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: none;
        }
      `
    ];
  }

  render() {
    return html`
      <slot></slot>
    `;
  }

  static get properties() {
    return {
      // The current path thats active.
      path: { type: String, notify: true },

      data: { type: String, notify: true },

      /**
      * The path params extracted from the active path.
      */
      params: { type: Object, notify: true },

      /** Base URL for all routes */
      base: { type: String, },

      /**
      * Holds all defined routes.
      * Routes can be grouped by a namespace.
      * This makes it easier to manage whole batches of routes at once.
      *
      * Structure:
      * ```js
      * {
      *   default: {
      *     '/path/:param': {
      *     	 path: '/path/:param',
      *     	 regex: {RegExp},
      *     	 keys: {Array},
      *     	 data: {*},
      *     	 redirect: null,
      *     	 params: {}
      *     }
      *   },
      *   namespace: {
      *     '/path/:param': {
      *       path: '/path/:param',
      *     	 regex: {RegExp},
      *     	 keys: {Array},
      *     	 data: {*},
      *     	 redirect: null,
      *     	 params: {}
      *     }
      *   }
      * }
      * ```
      */
      routes: { type: Object, }
    };
  }

  constructor() {
    super();
    this.base = '/';
    this.params = {};
    this.routes = {};
    this._boundDocClick = this._onDocClick.bind(this);
    this._boundPopState = this._onPopstate.bind(this);
    this._boundDispatchTrigger = this._dispatchTrigger.bind(this);
  }

  get _slottedChildren() {
    const slot = this.shadowRoot.querySelector('slot');
    return slot.assignedElements({flatten: true});
  }

  shouldUpdate(changes) {
    if (changes.has('path')) {
      this.dispatchEvent(new CustomEvent('path-changed', { detail: this.path, bubbles: true, composed: true }));
    }

    if (changes.has('data')) {
      this.dispatchEvent(new CustomEvent('data-changed', { detail: this.data, bubbles: true, composed: true }));
    }

    if (changes.has('params')) {
      this.dispatchEvent(new CustomEvent('params-changed', { detail: this.params, bubbles: true, composed: true }));
    }
    return true;
  }

  firstUpdated() {
    const routes = this._slottedChildren;

    routes.forEach(routeEl => {
      if (routeEl.nodeName === 'THE-ROUTE') {
        this.add(routeEl.path, routeEl.data, routeEl.namespace, routeEl.redirect);
      }
    });

    document.addEventListener('click', this._boundDocClick);
    window.addEventListener('popstate', this._boundPopState);
    document.addEventListener('trigger-router', this._boundDispatchTrigger);

    // Check for a missed route that should be restored.
    if (location.hash.indexOf('#?') === 0) {
      this.trigger(location.hash.substring(2), true);
    } else {
      this.trigger(location.pathname, true);
    }
  }

  /**
  * Add a route to the router.
  * If a path is navigated to, the associated data is returned.
  * Fires the `route-added` event on success.
  *
  * @param {string} path Path pattern
  * @param {*} data Data that is send with the route changed event.
  * @param {string} [namespace] Optional namespace for the route.
  */
  add(path, data, namespace, redirect) {
    namespace = namespace || 'default';

    // Add catch all route.
    if (path === '*') {
      this._catchAllRoute = {
        path: path,
        regex: pathToRegexp('(.*)'),
        data: data,
        params: {}
      }

      return;
    }

    path = this._normalizePath(path);

    if (this._pathExists(path)) {
      console.warn(this.tagName + ': Path ' + path + ' is already defined');
      return;
    }

    if (this.routes[namespace] === undefined) {
      this.routes[namespace] = {};
    }

    this.routes[namespace][path] = {
      path: path,
      regex: pathToRegexp(path),
      data: data,
      redirect: redirect,
      params: {}
    };
  }

  /**
  * Trigger processing of a path.
  *
  * @param  {String} path Path to process
  * @param  {Boolean} replace If true, the matching route replaces the current history state instead of pushing it on top.
  * @return {Object|false} Returns the matching route, or false.
  */
  trigger(path, replace) {
    path = this._normalizePath(path);

    if (path === this._lastPath) {
      return;
    }

    this._lastPath = path;

    // Search through all routes and try to find the matching one.
    // The first one matching wins. Exept the catch all route. That one is always tried last.
    for (const r in this.routes) {
      const namespace = this.routes[r];
      for (const n in namespace) {
        const route = namespace[n];
        if (this._isMatchingRoute(path, route)) {
          if (route.redirect) {
            return this.trigger(route.redirect, replace);
          }

          if (replace) {
            return this._replace(route, path);
          } else {
            return this._push(route, path);
          }
        }
      }
    }

    // As last resort trigger the catch all route if configured.
    if (this._catchAllRoute) {
      return this._push(this._catchAllRoute, path);
    }

    return false;
  }

  _dispatchTrigger(e) {
    this.trigger(e.detail.path, e.detail.replace);
  }

  /**
    * Pushed a route on the history stack.
    *
    * @param  {Object} route The route object.
    * @param  {string} path  The requested path.
    */
  _push(route, path) {
    history.pushState(route, document.title, path);
    this._setRouteActive(route);
  }

  /**
    * Replace the current history state with the given route.
    *
    * @param  {Object} route The route object.
    * @param  {string} path  The new path.
    */
  _replace(route, path) {
    history.replaceState(route, document.title, path);
    this._setRouteActive(route);
  }

  /**
    * Fires the `route-active` event with the popped history state.
    */
  _onPopstate(e) {
    if (e.state) {
      this._setRouteActive(e.state);
    }
  }

  _setRouteActive(route) {
    this._lastPath = this._normalizePath(window.location.pathname);
    this.path = route.path;
    this.data = route.data;
    this.params = Object.assign({}, route.params);
    this.dispatchEvent(new CustomEvent('route-active', { detail: route, bubbles: true, composed: true }));
  }

  /**
    * Check if the clicked element should trigger routing.
    * Only A-elements trigger routing.
    * To prevent routing on a link, set the attribute `download`
    * or `rel` = 'external'.
    */
  _onDocClick(e) {
    if (1 !== e.which || e.metaKey || e.ctrlKey || e.shiftKey) {
      return;
    }

    // Try to find a link element that's allowed to fire routing.
    const el = closest(e.composedPath()[0], 'a', true);

    if (!el || el.nodeName !== 'A') {
      return;
    }

    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external' || el.hasAttribute('target')) {
      return;
    }

    const link = el.getAttribute('href');
    // Need to check the origin with `el.href`, because `getAttribute('href')` doesn't include the origin string.
    if (link && link.indexOf('mailto:') > -1 || !this._isSameOrigin(el.href)) {
      return;
    }

    const path = el.pathname + el.search + el.hash;

    e.preventDefault();
    this.trigger(path);
  }

  _isMatchingRoute(path, route) {
    const keys = route.regex.keys;
    const params = route.params = {};
    const qsIndex = path.indexOf('?');
    const pathname = qsIndex > -1 ? path.slice(0, qsIndex) : path;
    const m = route.regex.exec(decodeURIComponent(pathname));
    if (!m) return false;

    for (let i = 1, len = m.length; i < len; ++i) {
      const key = keys[i - 1];
      const val = this._decodeURLEncodedURIComponent(m[i]);
      if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
        params[key.name] = val;
      }
    }

    return true;
  }

  _isSameOrigin(href) {
    let origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return (href && (0 === href.indexOf(origin)));
  }

  _pathExists(path) {
    for (const key in this.routes) {
      const nsRoutes = this.routes[key];
      for (const p in nsRoutes) {
        if (p === path) {
          return true;
        }
      }
    }

    return false;
  }

  /**
    * Remove URL encoding from the given `str`.
    * Accommodates whitespace in both x-www-form-urlencoded
    * and regular percent-encoded form.
    *
    * @param {string} val URL component to decode
    */
  _decodeURLEncodedURIComponent(val) {
    if (typeof val !== 'string') { return val; }
    return decodeURIComponent(val.replace(/\+/g, ' '));
  }

  _normalizePath(path) {
    if (path.indexOf(this.base) !== 0) {
      if (path[0] !== '/') {
        path = '/' + path;
      }

      if (this.base !== '/') {
        path = this.base + path;
      }
    }

    return path;
  }
}

window.customElements.define('the-router', TheRouter);
