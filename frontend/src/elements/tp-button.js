/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import './tp-spinner.js';
import './tp-icon.js';
import { LitElement, html, css, svg } from 'lit';
import { eventHelpers } from '../helpers/event-helpers.js';

class TpButton extends eventHelpers(LitElement) {
  static get styles() {
    return css`
      :host {
        display: inline-block;
        outline: none;
        border-radius: var(--tp-button-border-radius, 3px);
        background: var(--tp-button-bg, #0277bd);
        line-height: var(--tp-button-icon-height, 24px);
        color: var(--tp-button-color, #ffffff);
      }

      :host([disabled]) {
        cursor: auto;
        pointer-events: none;
        background: var(--tp-button-bg-disabled, #9E9E9E);
        color: var(--tp-button-color-disabled, rgba(255,255,255, 0.5));
      }

      :host(:hover) {
        background: var(--tp-button-bg-hover, #039BE5);
        color: var(--tp-button-color-hover, #ffffff);
      }

      :host(:focus),
      :host(:active) {
        background: var(--tp-button-bg-focus, #039BE5);
        color: var(--tp-button-color-focus, #ffffff);
      }

      :host(:hover) .wrap {
        box-shadow: var(--tp-button-box-shadow-hover, none);
      }

      :host(:focus) .wrap,
      :host(:active) .wrap {
        box-shadow: var(--tp-button-box-shadow-focus, none);
      }

      .wrap {
        position: relative;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--tp-button-padding, 6px 10px);
        border-radius: inherit;
        box-shadow: var(--tp-button-box-shadow, none);
        transition: background var(--tp-button-animation-duration, 300ms) ease-in-out, box-shadow var(--tp-button-animation-duration, 300ms) ease-in-out;
        cursor: pointer;
      }

      .wrap.success-bg {
        background: var(--tp-button-bg-success, green);
        box-shadow: var(--tp-button-box-shadow-success, 0 0 10px rgba(0, 128, 0, 0.83)) !important;
      }

      .wrap.error-bg {
        background: var(--tp-button-bg-error, red);
        box-shadow: var(--tp-button-box-shadow-error, 0 0 10px rgba(255, 0, 0, 0.83)) !important;
      }

      .label {
        display: flex;
        flex-direction: row;
        align-items: center;
        text-align: center;
        transition: opacity var(--tp-button-animation-duration, 300ms) ease-in-out;
      }

      .success,
      .error,
      .spinner {
        position: absolute;
        margin: auto;
        opacity: 0;
        transition: opacity var(--tp-button-animation-duration, 300ms) ease-in-out;
      }

      .spinner {
        --tp-spinner-width: var(--tp-button-spinner-width, 15px);
        --tp-spinner-height: var(--tp-button-spinner-height, 15px);
        --tp-spinner-color1: var(--tp-button-spinner-color1, #81D4FA);
        --tp-spinner-color2: var(--tp-button-spinner-color2, #039BE5);
        --tp-spinner-border-width: var(--tp-button-spinner-border-width; 3px);
      }

      .fade-out,
      .fade-in {
        opacity: 0;
      }

      .fade-in {
        opacity: 1;
      }

      tp-icon {
        --tp-icon-height: var(--tp-button-icon-height, 24px);
        --tp-icon-width: var(--tp-button-icon-width, 24px);
      }
    `;
  }

  render() {
    return html`
      <div class="wrap">
        <div class="label">
          <slot></slot>
        </div>
        ${this.extended ? html`
          <tp-icon class="success" .icon=${TpButton.successIcon}></tp-icon>
          <tp-icon class="error" .icon=${TpButton.errorIcon}></tp-icon>
          <tp-spinner class="spinner"></tp-spinner>
        ` : null}
      </div>
    `;
  }

  static get properties() {
    return {
      submit: { type: Boolean },
      extended: { type: Boolean },
    };
  }

  static get successIcon() {
    return svg`<path fill="var(--tp-button-success-icon-color, #ffffff)" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />`;
  }

  static get errorIcon() {
    return svg`<path fill="var(--tp-button-success-icon-color, #ffffff)" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />`;
  }

  get _wrapEl() {
    return this.shadowRoot.querySelector('.wrap');
  }

  get _labelEl() {
    return this.shadowRoot.querySelector('.label');
  }

  get _successEl() {
    return this.shadowRoot.querySelector('.success');
  }

  get _errorEl() {
    return this.shadowRoot.querySelector('.error');
  }

  get _spinnerEl() {
    return this.shadowRoot.querySelector('.spinner');
  }

