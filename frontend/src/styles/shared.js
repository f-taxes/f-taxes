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

  card-box h2 {
    margin: 0 0 40px 0;
  }

  a {
    color: var(--hl1);
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

  tp-button.only-icon tp-icon {
    margin: 0;
    --tp-icon-height: 24px;
    --tp-icon-width: 24px;
  }

  tp-button.danger {
    background: var(--red);
  }

  tp-icon.button-like {
    padding: 5px;
    border-radius: 300px;
    background: var(--hl2);
    --tp-icon-color: var(--text);
  }

  tp-icon.button-like:focus,
  tp-icon.button-like:hover {
    background: var(--hl1);
    --tp-icon-color: var(--text-dark);
  }

  tp-input::part(wrap) {
    font-size: 18px;
    background: var(--input-bg);
    border: var(--input-border);
  }

  tp-date-input[focused]::part(wrap),
  tp-input[focused]::part(wrap) {
    border: solid 1px var(--hl1);
  }

  tp-date-input[invalid]::part(wrap),
  tp-input[invalid]::part(wrap) {
    border: solid 1px var(--red);
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

  .button-centered {
    margin-top: 30px;
    text-align: center;
  }

  .buttons-justified {
    margin-top: 30px;
    display: flex;
    justify-content: space-between;
  }

  .buttons-justified tp-button + tp-button {
    margin-left: 20px;
  }

  tp-dialog::part(dialog) {
    box-shadow: var(--popup-shadow);
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

  textarea {
    width: 100%;
    box-sizing: border-box;
    background: var(--input-bg);
    border: var(--input-border);
    outline: none;
    border-radius: 2px;
    color: var(--text);
    font-size: 18px;
    font-family: 'Source Sans Pro';
    height: 80px;
  }

  textarea:focus {
    border: solid 1px var(--hl1);
  }

  .hint {
    font-size: 14px;
  }

  ul {
    margin: 0;
    padding: 0 0 0 10px;
    list-style-type: none;
  }

  tp-cmd-item {
    color: var(--text-dark);
  }

  tp-cmd-item:hover {
    background: var(--hl1);
  }

  .scrollbar::-webkit-scrollbar {
    width: 12px;
  }

  .scrollbar::-webkit-scrollbar-track {
    background: var(--bg0);
  }

  .scrollbar::-webkit-scrollbar-thumb {
    background-color: var(--hl1);
    outline: none;
    border-radius: 4px;
  }
`;
