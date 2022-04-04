/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import '@tp/tp-input/tp-input.js';
import { ControlState } from '@tp/helpers/control-state.js';
import { EventHelpers } from '@tp/helpers/event-helpers.js';
import { FormElement } from '@tp/helpers/form-element.js';
import { LitElement, html, css } from 'lit';
import { format, parse, parseISO, isAfter, isValid, endOfDay } from 'date-fns/esm';
import { zonedTimeToUtc } from 'date-fns-tz';

class TpDateInput extends EventHelpers(ControlState(FormElement(LitElement))) {
  static get styles() {
    return [
      css`
        :host {
          display: block;
        }

        .wrap {
          display: grid;
          grid-template-columns: auto auto auto auto auto;
          border-radius: 2px;
          border: solid 1px #000;
        }

        .wrap > div {
          align-self: center;
        }

        tp-input {
          width: 30px;
          text-align: center;
        }
        
        tp-input::part(wrap) {
          border-style: none;
        }

        tp-input.bigger {
          width: 50px;
        }

        .under {
          position: relative;
        }

        .error-message {
          position: absolute;
          top: -5px;
          left: 0;
          font-size: 10px;
          color: var(--tp-input-text-color-invalid, #B71C1C);
          transition: opacity 0.3s;
          opacity: 0;
          will-change: opacity;
        }

        :host([invalid]) .error-message {
          opacity: 1;
        }
      `
    ];
  }

  render() {
    const { autoValidate, delimiter, readonly, required, errorMessage } = this;

    return html`
      <div class="wrap" part="wrap">
        <tp-input .value=${this._input0} @input=${e => this._input0 = e.target.value} @change=${this._inputChanged} .validator=${this._setValidator(0)} allowed-pattern="[0-9]" .auto-validate=${autoValidate} .readonly=${readonly} .required=${required}>
          <input type="text" placeholder=${this._setPlaceholder(0)}>
        </tp-input>
        <div>${delimiter}</div>
        <tp-input .value=${this._input1} @input=${e => this._input1 = e.target.value} @change=${this._inputChanged} .validator=${this._setValidator(1)} allowed-pattern="[0-9]" .auto-validate=${autoValidate} .readonly=${readonly} .required=${required}>
          <input type="text" placeholder=${this._setPlaceholder(1)}>
        </tp-input>
        <div>${delimiter}</div>
        <tp-input class="bigger" .value=${this._input2} @input=${e => this._input2 = e.target.value} @change=${this._inputChanged} .validator=${this._setValidator(2)} allowed-pattern="[0-9]" .auto-validate=${autoValidate} .readonly=${readonly} .required=${required}>
          <input type="text" placeholder=${this._setPlaceholder(2)}>
        </tp-input>
      </div>
      ${errorMessage ? html`
      <div class="under">
        <div class="error-message">${errorMessage}</div>
      </div>
      ` : null}
    `;
  }

  static get properties() {
    return {
      // Format of the date.
      // Supports MM, dd and y. The order specifies how the input fields are labeled.
      // The delimiter is also taken from the supplied format.
      format: { type: String },

      // Date object with the currently selected date.
      date: { type: Object },

      // If true, let value default to the date of today.
      today: { type: Boolean },

      required: { type: Boolean },

      autoValidate: { type: Boolean },

      // If true, the entered date is invalid.
      invalid: { type: Boolean, reflect: true },

      // Error message to show if the date is invalid.
      errorMessage: { type: String },

      optional: { type: Boolean },

      // Range of years in the future that are selectable in the date-picker.
      maxYear: { type: Number },

      // Range of years in the past that are selectable in the date-picker.
      minYear: { type: Number },

      // Maximum date that can be selected. Everything after will be disabled.
      // Set it to `today` to automatically allow dates till today (inclusive).
      // Expects 'today' or a ISO Date string.
      maxDate: { type: String },

      delimiter: { type: String },

      timeZone: { type: String },

      _setValidator: { type: Array },
      _inputAssign: { type: Array },
    };
  }

