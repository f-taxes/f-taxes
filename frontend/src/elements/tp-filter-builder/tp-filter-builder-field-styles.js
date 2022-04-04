import { css } from 'lit';

export default css`
  :host {
    display: inline-block;
  }
  
  [hidden] {
    display: none !important;
  }
  
  .wrap {
    display: flex;
    align-items: center;
  }
  
  tp-dropdown.field,
  tp-dropdown.filter,
  tp-dropdown.value {
    padding: 2px 5px;
    background: var(--tp-filter-builder-bg);
    min-width: 100px;
    --tp-dropdown-selector-icon-color: var(--tp-filter-builder-icon-color);
  }

  tp-dropdown.field {
    border-radius: 4px 0 0 4px;
  }

  tp-dropdown.filter {
    border-radius: 0;
  }

  tp-dropdown::part(selector) {
    border-radius: 4px;
    border-style: none;
  }

  tp-dropdown::part(selector) {
    color: var(--tp-filter-builder-color);
  }

  tp-dropdown::part(list) {
    color: var(--tp-filter-builder-list-color);
  }

  tp-dropdown + tp-dropdown {
    margin-left: 1px;
  }

  tp-input {
    border: none;
    outline: none;
    background: var(--tp-filter-builder-bg);
    margin-left: 1px;
  }

  tp-input::part(wrap) {
    border: none;
    background: var(--tp-filter-builder-input-bg)
  }

  .remove {
    display: flex;
    align-items: center;
    background: var(--tp-filter-builder-bg);
    padding: 5px;
    border-radius: 0 4px 4px 0;
    margin-left: 1px;
    --tp-icon-width: 18px;
    --tp-icon-height: 18px;
  }

  .remove:hover {
    background: var(--tp-filter-builder-bg-hover);
    --tp-filter-builder-icon-color: var(--tp-filter-builder-color-hover);
  }
`;