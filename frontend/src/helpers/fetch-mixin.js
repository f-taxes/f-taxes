export const fetchMixin = function(superClass) {
  return class extends superClass {
    constructor() {
      super();
      this.__abortControllers = new Map();
    }

    get(url) {
      return fetch(url).then(response => response.json());
    }

    head(url) {
      return fetch(url, { method: 'HEAD' });
    }

    async post(url, data, overwrite = true) {
      this.__cancelRunningRequest(url);

      if (overwrite === true) {
        const ac = new AbortController();
        this.__abortControllers.set(url, ac);
      }

      try {
        const reqOptions = {
          method: 'POST',
          signal: this.__abortControllers.get(url).signal,
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          referrer: 'no-referrer',
          body: JSON.stringify(data)
        };

        document.dispatchEvent(new CustomEvent('before-request', { detail: reqOptions, bubbles: true, composed: true }));

        const result = await fetch(url, reqOptions).then(response => response.json());

        this.__abortControllers.delete(url);

        if (result.statusCode === 500) {
          console.error(result);
        }

        return result;
      } catch (err) {
        if (err.name === 'AbortError') {
          return { statusCode: -1, error: err };
        } else {
          this.__abortControllers.delete(url);
          return { statusCode: null, error: err };
        }
      }
    }

    isInFlight(url) {
      return Boolean(this.__abortControllers.get(url));
    }

    __cancelRunningRequest(url) {
      if (this.__abortControllers.has(url)) {
        try {
          this.__abortControllers.get(url).abort();
        } catch (err) { }
        this.__abortControllers.delete(url);
      }
    }
  };
};
