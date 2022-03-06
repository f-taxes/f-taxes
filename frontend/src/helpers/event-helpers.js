/**
 * Add an event listener bound to the context of the superClass.
 *
 * @param  {HTMLElement} node Element to attach the event listener to.
 * @param  {String} eventName Name of the event.
 * @param  {String} cbName    Name of the handler.
 */
export const EventHelpers = function(superClass) {
  return class extends superClass {
    listen(node, eventName, cbName) {
      this.__boundEventListeners = this.__boundEventListeners || new WeakMap();
      const boundListener = this[cbName].bind(this);
      const eventKey = `${eventName}_${cbName}`;
      let listeners = this.__boundEventListeners.get(node);

      // If there is already a handler for the event assigned we stop here.
      if (listeners && typeof listeners[eventKey] === 'function') return;

      if (!listeners) {
        listeners = {};
      }

      listeners[eventKey] = boundListener;
      this.__boundEventListeners.set(node, listeners);
      node.addEventListener(eventName, boundListener);
    }

    /**
     * Remove an event listener bound to the context of the superClass.
     *
     * @param  {HTMLElement} node Element to attach the event listener to.
     * @param  {String} eventName Name of the event.
     * @param  {String} cbName    Name of the handler.
     */
    unlisten(node, eventName, cbName) {
      this.__boundEventListeners = this.__boundEventListeners || new WeakMap();
      const listeners = this.__boundEventListeners.get(node);
      const eventKey = `${eventName}_${cbName}`;

      if (listeners && typeof listeners[eventKey]) {
        node.removeEventListener(eventName, listeners[eventKey]);
        listeners[eventKey] = null;
      }
    }

    once(node, eventName, cbName) {
      const wrappedCbName = `__onceCb__${cbName}`;

      this[wrappedCbName] = (...args) => {
        this[cbName](...args);
        this.unlisten(node, eventName, wrappedCbName);
      };

      this.listen(node, eventName, wrappedCbName);
    }
  }
}