  constructor() {
    super();
    this.format = 'MM-dd-y';
    this.required = false;
    this.autoValidate = false;
    this.invalid = false;
    this.optional = false;
    this.maxYear = 10;
    this.minYear = 10;
    this._inputAssign = [];
    this._formatChanged();
  }

  get inputs() {
    if (!this._inputs) {
      this._inputs = this.shadowRoot.querySelectorAll('tp-input');
    }
    return this._inputs;
  }

  shouldUpdate(changes) {
    if (changes.has('format')) {
      this._formatChanged();
    }

    if (changes.has('value')) {
      this._onValueChanged();
    }

    return this._inputAssign.length > 0;
  }

  firstUpdated() {
    super.firstUpdated();
    this.listen(this, 'input', '_autoMoveCursor');
  }

  // Returns current validation state of the control.
  validate() {
    this.inputs[0].validate();
    this.inputs[1].validate();
    this.inputs[2].validate();

    if (this.optional && this.inputs[0].value === '' && this.inputs[1].value === '' && this.inputs[2].value === '') {
      this.invalid = false;
      return true;
    }

    const maxDate = this._getMaxDate(this.maxDate);

    if ((this.inputs[0].invalid || this.inputs[1].invalid || this.inputs[2].invalid) ||
        !this.dateValid(this.value, maxDate)) {
      this.invalid = true;
      return false;
    }

    this.invalid = false;
    return true;
  }

  focus() {
    this.inputs[0].select();
  }

  /**
  * Test is a date is selectable when considering all restricting options
  * of the control, like enabledDates, maxDate, ...
  */
  dateValid(date, maxDate, enabledDates) {
    date = this._toDate(date);

    if (isValid(date) === false) {
      return false;
    }

    maxDate = maxDate || this.maxDate;
    enabledDates = enabledDates || [];

    if ((enabledDates.length > 0 && enabledDates.indexOf(date) === -1) ||
        (maxDate && isAfter(date, maxDate))) {
      return false;
    }
    return true;
  }

  /**
  * Reset the control if a parent tp-form is reset.
  */
  reset() {
    this._input0 = '';
    this._input1 = '';
    this._input2 = '';
    this.shadowRoot.querySelectorAll('tp-input').forEach(el => el.invalid = false);
    this.invalid = false;
    this.value = null;

    if (this.today) {
      this._setToday();
    }
  }

  _inputChanged() {
    const i0 = this._input0;
    const i1 = this._input1;
    const i2 = this._input2;

    if (i0 === '' && i1 === '' && i2 === '' && this.optional) {
      this.date = null;
      this.value = null;
      this.invalid = false;
      return;
    }

    if (
      i0 === '' || i1 === '' || i2 === '' ||
      !this.inputs[0].validate() || !this.inputs[1].validate() || !this.inputs[2].validate()
    ) {
      if (this.focused) {
        this.date = null;
        this.value = null;
        if (this.autoValidate) {
          this.invalid = true;
        }
      }
      return;
    }

    const date = parse(i0 + '-' + i1 + '-' + i2, this._inputAssign.join('-'), new Date());

    if (isValid(date)) {
      this.inputs[0].invalid = false;
      this.inputs[1].invalid = false;
      this.inputs[2].invalid = false;
      this.date = this.timeZone ? zonedTimeToUtc(date, this.timeZone) : date;
      this.value = this.date.toISOString();
      this.invalid = false;
    } else {
      this.inputs[0].invalid = true;
      this.inputs[1].invalid = true;
      this.inputs[2].invalid = true;
      this.date = null;
      this.value = null;
      if (this.autoValidate) {
        this.invalid = true;
      }
    }
  }

