import { css } from 'lit';

export default css`
  :host {
    --text: #C5C6CC;
    --bg1: #031331;
    --hl1: #46C8AF;
    --hl2: #3C5EC7;

    --menu-background: var(--bg1);
    --menu-color: var(--hl1);
    --card-box-background: var(--bg1);
    --tp-icon-color: var(--hl1);
    --tp-button-bg: var(--hl2);
    --tp-dialog-bg: var(--bg1);
    --tp-dialog-border: solid 2px var(--hl1);
    --tp-dialog-border-radius: 10px;
    --tp-dialog-padding: 20px;
  }
`;
