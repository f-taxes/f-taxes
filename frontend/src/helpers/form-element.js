/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

export const FormElement = function(superClass) {
  return class extends superClass {
    static get properties() {
      return {
        // The name of this element.
        name: { type: String },

        // The value for this element.
        value: { type: String },

        // Set to true to mark the input as required. Element needs to provide a "validate()" function tha returns a boolean.
        required: { type: Boolean },

        // The form that the element is registered to. Set by the form that got the registration.
        parentForm: { type: Object }
      };
    }

    connectedCallback() {
      super.connectedCallback();

      // Prevent that child elements register.
      this.addEventListener('form-element-register', this._onChildRegister.bind(this));
    }

    firstUpdated() {
      super.firstUpdated();
      this.dispatchEvent(new CustomEvent('form-element-register', { bubbles: true, composed: true }));
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._parentForm) {
        this._parentForm.dispatchEvent(new CustomEvent('form-element-unregister', { detail: { target: this }, bubbles: true, composed: true }));
      }
    }

    // Prevent that child elements register themselves to the form element.
    _onChildRegister(e) {
      if (e.composedPath()[0].tagName !== this.tagName) {
        e.stopPropagation();
      }
    }
  };
}