  _setValidator(idx) {
    switch (this._inputAssign[idx]) {
      case 'dd':
        return this._validateDay;
      case 'MM':
        return this._validateMonth;
      case 'y':
        return this._validateYear;
    }
  }

  _validateDay(el, value) {
    if (typeof value !== 'string') {
      return false;
    }

    if (/^[0-9]+$/.test(value) !== true) {
      return false;
    }

    var v = parseInt(value, 10);
    return v >= 1 && v <= 31;
  }

  _validateMonth(el, value) {
    if (typeof value !== 'string') {
      return false;
    }

    if (/^[0-9]+$/.test(value) !== true) {
      return false;
    }

    var v = parseInt(value, 10);
    return v >= 1 && v <= 12;
  }

  _validateYear(el, value) {
    if (typeof value !== 'string') {
      return false;
    }

    if (/^[0-9]+$/.test(value) !== true) {
      return false;
    }

    var v = parseInt(value, 10);
    return v >= 1900;
  }

  _setPlaceholder(idx) {
    switch (this._inputAssign[idx]) {
      case 'dd':
        return 'DD';
      case 'MM':
        return 'MM';
      case 'y':
        return 'YYYYY';
    }
  }

  _formatChanged() {
    if (!this.format) return;

    const types = ['MM', 'dd', 'y'];
    this._inputAssign = [];
    this.delimiter = this._determineDelimiter(this.format);

    const parts = this.format.split(this.delimiter);
    if (parts.length < 2) {
      console.warn(this.tagName + ': Unknown format. Fallback to format MM-dd-y');
      this.format = 'MM-dd-y';
      return;
    }

    for (let i = 0; i <= 2; ++i) {
      for (let a = 0, la = types.length; a < la; ++a) {
        if (types[a] === parts[i] || types[a] === parts[i].toLowerCase()) {
          parts[i] = parts[i] !== 'MM' ? parts[i].toLowerCase() : parts[i];
          this._inputAssign.push(parts[i]);
        }
      }
    }

    if (this.value) {
      this._onValueChanged();
    }
  }

  _determineDelimiter(format) {
    if (format.indexOf('-') > -1) {
      return '-';
    }
    if (format.indexOf('/') > -1) {
      return '/';
    }
    if (format.indexOf('.') > -1) {
      return '.';
    }
    return '/';
  }

  // Reset invalid state if value was changed.
  // This clears up old invalid states if the value was changed programmatically.
  _onValueChanged() {
    // If the control is focused we ignore a programmatically set value because
    // the user may works with the element right now.
    if (this.focused) {
      return;
    }

    this.invalid = false;

    if (!this.value || this.value === 'Invalid date') {
      this.date = null;
      this.value = null;
      this._input0 = '';
      this._input1 = '';
      this._input2 = '';
      return;
    }

    const date = this._toDate(this.value);

    if (this.value instanceof Date) {
      this.value = this.value.toISOString();
    }

    this._input0 = format(date, this._inputAssign[0]);
    this._input1 = format(date, this._inputAssign[1]);
    this._input2 = format(date, this._inputAssign[2]);
    this.date = date;
  }

  _setToday() {
    if (this.today) {
      setTimeout(() => {
        if (!this.value) {
          this.value = new Date().toISOString();
        }
      });
    }
  }

  _getMaxDate(maxDate) {
    if (typeof maxDate !== 'string') return null;
    if (maxDate.toLowerCase() === 'today') {
      return endOfDay(new Date());
    }
    return this._toDate(maxDate);
  }

  _autoMoveCursor(e) {
    const target = e.composedPath().find(node => node.tagName === 'TP-INPUT');
    const idx = Array.from(this.inputs).findIndex(node => node === target);
    if (target.value.length === 2 && idx < 2) {
      this.inputs[idx + 1].select();
    }
  }

  _toDate(value) {
    if (typeof value === 'string') {
      return parseISO(value);
    } else {
      return value;
    }
  }
}

window.customElements.define('tp-date-input', TpDateInput);
