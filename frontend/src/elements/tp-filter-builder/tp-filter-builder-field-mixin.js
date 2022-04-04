/**
@license
Copyright (c) 2018 EDV Wasmeier
*/

import { ControlState } from '@tp/helpers/control-state';

export const FilterBuilderField = function(superClass) {
  return class extends ControlState(superClass) {

    static get properties() {
      return {
        field: { type: String },

        // List of all available fields to filter.
        fields: { type: Array },

        filter: { type: String },

        value: { type: Object },

        options: { type: Object },

        // "And" group index the filter belongs to.
        aidx: { type: Number },

        // Index in the "and" group the filter belongs to.
        fidx: { type: Number }
      };
    }

    updateValue(field, value) {
      this[field] = value;

      const data = {
        type: this.type,
      };

      if (this.options) {
        data.options = this.options;
      }

      if (this.value !== undefined && this.value !== null) {
        data.value = this.value;
      }

      this.dispatchEvent(new CustomEvent('updated', { detail: { ...data, ...this.shadowRoot.querySelector('tp-form').serialize() } , bubbles: true, composed: true }));
    }
  };
};
