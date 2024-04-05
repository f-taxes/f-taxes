import { css } from 'lit';

export default css`
  :host {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  tp-table {
    flex: 1;
    --scrollbar-track: var(--bg0);
    --scrollbar-thumb: var(--hl1);
    --tp-icon-color: var(--hl1);
  }

  tp-table::part(header) {
    background: var(--bg0);
  }

  tp-table::part(sort-icon) {
    --tp-icon-width: 22px;
    --tp-icon-height: 22px;
  }

  tp-table::part(width-handle-bar):hover {
    background: var(--bg0);
  }

  tp-table::part(column-label) {
    border-right: solid 2px var(--bg1);
  }

  tp-table::part(cell) {
    border-right: solid 2px var(--bg0);
  }

  tp-table::part(row):hover {
    background-color: var(--bg1);
  }

  .list {
    height: 100px;
    width: 200px;
    overflow-y: auto;
  }

  .tools {
    padding: 10px 32px 10px 20px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }

  .tools > div {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .tools > div > * + * {
    margin-left: 25px;
  }

  .tools tp-button {
    --tp-button-padding: 2px 8px;
  }
  
  .tools tp-button tp-icon {
    --tp-icon-width: 14px;
    --tp-icon-height: 14px;
  }

  tp-filter-builder {
    --tp-filter-builder-bg: var(--bg0);
    --tp-filter-builder-color: var(--text);
    --tp-filter-builder-list-color: var(--text-dark);
    --tp-filter-builder-icon-color: var(--text);
    --tp-filter-builder-bg-hover: var(--hl1);
    --tp-filter-builder-color-hover: var(--text-dark);
    --tp-filter-builder-input-bg: var(--bg1);
  }
`;