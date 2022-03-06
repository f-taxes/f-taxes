/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import './tp-icon.js';
import './tp-input.js';
import './tp-media-query.js';
import { LitElement, html, svg, css } from 'lit';
import { FormElement } from '../helpers/form-element.js';
import { Position } from '../helpers/position.js';
import { DomQuery } from '../helpers/dom-query.js';
import { EventHelpers } from '../helpers/event-helpers.js';
import { closest } from '../helpers/closest.js';
import { ControlState } from '../helpers/control-state.js';
import { isDefined } from '../helpers/isDefined.js';

const mixins = [
  FormElement,
  Position,
  DomQuery,
  EventHelpers,
  ControlState
];

const BaseElement = mixins.reduce((baseClass, mixin) => {
  return mixin(baseClass);
}, LitElement);

class TpDropdown extends BaseElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
          position: relative;
          cursor: pointer;
          outline: none;

          --shadow-2dp: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
                    0 1px 5px 0 rgba(0, 0, 0, 0.12),
                    0 3px 1px -2px rgba(0, 0, 0, 0.2);
        }

        [hidden] {
          display: none;
        }

        .selector {
          display: flex;
          flex-direction: row;
          align-items: center;
          border: solid 1px #9E9E9E;
          border-radius: 2px;
        }

        :host([invalid]) .selector {
          border: solid 1px #B71C1C;
        }

        :host([focused]) .selector {
          border: solid 1px #039BE5;
        }

        :host([no-overflow]) #selItem {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .selector #selItem {
          flex: 1;
          padding-left: 5px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        #filter {
          background: #f7f7f7;
          padding: 7px 10px;
          border-bottom: solid 1px #ececec;
        }

        #filter tp-icon {
          --tp-icon-width: 16px;
          --tp-icon-height: 16px;
          opacity: 0.5;
          transition: opacity 0.3s;
        }

        #filter tp-icon:hover {
          opacity: 1;
        }

        .toggle-icon-wrap {
          /* Prevents the toggle icon from overflowing out of the control while it's rotated. */
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #toggleIcon {
          transition: opacity 0.3s, transform 0.2s;
          transform-origin: center center;
          transform: rotate(0deg);
          opacity: 0.5;
        }

        #toggleIcon[open] {
          transform: rotate(180deg) !important;
          opacity: 1;
        }

        :host(:hover) #toggleIcon {
          opacity: 1;
        }

        #list {
          pointer-events: none;
          transition: opacity 0ms;
          opacity: 0;
          position: fixed;
          z-index: 1;
          height: auto;
        }

        #list[open] {
          pointer-events: all;
          transition: opacity 180ms;
          opacity: 1;
          border-radius: 2px;
          background: #FAFAFA;
          height: auto;
          box-shadow: var(--shadow-2dp);
        }

        #itemList {
          display: block;
          overflow-y: auto;
        }

        div[role="option"] {
          padding: 5px 10px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        div[role="option"]:hover {
          background: #E0F7FA;
        }

        div[role="option"]:focus {
          background: #EEEEEE;
          outline: none;
        }

        div[role="option"][selected] {
          background: #4FC3F7;
          color: #FFFFFF;
        }

        div[role="option"]:first-of-type {
          margin-top: 10px;
        }

        div[role="option"]:last-of-type {
          margin-bottom: 10px;
        }

        .add-item-label {
          padding: 10px;
          background: #FFFFFF;
          color: #616161;
        }

        .add-item-label:hover {
          background: #039BE5;
        }

        .error-message {
          position: absolute;
          bottom: 2px;
          left: 5px;
          right: 0;
          font-size: 10px;
          color: #B71C1C;
          transition: opacity 0.3s;
          opacity: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          pointer-events: none;
        }

        :host([invalid]) .error-message {
          opacity: 1;
        }

        @media all and (min-width: 0) and (max-width: 480px) {

          :host(:not([not-responsive])) #list {
            top: 40px !important;
            bottom: 40px !important;
            left: 40px !important;
            right: 40px !important;
            max-width: none !important;
            min-width: auto !important;
            padding-bottom: 10px;
            display: flex;
            flex-direction: column;
          }

          :host(:not([not-responsive])) #itemList {
            max-height: none !important;
            display: flex;
          }

          :host(:not([not-responsive])) #filter {
            font-size: 16px;
            padding: 12px 10px;
          }

          :host(:not([not-responsive])) div[role="option"] {
            padding: 10px 10px;
          }

          :host(:not([not-responsive])) div[role="option"]:last-of-type {
            margin-bottom: 0;
          }
        }
      `
    ];
  }

  render() {
    const { label, isOpen, errorMessage, filterPlaceholder, extensible, filterable, items} = this;

    return html`
      <tp-media-query query="(min-width: 0) and (max-width: 480px)" @media-query-update=${this._queryUpdated}></tp-media-query>

      <div class="wrap">
        <div class="selector" part="selector">
          <div id="selItem">${label}</div>
          <div class="error-message">${errorMessage}</div>
          <div class="toggle-icon-wrap">
            <tp-icon id="toggleIcon" ?open="${isOpen}" .icon=${TpDropdown.selectorIcon}></tp-icon>
          </div>
        </div>
        <div id="list" ?open="${isOpen}">
          <tp-input part="filter" exportparts="wrap:filterWrap" placeholder=${filterPlaceholder} id="filter" .value=${this._filterTerm || ''} @input=${e => this._filterTerm = e.target.value} .inert=${!isOpen} ?hidden=${!(filterable || extensible)}>
            <input type="text">
            <tp-icon id="filterIcon" .icon=${extensible ? TpDropdown.addIcon : TpDropdown.filterIcon} slot="suffix"></tp-icon>
          </tp-input>
          <div id="itemList" part="list">
            ${items.map(item => this._filter(item) ? html`
              <div part="item" role="option" .value=${item.value} tabindex=${isOpen ? '0' : '-1'}>${item.label}</div>
            ` : null)}
          </div>
        </div>
      </div>
    `;
  }

  static get properties() {
    return {
      items: { type: Array },
      isOpen: { type: Boolean },
      responsive: { type: Boolean },
      value: { type: String },
      default: { type: String },
      label: { type: String },
      errorMessage: { type: String },
      filterable: { type: Boolean },
      filterPlaceholder: { type: String },
      // Allow to add unknown items to the list (New items aren't added to the items array by the component. Listen for the `add-item` event to do that).
      extensible: { type: Boolean },
      // If true, the dropdown fires the `add-item` event also on blur. Works only if `extensible` is set.
      autoExtend: { type: Boolean, },
      focused: { type: Boolean, reflect: true, },
      readonly: { type: Boolean, reflect: true },
      /*
      * Stores the first known value of the `value` property that is not falsy.
      * If `items` changes and no longer holds the originally selected item,
      * the dropdown will clear the selection. Nevertheless `_memorizedValue`
      * still holds the old value of `value`. If `items` brings back the originally
      * selected entry, the old `value` will be restored with `_memorizedValue`
      * and the item will be selected again.
      *
      * Dropdown basically restores it's selection state if the right item comes
      * back again.
      */
      _memorizedValue: { type: String },
      _filterTerm: { type: String }
    };
  }

  static get selectorIcon() {
    return svg`<path fill="var(--tp-dropdown-selector-icon-color, #000000)" d="M7,10L12,15L17,10H7Z" />`;
  }

  static get filterIcon() {
    return svg`
      <path stroke-linejoin="round" stroke-linecap="round" stroke-width="1.5" stroke="var(--tp-dropdown-filter-icon-color)" d="M15.9996 15.2877L15.2925 15.9948L21.2958 21.9981L22.0029 21.291L15.9996 15.2877Z"></path>
      <path stroke-linejoin="round" stroke-linecap="round" stroke-width="1.5" stroke="var(--tp-dropdown-filter-icon-color)" fill="none" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"></path>
    `;
  }

  static get addIcon() {
    return svg`
      <path stroke-linejoin="round" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" stroke="var(--tp-dropdown-add-icon-color)" d="M3 12H21"></path>
      <path stroke-linejoin="round" stroke-linecap="round" stroke-miterlimit="10" stroke-width="2" stroke="var(--tp-dropdown-add-icon-color)" d="M12 3V21"></path>
    `;
  }

  constructor() {
    super();
    this.items = [];
    this._onDocClickHandler = () => this.close();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._boundSetListPosition) {
      window.removeEventListener('resize', this._boundSetListPosition);
      document.removeEventListener('scroll', this._boundSetListPosition);
    }
    document.removeEventListener('click', this._onDocClickHandler, true);
    this.unlisten(this, 'keydown', '_onKeyDown');
    this.unlisten(this.$.filter, 'keydown', '_onKeyDownFilter');
    this.unlisten(this.$.filterIcon, 'click', '_filterIconClicked');
  }

  firstUpdated() {
    super.firstUpdated();
    this.listen(this, 'click', '_onClick');
  }

  updated(changes) {
    super.updated(changes);

    if (changes.has('default')) {
      this._setDefault();
    }

    if (changes.has('focused')) {
      this._focusChanged(this.focused, changes.get('focused'));
    }

    if (changes.has('value')) {
      this._valueChanged();
      this.dispatchEvent(new CustomEvent('value-changed', { detail: this.value, bubbles: true, composed: true }));
    }
  }

  _queryUpdated(e) {
    this.responsive = e.detail;
  }

  _focusChanged(newState, oldState) {
    if (newState) {
      this.listen(this, 'keydown', '_onKeyDown');
      this.listen(this.$.filter, 'keydown', '_onKeyDownFilter');
      this.listen(this.$.filterIcon, 'click', '_filterIconClicked');

      if (this.filterable) {
        this.$.filter.focus();
      }
    } else if (oldState) {
      this.unlisten(this, 'keydown', '_onKeyDown');
      this.unlisten(this.$.filter, 'keydown', '_onKeyDownFilter');
      this.unlisten(this.$.filterIcon, 'click', '_filterIconClicked');

      if (!newState) {
        if (oldState && this.$.filter.value !== '') {
          if (this.extensible && this.autoExtend) {
            this._addItem();
          } else if (!this._selectByLabel(this.$.filter.value)) {
            if (!this.value) {
              this.$.filter.value = '';
            }
          }
        }
      }
    }
  }

  _setDefault() {
    if ((this.value === null || this.value === undefined) && this._hasItem(this.default)) {
      this.value = this.default;
      return true;
    }

    return false;
  }

  _hasItem(value) {
    if (value === undefined) return false;
    return Array.isArray(this.items) && this.items.find(item => item.value.toString() === value.toString()) !== undefined;
  }

  _valueChanged() {
    if (this._setDefault()) {
      return;
    }

    // Show selection in selector.
    const idx = this.items.findIndex(item => item.value === this.value);
    if (idx > -1) {
      this.label = this.items[idx].label;
    }

    this.invalid = false;

    setTimeout(() => {
      var ariaSel = this.shadowRoot.querySelector('div[aria-selected]');
      var item = this.shadowRoot.querySelector('div[selected]');
      if (ariaSel) {
        ariaSel.removeAttribute('aria-selected');
      }
      if (item) {
        item.setAttribute('aria-selected', true);
      }
    }, 0);
  }

  _checkValue(newValue, oldValue) {
    if (newValue === null || newValue === undefined) {
      this.$.itemList.selection = null;
      this.label = '';
    }
  }

  /**
   * Opens the menu.
   */
  open() {
    if (this.readonly) {
      return;
    }

    if (this._responsive) {
      window.history.pushState({ is: 'tp-dropdown' }, null);
      this.listen(window, 'popstate', 'close');
    }

    // If no items, we only open the list if the control is extensible.
    if (this.items.length === 0) {
      if (this.extensible || this.filterable) {
        this.$.filter.focus();
      } else {
        return;
      }
    }

    if (!this._boundSetListPosition) {
      this._boundSetListPosition = this._setListPosition.bind(this);
    }

    // Re-calc list position if window size is changed or document is scrolled.
    // This is very important for smartphones with onscreen keyboards popping up.
    window.addEventListener('resize', this._boundSetListPosition);
    document.addEventListener('scroll', this._boundSetListPosition, { passive: true });
    document.addEventListener('click', this._onDocClickHandler, true);
    this.listen(this.$.filter, 'click', '_filterClicked');

    this._setListPosition();

    this.isOpen = true;
    this.$.selItem.focus();
  }

  _filterClicked(e) {
    this._dontClose = true;
  }

  /**
   * Closes the menu.
   */
  close() {
    if (this.isOpen) {
      this._closeJob = setTimeout(() => {
        this._close();
        if (window.history.state && window.history.state.is === 'tp-dropdown') {
          window.history.back();
        }
      }, 50);
    }
  }

  _close() {
    var idx = this.items.findIndex(item => item.value === this.value);

    if (idx === -1) {
      this.label = '';
    } else {
      this.label = this.items[idx].label;
    }

    this.isOpen = false;
    window.removeEventListener('resize', this._boundSetListPosition);
    document.removeEventListener('scroll', this._boundSetListPosition);
    document.removeEventListener('click', this._onDocClickHandler, true);
    this.unlisten(this.$.filter, 'click', '_filterClicked');

    this._filterTerm = '';
  }

  /**
   * Toggles the menu.
   */
  toggle() {
    if (this.isOpen) {
      this._close();
    } else {
      this.open();
    }
  }

  _setListPosition() {
    var rect = this.getBoundingClientRect();
    var filterHeight = this.filterable ? this.$.filter.getBoundingClientRect().height : 0;
    var winHeight = window.innerHeight;

    var spaceBottom = winHeight - rect.top - rect.height - filterHeight;
    this.$.itemList.style.maxHeight = (spaceBottom - 20) + 'px';
    this.$.list.style.maxWidth = rect.width + 'px';
    this.$.list.style.minWidth = rect.width + 'px';

    var useTopLayout = spaceBottom < 150;

    if (useTopLayout) {
      this.$.itemList.style.maxHeight = (rect.top - 20) + 'px';
    }

    this._posFixed(this, this.$.list, {
      spacing: 0,
      valign: useTopLayout ? 'top' : 'bottom',
      halign: 'left'
    });

    // Make list only take as much height as possible in responsive mode.
    setTimeout(() => {
      var lastItem = this.$.itemList.querySelector('div[role="option"]:last-of-type');
      if (lastItem) {
        this.$.list.style.maxHeight = lastItem.getBoundingClientRect().top + 'px';
      }
    });
  }

  /**
   * Validate the control.
   *
   * @return {Boolean} False if invalid, else true.
   */
  validate() {
    if (!isDefined(this.value) && this.required) {
      this.invalid = true;
      return false;
    }

    this.invalid = false;
    return true;
  }

  /**
   * Reset the control if a parent era-form is reset.
   */
  reset() {
    this.invalid = false;
    this._memorizedValue = undefined;
    this._filterTerm = '';
    if (this.default !== undefined) {
      this.value = this.default;
    } else {
      this.value = undefined;
    }
  }

  _itemsChanged() {
    // In case `items` was set to null or undefined.
    if (!this.items) {
      this.items = [];
      this.value = null;
      return;
    }

    const memValueDefined = this._memorizedValue !== null && this._memorizedValue !== undefined;
    const foundValue = this.items.findIndex(item => item.value === this.value) > -1;
    const foundMemVal = memValueDefined ? this.items.findIndex(item => item.value === this._memorizedValue) > -1 : false;

    if (!foundValue && foundMemVal) {
      this.value = this._memorizedValue;
    }

    if (!memValueDefined) {
      this._memorizedValue = this.value;
    }

    if (!foundValue && !foundMemVal) {
      this.value = null;
    }

    this._setDefault();

    // Reset filter.
    this._filterTerm = '';
  }

  _filter(item) {
    if (!this._filterTerm) {
      return true;
    }
    return new RegExp('.*' + this._filterTerm.toLowerCase() + '.*').test(item.label.toLowerCase());
  }

  _filterIconClicked() {
    if (this.extensible) {
      this._addItem();
    }
    this._filterTerm = '';
    this.$.filter.focus();
  }

  _onClick(e) {
    if (this._dontClose) {
      setTimeout(() => {
        clearTimeout(this._closeJob);
      }, 20);
      this._dontClose = false;
      return;
    }

    e.preventDefault();
    const itemEl = closest(e.composedPath()[0], 'div[role="option"]');
    if (itemEl === undefined) {
      // We didn't click a item, so cancel the global close trigger.
      setTimeout(() => {
        clearTimeout(this._closeJob);
      }, 20);
    } else {
      this.value = itemEl.value;
    }

    var rootTarget = e.composedPath()[0];

    // Toggle list only if it's not open or when the toggle icon is clicked or the click wasn't on the selector input.
    if (!this.isOpen || closest(rootTarget, '#toggleIcon', true) !== undefined || (!closest(rootTarget, '#filter', true))) {
      this.toggle();
      this._setListFocus();
    }
  }

  _onKeyDown(e) {
    if (this.readonly) {
      return;
    }

    if (this._isEsc(e)) {
      if (this.isOpen) {
        e.preventDefault();
        this.close();
        this.focus();
      }
      return;
    }

    if (this._isEnter(e)) {
      if (this.isOpen) {
        if (this.extensible && !this.$.itemList.querySelector('div[role="option"]:focus')) {
          this._addItem();
        }

        this._selectItem();
      }

      this.toggle();

      if (this.isOpen && this.filterable) {
        this.$.filter.focus();
      }
    }

    if (this.isOpen) {
      if (this._isDownKey(e)) {
        this._focusNextItem();
        e.preventDefault();
      }

      if (this._isUpKey(e)) {
        this._focusPrevItem();
        e.preventDefault();
      }
    } else {
      if (this._isDownKey(e)) {
        if (this.value === undefined && this.items && this.items.length > 0) {
          this.$.itemList.select(0);
        } else {
          this.$.itemList.selectNext();
        }
        e.preventDefault();
      }

      if (this._isUpKey(e)) {
        if (this.value === undefined && this.items && this.items.length > 0) {
          this.$.itemList.select(this.items.length - 1);
        } else {
          this.$.itemList.selectPrevious();
        }
        e.preventDefault();
      }
    }
  }

  _isUpKey(e) {
    return e.keyCode === 38;
  }
  
  _isDownKey(e) {
    return e.keyCode === 40;
  }
  
  _isEsc(e) {
    return e.keyCode === 27;
  }
  
  _isEnter(e) {
    return e.keyCode === 13;
  }

  _onKeyDownFilter(e) {
    if (this._isEsc(e)) { //esc
      if (this._filterTerm) {
        e.stopPropagation();
      }

      this._filterTerm = '';
    }

    if (this._isUpKey(e) || this._isDownKey(e)) {
      this._setListFocus();
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // Add a new item to the list if the element is extensible.
  _addItem() {
    var label = this.$.filter.value;
    if (label !== '') {
      if (!this._selectByLabel(label)) {
        this.fire('add-item', { label: label });
      }
    }
  }

  _selectByLabel(label) {
    label = String(label).toLowerCase();
    if (Array.isArray(this.items)) {
      for (var i = 0, li = this.items.length; i < li; ++i) {
        if (String(this.items[i].label).toLowerCase() === String(label)) {
          this.value = this.items[i].id;
          return true;
        }
      }
    }

    return false;
  }

  _selectItem() {
    var item = this.$.itemList.querySelector('div[role="option"]:focus');

    if (item) {
      this.value = item.value;
    }
  }

  _setListFocus() {
    var item = this.$.itemList.querySelector('div[role="option"].iron-selected') || this.$.itemList.querySelector('div[role="option"]');

    if (item) {
      item.focus();
    }
  }

  _focusNextItem() {
    var item = this.$.itemList.querySelector('div[role="option"]:focus');
    if (!item) {
      return;
    }

    var next = item.nextElementSibling;

    if (!next || next.tagName !== 'DIV') {
      next = this.$.itemList.querySelector('div[role="option"]');
    }

    if (next) {
      next.focus();
    }
  }

  _focusPrevItem() {
    var item = this.$.itemList.querySelector('div[role="option"]:focus');
    if (!item) {
      return;
    }

    var next = item.previousElementSibling;

    if (!next || next.tagName !== 'DIV') {
      next = this.$.itemList.querySelector('div[role="option"]:last-of-type');
    }

    if (next) {
      next.focus();
    }
  }
}

window.customElements.define('tp-dropdown', TpDropdown);