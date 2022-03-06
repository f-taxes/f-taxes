/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import { LitElement, css } from 'lit';

class TpMediaQuery extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: none;
        }
      `
    ];
  }

  static get properties() {
    return {
      query: { type: String },
    };
  }

  constructor() {
    super();
    this._boundQueryHandler = this.queryHandler.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.checkQuery();
  }

  checkQuery() {
    this._remove();
    var query = this.query;
    if (!query) {
      return;
    }
    if (query[0] !== '(') {
      query = '(' + query + ')';
    }
    this._queryMatch = window.matchMedia(query);
    this._add();
    this.queryHandler(this._queryMatch);
  }

  _add() {
    if (this._queryMatch) {
      this._queryMatch.addEventListener('change', this._boundQueryHandler);
    }
  }

  _remove() {
    if (this._queryMatch) {
      this._queryMatch.removeEventListener('change', this._boundQueryHandler);
    }
    this._queryMatch = null;
  }

  queryHandler(mq) {
    this.dispatchEvent(new CustomEvent('media-query-update', { detail: mq.matches, bubbles: true, composed: true }));
  }
}

window.customElements.define('tp-media-query', TpMediaQuery);