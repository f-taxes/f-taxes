export default class ColumResizer {
  constructor(wrap, handleSelector) {
    this._handleSelector = handleSelector;
    this._mouseDown = this._mouseDown.bind(this);
    this._dragging = this._dragging.bind(this);
    this._draggingEnd = this._draggingEnd.bind(this);
    this._trackingStarted = false;

    // Amount of pixels the handle must be moved before its registered as a tracking gesture.
    this.threshold = 5;

    wrap.addEventListener('mousedown', this._mouseDown);
  }

  _mouseDown(e) {
    const handle = e.composedPath().find(node => node.matches && node.matches(this._handleSelector));
    if (!handle) return;

    this._cHandle = handle;
    this._startX = e.pageX;
    this._watchDrag();
  }

  _watchDrag() {
    window.addEventListener('mousemove', this._dragging);
    window.addEventListener('mouseup', this._draggingEnd);
  }

  _stopWatchDrag() {
    window.removeEventListener('mousemove', this._dragging);
    window.removeEventListener('mouseup', this._draggingEnd);
  }

  _dragging(e) {
    this._dx = e.pageX - this._startX;

    if (this._trackingStarted === false && Math.abs(this._dx) >= this.threshold) {
      this._trackingStarted = true;
      this._clearSelection();
      this._cHandle.dispatchEvent(new CustomEvent('track', { detail: { state: 'start', dx: this._dx }, bubbles: true, composed: true }));
    }

    if (this._trackingStarted === true) {
      this._cHandle.dispatchEvent(new CustomEvent('track', { detail: { state: 'track', dx: this._dx }, bubbles: true, composed: true }));
    }
  }

  _draggingEnd(e) {
    this._dx = e.pageX - this._startX;
    this._trackingStarted = false;
    this._cHandle.dispatchEvent(new CustomEvent('track', { detail: { state: 'end', dx: this._dx }, bubbles: true, composed: true }));
    this._stopWatchDrag();
    this._cHandle = null;
    this._startX = 0;
    this._clearSelection();
  }

  _clearSelection() {
    const sel = window.getSelection ? window.getSelection() : document.selection;
    if (sel) {
      if (sel.removeAllRanges) {
        sel.removeAllRanges();
      } else if (sel.empty) {
        sel.empty();
      }
    }
  }
}
