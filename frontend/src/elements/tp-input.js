/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import { LitElement, html, css } from 'lit';
import { FormElement } from '../helpers/form-element.js';
import { EventHelpers } from '../helpers/event-helpers.js';
import { ControlState } from '../helpers/control-state.js';
import { Inert } from '../helpers/inert.js';

const mixins = [
  FormElement,
  EventHelpers,
  ControlState,
  Inert
];

const BaseElement = mixins.reduce((baseClass, mixin) => {
  return mixin(baseClass);
}, LitElement);

class TpInput extends BaseElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
          position: relative;
          outline: none;
          font-size: 14px;
        }
        
        .wrap ::slotted(input) {
          outline: none;
          box-shadow: none;
          padding: 0;
          width: 100%;
          min-width: 0; /** Because of FF **/
          background: transparent;
          border: none;
          font-family: inherit;
          font-size: inherit;
          text-align: inherit;
          color: inherit; /** FF seems to need this **/
        }
        
        .error-message {
          position: absolute;
          z-index: 1;
          left: 0;
          right: 0;
          font-size: 10px;
          color: var(--tp-input-text-color-invalid, #B71C1C);
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
        
        .wrap {
          display: flex;
          flex-direction: row;
          padding: 5px;
          border-radius: 2px;
          border: solid 1px #000;
        }

        .prefix, .suffix {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }

        .prefix ::slotted([slot="prefix"]) {
          padding-right: 5px;
        }

        .suffix ::slotted([slot="suffix"]) {
          padding-left: 5px;
        }
      `
    ];
  }

  render() {
    const { errorMessage } = this;

    return html`
      <div class="wrap" part="wrap">
        <div class="prefix">
          <slot name="prefix"></slot>
        </div>
        <slot id="content"></slot>
        <div class="suffix">
          <slot name="suffix"></slot>
        </div>
      </div>
      ${errorMessage ? html`
        <div class="error-message" part="error-message">${errorMessage}</div>
      ` : null}
    `;
  }

  static get properties() {
    return {
      // The value for this element.
      value: { type: String },

      // If true the control can't be edited.
      disabled: { type: Boolean, reflect: true },

      // If true, something invalid was entered.
      invalid: { type: Boolean, reflect: true },

      /*
       * Force invalid state no matter what.
       * Useful if the input must be invalid even if the value itself would be valid.
       * For example: Event if a valid email address was entered, an external test that makes a DNS check for the domain may fail.
       * In this case we still want to force the invalid state.
       */
      forceInvalid: { type: Boolean },

      /*
       * Regex pattern to live check the input.
       * Invalid input is blocked and never shown.
       * If you wan't live validation without blocking input use `pattern` and `auto-validate`.
       */
      allowedPattern: { type: String },

      /*
       * Error message to show if the value is invalid.
       */
      errorMessage: { type: String },

      /*
       * Validate while the control receives input.
       */
      autoValidate: { type: Boolean },

      /*
       * A custom validator function for checking the value.
       */
      validator: { type: Object },

      /*
       * Query selector to another input element.
       * The input's value must the be equal to the other input in order to be valid.
       */
      equalTo: { type: String },

      type: { type: String },

      optional: { type: Boolean },

      readonly: { type: Boolean, reflect: true },

      /* @private */
      _previousValidInput: { type: String, value: '' }
    };
  }

  constructor() {
    super();
    this.value = '';
  }

  get inputEl() {
    const slot = this.shadowRoot.querySelector('#content');
    return slot.assignedNodes({ flatten: true }).filter(n => n.tagName === 'INPUT')[0];
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.unlisten(this._equalToTarget, 'input', '_onInput');
  }

  firstUpdated() {
    super.firstUpdated();

    if (!this.inputEl) {
      console.warn(this.tagName + ': Cannot find input child!');
      return;
    }

    this.listen(this.inputEl, 'input', '_onInput');
    this.listen(this.inputEl, 'keypress', '_onKeypress');

    if (this.value !== '' && this.value !== undefined && this.inputEl.value === '') {
      this._onInput(); // Force validation
    }

    if (this.name === undefined && this.inputEl.name) {
      this.name = this.inputEl.name;
    }

    if (this.inputEl.name) {
      console.warn(this.tagName + ': Can\'t have a name on the inner input.');
      this.inputEl.removeAttribute('name');
    }

    if (this.value === undefined) {
      this.value = this.inputEl.value;
    }

    if (this.equalTo) {
      this.listen(this._equalToTarget, 'input', '_onInput');
    }
  }

  updated(changes) {
    if (changes.has('optional')) {
      this._optionalChanged(changes.get('optional'));
    }

    if (changes.has('forceInvalid')) {
      this._forceInvalidChanged();
    }

    if (changes.has('value')) {
      this._syncValue();
    }
  }

  get _equalToTarget() {
    if (this._eqTarget) {
      return this._eqTarget;
    }

    // Make sure the input wants a `equalTo` target.
    if (!this.equalTo) {
      return;
    }

    const root = this.getRootNode();
    this._eqTarget = root.querySelector(this.equalTo) || root.host.querySelector(this.equalTo);
    if (!this._eqTarget || this._eqTarget.value == undefined) {
      console.warn(this.tagName + ': Unable to find element to match against or target doesn\'t have a value property.', this);
    }
    return this._eqTarget;
  }

  get _valueRegEx() {
    if (this.allowedPattern) {
      return new RegExp(this.allowedPattern);
    } else {
      switch (this.type) {
        case 'number': {
          return /[0-9.,e-]/;
        }
      }
    }
  }

  _onInput() {
    this._inputWasChanged = true;
    if (this.allowedPattern && !this._patternAlreadyChecked) {
      const valid = this._checkPatternValidity();
      if (!valid) {
        this.inputEl.value = this._previousValidInput;
      }
    }

    this.value = this._previousValidInput = this.inputEl.value;
    this._patternAlreadyChecked = false;

    if (this.autoValidate) {
      this.validate();
    }
  }

  select() {
    this.inputEl.select();
  }

  _onKeypress(e) {
    // Submit form if `Enter` key is pressed.
    if (e.keyCode === 13 && this._parentForm) {
      this._parentForm.submit();
      e.preventDefault();
      return;
    }

    if (!this.allowedPattern && this.type !== 'number') {
      return;
    }

    const regex = this._valueRegEx;
    if (!regex) {
      return;
    }

    // Handle special keys and backspace
    if (e.metaKey || e.ctrlKey || e.altKey) {
      return;
    }

    // Check the pattern either here or in `_onInput`, but not in both.
    this._patternAlreadyChecked = true;

    const thisChar = String.fromCharCode(e.charCode);
    if (this._isPrintable(e) && !regex.test(thisChar)) {
      e.preventDefault();
      this._announceInvalidCharacter('Invalid character ' + thisChar + ' not entered.');
    }
  }

  _checkPatternValidity() {
    const regex = this._valueRegEx;
    if (!regex) {
      return true;
    }
    for (let i = 0; i < this.inputEl.value.length; i++) {
      if (!regex.test(this.inputEl.value[i])) {
        return false;
      }
    }
    return true;
  }

  _isPrintable(e) {
    // What a control/printable character is varies wildly based on the browser.
    // - most control characters (arrows, backspace) do not send a `keypress` event
    //   in Chrome, but the *do* on Firefox
    // - in Firefox, when they do send a `keypress` event, control chars have
    //   a charCode = 0, keyCode = xx (for ex. 40 for down arrow)
    // - printable characters always send a keypress event.
    // - in Firefox, printable chars always have a keyCode = 0. In Chrome, the keyCode
    //   always matches the charCode.
    // None of this makes any sense.

    // For these keys, ASCII code == browser keycode.
    const anyNonPrintable =
      (e.keyCode == 8)   ||  // backspace
      (e.keyCode == 9)   ||  // tab
      (e.keyCode == 13)  ||  // enter
      (e.keyCode == 27);     // escape

    // For these keys, make sure it's a browser keycode and not an ASCII code.
    const mozNonPrintable =
      (e.keyCode == 19)  ||  // pause
      (e.keyCode == 20)  ||  // caps lock
      (e.keyCode == 45)  ||  // insert
      (e.keyCode == 46)  ||  // delete
      (e.keyCode == 144) ||  // num lock
      (e.keyCode == 145) ||  // scroll lock
      (e.keyCode > 32 && e.keyCode < 41)   || // page up/down, end, home, arrows
      (e.keyCode > 111 && e.keyCode < 124); // fn keys

    return !anyNonPrintable && !(e.charCode == 0 && mozNonPrintable);
  }

  _syncValue() {
    if (this.inputEl === undefined) return;

    if (this.inputEl.value !== this.value) {
      this.inputEl.value = this.value === undefined || this.value === null ? '' : this.value;
    }
  }

  _forceInvalidChanged() {
    if (!this.autoValidate || !this.inputEl || !this._inputWasChanged) return;

    if (this.forceInvalid) {
      this.invalid = true;
    }

    if (!this.forceInvalid) {
      this.invalid = this.validate();
    }
  }

  /**
  * Validate the controls value.
  */
  validate() {
    if (this.forceInvalid) {
      this.invalid = true;
      return false;
    }

    const valueIsFalsy = this.value === null || this.value === undefined || this.value === '';

    // Run native validation first.
    let valid = this.inputEl.checkValidity();

    // Then check if control is optional. If so and the value is falsy, assume valid.
    if (this.optional && valueIsFalsy) {
      valid = true;
    } else if (this.required && valueIsFalsy) {
      valid = false;
    } else if (typeof this.validator === 'function' && !this.validator(this, this.value)) {
      valid = false;
    }

    if (this.equalTo && this._equalToTarget && this.value !== this._equalToTarget.value) {
      valid = false;
    }

    this.invalid = !valid;

    return valid;
  }

  // Reset invalid state if value was changed.
  // This clears up old invalid states if the value was changed programmatically.
  _onValueChanged() {
    this.invalid = false;
  }

  focus() {
    this.inputEl.focus();
  }

  /**
  * Reset the control if a parent era-form is reset.
  */
  reset() {
    this.invalid = false;
  }

  _equalToChanged() {
    this.required = Boolean(this.equalTo);
  }

  // If the control is dynamically set completely optional, clear invalid state.
  _requiredChanged(newValue, oldValue) {
    if (oldValue !== undefined && (this.invalid || this.autoValidate)) {
      this.validate();
    }
  }

  _syncReadonly() {
    if (this.inputEl) {
      if (this.readonly) {
        this.inputEl.setAttribute('readonly', '');
      } else {
        this.inputEl.removeAttribute('readonly');
      }
    }
  }

  _announceInvalidCharacter(message) {
    this.fire('iron-announce', { text: message });
  }

  _optionalChanged(oldValue) {
    if (oldValue === undefined) return;

    if (this.required === true && this.autoValidate === true) {
      this.validate();
    }
  }
}

window.customElements.define('tp-input', TpInput);