  constructor() {
    super();

    this.submit = false;
    this._queue = [];
  }

  connectedCallback() {
    super.connectedCallback();

    this.duration = parseInt(getComputedStyle(this).getPropertyValue('--tp-button-animation-duration'), 10) || 200;
    this.pause = parseInt(getComputedStyle(this).getPropertyValue('--tp-button-animation-pause'), 10) || 300;

    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'button');
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unlisten(this, 'keypress', '_keyPressed');

    if (this._form) {
      this._unlisten(this._form, 'submit', '_onFormSubmit');
      this._unlisten(this._form, 'error', '_onFormFailed');
      this._unlisten(this._form, 'invalid', '_onFormFailed');
      this._unlisten(this._form, 'response', '_onFormSuccess');
    }
  }

  shouldUpdate(changes) {
    if (changes.has('submit') && this.submit) {
      this.extended = true;
    }

    return true;
  }

  updated(changes) {
    if (changes.has('submit') && this.submit) {
      this._form = this._findSubmitTarget();

      if (this._form === undefined) {
        console.warn(this.tagName + ': No parent form found!');
        this.submit = false;
      } else {
        this._listen(this, 'click', '_submitOnTap');
        this._listen(this._form, 'submit', '_onFormSubmit');
        this._listen(this._form, 'error', '_onFormFailed');
        this._listen(this._form, 'invalid', '_onFormFailed');
        this._listen(this._form, 'response', '_onFormSuccess');
      }
    }
  }

  async showSuccess() {
    if (!this.extended) {
      console.warn(this.tagName + ': Is not in extended mode!');
      return;
    }

    if (this._isAnimating) {
      this._queue.push('showSuccess');
      return;
    }

    this._wrapEl.classList.add('success-bg');
    await this._switch(this._successEl);
    await this._wait(this.pause);
    this._wrapEl.classList.remove('success-bg');
    await this._switch(this._labelEl);
  }

  async showError() {
    if (!this.extended) {
      console.warn(this.tagName + ': Is not in extended mode!');
      return;
    }

    if (this._isAnimating) {
      this._queue.push('showError');
      return;
    }

    this._wrapEl.classList.add('error-bg');
    await this._switch(this._errorEl);
    await this._wait(this.pause);
    this._wrapEl.classList.remove('error-bg');
    await this._switch(this._labelEl);
  }

  showSpinner() {
    if (!this.extended) {
      console.warn(this.tagName + ': Is not in extended mode!');
      return;
    }

    if (this._isAnimating) {
      this._queue.push('showSpinner');
      return;
    }

    this._switch(this._spinnerEl);
  }

  hideSpinner() {
    if (!this.extended) {
      console.warn(this.tagName + ': Is not in extended mode!');
      return;
    }

    if (this._isAnimating) {
      this._queue.push('hideSpinner');
      return;
    }

    this._switch(this._labelEl);
  }

  async _switch(el) {
    this._isAnimating = true;

    await this.updateComplete;
    const visEl = this._visEl || this._labelEl;
    visEl.classList.remove('fade-in');
    visEl.classList.add('fade-out');
    await this._wait(this.duration);
    el.classList.remove('fade-out');
    el.classList.add('fade-in');
    await this._wait(this.duration);
    this._visEl = el;

    this._isAnimating = false;

    if (this._queue.length > 0) {
      const cmd = this._queue.shift();
      this[cmd]();
    }
  }

  _wait(time) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  _keyPressed(e) {
    if (e.keyCode === 13) {
      if (this._form) {
        this._submitOnTap();
      } else {
        this.click();
      }
    }
  }

  _submitOnTap() {
    if (this.submit && !this.isSubmitting) {
      this._form.submitButton = this;
      this._form.submit();
    }
  }

  _onFormSubmit() {
    if (this._form.action) {
      this.showSpinner();
    }
  }

  _onFormSuccess() {
    this._isSubmitting = false;
    this.showSuccess();
  }

  _onFormFailed(e) {
    // Only react if this button instance was the actual pressed button.
    // We have to check this in case the parent form has multiple submit buttons.
    if (this._form.submitButton === this) {
      if (e) {
        if (e.composedPath()[0] !== this._form) {
          return;
        }
      }

      this._isSubmitting = false;
      this.showError();
    }
  }

  _findSubmitTarget() {
    let target;
    const root = this.getRootNode() || document;
    if (this.submit.length > 0) {
      target = root.querySelector(this.submit);
    }

    if (!target) {
      target = this._closest(this, 'tp-form, form[is="iron-form"]', true);
    }

    return target;
  }
}

window.customElements.define('tp-button', TpButton);
