/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import { LitElement, html, css } from 'lit';

class TpForm extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
        }
      `
    ];
  }

  render() {
    const { } = this;

    return html`
      <slot @slotchange=${this._handleSlotChange}></slot>
    `;
  }

  static get properties() {
    return {
      // Skip validation if true.
      noValidation: { type: Boolean },

      // When true, all child input elements get the readonly attribute set.
      // Only element not currently readonly are considered and only their
      // readonly state is cleared when this property goes false again.
      readonly: { type: Boolean },

      // Holds all invalid controls after the forms `validate` method was invoked.
      // The array can be outdated as it is only build right after the form was
      // submitted and not updated afterwards.
      invalidControls: { type: Array },

      // Holds the original values of all registered form elements.
      _origValues: {
        type: Array,
        value: function() {
          return [];
        }
      },

      // Holds all elements that were set readonly by the form if `readonly` is active.
      _wasSetReadonly: { type: Array },

      _form: { type: Object }
    };
  }

  get _nativeElements() {
    return this.querySelectorAll('input, button, textarea') || [];
  }

  get registeredControls() {
    return [ ...this._controls, ...(Array.from(this._nativeElements).filter(el => !this._isWrapped(el))) ];
  }

  get submitButton() {
    // Check if we have a submit button that is disabled.
    // In this case, don't submit.
    return this._submitButton || this.querySelector('[submit]:not([disabled])') || this.querySelector('[type="submit"]:not([disabled])');
  }

  set submitButton(btn) {
    this._submitButton = btn;
  }

  constructor() {
    super();
    this._origValues = [];
    this._wasSetReadonly = [];

    this._addElement = this._addElement.bind(this);
    this._removeElement = this._removeElement.bind(this);
    this._nativeFormSubmit = this._nativeFormSubmit.bind(this);
    this._nativeFormReset = this._nativeFormReset.bind(this);
  }

  updated(changes) {
    if (changes.has('readonly')) {
      this._readonlyChanged();
    }

    if (changes.has('_form')) {
      this._formAttached(changes.get('_form'), this._form);
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('form-element-register', this._addElement);
    this.addEventListener('form-element-unregister', this._removeElement);

    // Holds all custom elements registered.
    this._controls = [];
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('form-element-register', this._addElement);
    this.removeEventListener('form-element-unregister', this._removeElement);

    this._nodeObserver.disconnect();
    this._nodeObserver = null;
  }

  _handleSlotChange(e) {
    const childNodes = e.target.assignedNodes({flatten: true});
    for (const node of childNodes) {
      if (node.tagName === 'FORM') {
        this._form = node;
      }
    }
  }

  /**
   * Submit the form.
   * This checks if all elements are valid (except validation is turned off).
   * It serializes all form control data into a object.
   * It sends the data via iron-ajax.
   */
  submit() {
    const submitBtns = this.querySelector('[submit]') || this.querySelector('[type="submit"]');
    const enabledSubmitBtns = this.submitButton;

    // Ignore the check if the form doesn't have any submitting elements.
    if (submitBtns && !enabledSubmitBtns) {
      return;
    }

    // Validate form controls.
    if (!this.noValidation && !this.validate()) {
      this.dispatchEvent(new CustomEvent('invalid', { detail: this.invalidControls, bubbles: true, composed: true }));
      return;
    }

    // Get data.
    let data = this.serialize();

    if (this.beforeRequest) {
      const result = this.beforeRequest(data);
      if (result === false) {
        return;
      }

      data = result;
    }

    this.dispatchEvent(new CustomEvent('submit', { detail: data, bubbles: true, composed: true }));
  }

  serialize() {
    const json = {};

    // Serialize all added custom elements.
    for (let i = 0, li = this._controls.length; i < li; i++) {
      if (this._useValue(this._controls[i])) {
        this._addSerializedElement(this._controls[i], json);
      }
    }

    // Also go through the form's native elements.
    for (let i = 0, li = this._nativeElements.length; i < li; i++) {
      const el = this._nativeElements[i];
      // Skip native controls that are wrapped by custom elements already registerd (e.g. <era-input><input></era-input>)
      if (!this._useValue(el) ||
        (this._isWrapped(el) && json[el.name])) {
        continue;
      }
      this._addSerializedElement(el, json);
    }

    return json;
  }

  _addSerializedElement(el, json) {
    // Check if the object syntax is used in the elements name.
    if (el.name.indexOf('.') > -1) {
      const parts = el.name.split('.');
      parts.reduce((json, field, idx) => {
        if (idx < parts.length - 1) {
          json[field] = json[field] || {};
          return json[field];
        } else {
          this._addToJson(field, el.value, json);
        }
      }, json);

      return;
    }

    this._addToJson(el.name, el.value, json);
  }

  _addToJson(field, value, json) {
    // If the name doesn't exist, add it. Otherwise, serialize it to an array.
    if (json[field] === undefined || json[field] === null) {
      json[field] = value !== null && value !== undefined ? value : '';
    } else {
      if (!Array.isArray(json[field])) {
        json[field] = [ json[field] ];
      }
      json[field].push(value || '');
    }
  }

  validate() {
    this.invalidControls = [];
    let valid = true;
    let el;

    // Validate all the custom elements.
    for (let i = 0, li = this._controls.length; i < li; i++) {
      el = this._controls[i];
      if (this._useValue(el)) {
        if (el.validate) {
          const elValid = Boolean(el.validate());
          valid = elValid && valid;

          if (elValid === false) {
            this.invalidControls.push(el);
          }
        }
      }
    }

    // Validate the form's native elements.
    for (let i = 0, li = this._nativeElements.length; i < li; i++) {
      el = this._nativeElements[i];
      if (el.willValidate && el.checkValidity && el.name && !this._isWrapped(el)) {
        const elValid = Boolean(el.checkValidity());
        valid = elValid && valid;

        if (elValid === false) {
          this.invalidControls.push(el);
        }
      }
    }

    return valid;
  }

  reset() {
    for (let i = 0, li = this._origValues.length; i < li; ++i) {
      const item = this._origValues[i];
      item.control.value = this._copyValue(item.value || null, item.control);
      if (typeof item.control.reset === 'function') {
        item.control.reset();
      }
    }
  }

  focusFirstControl() {
    const controls = this.registeredControls;
    if (Array.isArray(controls) && controls.length > 0) {
      controls[0].focus();
    }
  }

  /**
   * Check if some form control's value was changed.
   */
  isChanged() {
    return JSON.stringify(this.serialize()) !== (this._snapshot || '{}');
  }

  /**
   * Cache the current state of all form elements to be able to make a diff
   * later and check if something was changed.
   * `reset` will change all control values back to the last snapshot.
   */
  snapshot() {
    for (let i = 0, li = this._origValues.length; i < li; ++i) {
      const item = this._origValues[i];
      item.value = item.control.value;
    }

    this._snapshot = JSON.stringify(this.serialize());
  }

  _addElement(e) {
    const target = e.composedPath()[0];
    target._parentForm = this;
    this._controls.push(target);

    if (this.readonly) {
      target.setAttribute('readonly', true);
      this._wasSetReadonly.push(target);
    }

    // Store copy of original value in case we want to reset the form.
    this._origValues.push({ control: target, value: this._copyValue(target.value, target) });

    // Stop propagation of the registration event.
    // This allows for nested forms.
    e.stopPropagation();
  }

  _removeElement(e) {
    const target = e.detail.target;
    let index = this._controls.indexOf(target);
    if (index > -1) {
      this._controls.splice(index, 1);
    }

    if (this.readonly) {
      index = this._wasSetReadonly.indexOf(target);
      if (index > -1) {
        this._wasSetReadonly.splice(index, 1);
      }
    }

    // Stop propagation of the event.
    // This allows for nested forms.
    e.stopPropagation();
  }

  _useValue(el) {
    // Skip disabled elements or elements that don't have a `name` attribute.
    if (el.disabled || !el.name) {
      return false;
    }

    // Checkboxes and radio buttons should only use their value if they're checked.
    if (el.type === 'checkbox' ||
      el.type === 'radio' ||
      el.getAttribute('role') === 'checkbox' ||
      el.getAttribute('role') === 'radio') {

      if (el.required) {
        return true;
      } else {
        return el.checked;
      }
    }
    return true;
  }

  _isWrapped(el) {
    try {
      const host = el.assignedSlot.getRootNode().host;
      if (host._parentForm) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }

  _copyValue(value, control) {
    if (control.defaultValue !== undefined || control.hasAttribute('default-value')) {
      value = control.defaultValue || control.getAttribute('default-value');
    }

    let copy;
    switch (typeof value) {
      case 'string':
      case 'number':
      case 'boolean':
        copy = value;
        break;
      case 'object':
        if (Array.isArray(value)) {
          copy = value.slice(0);
        } else if (value === null) {
          copy = null;
        } else if (value instanceof Date) {
          copy = new Date(value.getTime());
        } else {
          copy = Object.assign({}, value);
        }
        break;
    }

    return copy;
  }

  _readonlyChanged() {
    if (this.readonly) {
      this._wasSetReadonly = [];
      const controls = (this._controls || []).concat(Array.from(this._nativeElements) || []);

      for (let i = 0, li = controls.length; i < li; i++) {
        if (!controls[i].getAttribute('readonly') && !controls[i].readonly) {
          this._wasSetReadonly.push(controls[i]);
          controls[i].setAttribute('readonly', true);
        }
      }
    } else if (this._wasSetReadonly) {
      for (let i = 0, li = this._wasSetReadonly.length; i < li; i++) {
        this._wasSetReadonly[i].readonly = false;
        this._wasSetReadonly[i].removeAttribute('readonly');
      }
      this._wasSetReadonly = [];
    }

    if (this.readonly) {
      this.setAttribute('readonly', '');
    } else {
      this.removeAttribute('readonly');
    }
  }

  _formAttached(oldFrm, newFrm) {
    if (oldFrm) {
      oldFrm.removeEventListener('submit', this._nativeFormSubmit);
      oldFrm.removeEventListener('reset', this._nativeFormReset);
    }

    newFrm.addEventListener('submit', this._nativeFormSubmit);
    newFrm.addEventListener('reset', this._nativeFormReset);
  }

  _nativeFormSubmit(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    this.submit();
  }

  _nativeFormReset() {
    this.reset();
  }
}

window.customElements.define('tp-form', TpForm);