import { css } from 'lit';

export default css`
  h2 {
    font-weight: normal;
    font-size: 22px;
  }

  h3 {
    font-weight: normal;
    font-size: 18px;
    margin: 0;
    padding: 0;
  }

  tp-button tp-icon {
    margin-left: 10px;
    --tp-icon-height: 18px;
    --tp-icon-width: 18px;
    --tp-icon-color: var(--text);
  }

  tp-button:hover tp-icon,
  tp-button:focus tp-icon {
    --tp-icon-color: var(--text-dark);
  }

  tp-input::part(wrap) {
    font-size: 18px;
    background: var(--input-bg);
    border: var(--input-border);
  }

  tp-input[focused]::part(wrap) {
    border: solid 1px var(--hl1);
  }

  tp-input::part(error-message) {
    font-size: 14px;
  }

  tp-dropdown {
    color: var(--text-dark);
    --tp-dropdown-filter-icon-color: var(--text-dark);
  }

  tp-dropdown::part(selector) {
    color: var(--text);
    padding: 5px;
    font-size: 18px;
    background: var(--input-bg);
    border: var(--input-border);
    --tp-dropdown-selector-icon-color: var(--text);
    --tp-dropdown-filter-icon-color: var(--text);
    --tp-dropdown-add-icon-color: var(--text);
  }

  tp-dropdown[focused]::part(selector) {
    border: solid 1px var(--hl1);
  }

  tp-dropdown::part(filterWrap) {
    border: none;
  }

  tp-dropdown::part(filter) {
    background: #d8d8d8;
  }

  .buttons-justified {
    margin-top: 30px;
    display: flex;
    justify-content: space-between;
  }

  .buttons-justified tp-button + tp-button {
    margin-left: 20px;
  }

  tp-dialog h2 {
    margin: 0 0 20px 0;
  }

  tp-form tp-input,
  tp-form tp-dropdown {
    margin-bottom: 20px;
  }

  tp-form label {
    display: block;
    margin-bottom: 5px;
  }
`;
