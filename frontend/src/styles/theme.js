import { css } from 'lit';

export default css`
  :host {
    --white: #ffffff;
    --text: #C5C6CC;
    --text-dark: #000000;
    --text-low: #a2a3a7;
    --bg0: #232a62;
    --bg1: #031331;
    --bg2: #041f52;
    --hl1: #46C8AF;
    --hl2: #3C5EC7;
    --red: #bd3434;
    --amber: #cf9f19;
    --popup-shadow:  2px 2px 15px rgb(60 126 167 / 33%);

    --menu-background: var(--bg1);
    --menu-color: var(--hl1);
    --card-box-background: var(--bg1);
    --input-bg: #122444;
    --input-border: solid 1px var(--hl2);
    --tp-icon-color: var(--hl1);
    --tp-button-bg: var(--hl2);
    --tp-button-bg-hover: var(--hl1);
    --tp-button-bg-focus: var(--hl1);
    --tp-button-color-hover: var(--text-dark);
    --tp-button-color-focus: var(--text-dark);
    --tp-dialog-bg: var(--bg1);
    --tp-dialog-border: solid 2px var(--hl1);
    --tp-dialog-border-radius: 10px;
    --tp-dialog-padding: 20px;
    --tp-popup-background: var(--bg1);
    --tp-popup-shadow: var(--popup-shadow);
    --tp-table-icon-color: var(--hl1);
  }
`;
