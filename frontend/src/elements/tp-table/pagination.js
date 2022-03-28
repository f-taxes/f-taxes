/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { Helper } from '@era-core/era-mixins/era-helper-mixin.js';
import { dedupingMixin } from '@polymer/polymer/lib/utils/mixin.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';

/**
 * # ListLoader
 *
 * Methods to load list contents page by page.
 *
 * @polymerBehavior ListLoader
 */
export const Pagination = dedupingMixin(function(superClass) {
  return class extends Helper(superClass) {
    static get properties() {
      return {
        _entries: { type: Array },
        _entriesSet: { type: Object },
        _page: { type: Number },
        _filter: { type: String },
        _filterPage: { type: Number },
        _limit: { type: Number }
      };
    }

    constructor() {
      super();

      this._entries = [];
      this._entriesSet = new Set();
      this._page = 1;
      this._filterPage = 1;
      this._limit = 350;
    }

    _fetch(query, cb) {
      // Override
    }

    _isInFlight() {
      // Override
    }

    get _hasFilter() {
      return typeof this._filter === 'string' && this._filter.length > 0;
    }

    _reloadList() {
      this._resetList();
      this.__currentPage = 0;
      this._lastPage = false;
      this._listStateChanged();
    }

    _listStateChanged() {
      if (this._hasFilter) {
        this._fetchFiltered();
      } else {
        this._fetchPage();
      }
    }

    _scrollThresholdTriggered(e) {
      if (this.active && this._listOverflows()) {
        this.__list = e.composedPath()[0].scrollTarget;
        this.__listScrollOffset = this.__list.scrollTop;

        if (this._hasFilter) {
          this._filterPage++;
          this._fetchFiltered();
        } else {
          this._page++;
          this._fetchPage();
        }
      }
    }

    _resetList() {
      if (typeof this.setProperties === 'function') {
        this.setProperties({ _page: 1, _filterPage: 1, _entries: [] });
      } else {
        this._page = 1;
        this._filterPage = 1;
        this._entries = [];
      }
    }

    _shouldFetch() {
      if (this._page === undefined || this._limit === undefined) return false;
      const pageChanged = this._page !== this.__currentPage;

      let optionsChanged = false;
      optionsChanged = JSON.stringify(this._statusFilter) !== JSON.stringify(this.__currentStatusFilter) || optionsChanged;
      optionsChanged = JSON.stringify(this._sorting) !== JSON.stringify(this.__currentSorting) || optionsChanged;

      this.__currentStatusFilter = this._statusFilter;
      this.__currentSorting = this._sorting;

      if (optionsChanged === true) {
        this._resetList();
      }

      if ((pageChanged === false || this._lastPage || this._isInFlight()) && optionsChanged === false) return false;

      return true;
    }

    _fetchPage() {
      this._filterDebouncer = Debouncer.debounce(
        this._filterDebouncer,
        timeOut.after(20),
        () => {
          if (this._shouldFetch() === false) return;

          this._fetch({ page: this._page, limit: this._limit, options: { statusFilter: this._statusFilter, sorting: this._sorting } }, (docs, pages) => {
            if (this._page === 1) {
              this._entriesSet = new Set();
            }

            docs = docs.filter(doc => this._entriesSet.has(doc._id) === false);
            docs.forEach(doc => this._entriesSet.add(doc._id));

            if (this._page === 1) {
              this._entries = docs;
            } else {
              this._entries = this._entries.concat(docs);
            }

            // Restore scrolling position in the list.
            if (this.__list !== undefined) {
              this.__list.scrollTop = this.__listScrollOffset || 0;
            }

            this.__currentPage = this._page;

            // Check if we reached the last page.
            this._lastPage = pages <= this._page;

            // Clear scroll threshold so the next page can be loaded.
            this.clearTriggers();

            this.__fillList();
          });
        }
      );
    }

    _fetchFiltered() {
      this._filterDebouncer = Debouncer.debounce(
        this._filterDebouncer,
        timeOut.after(300),
        () => {
          if (!this._hasFilter) {
            this._lastPage = false;
            this.__currentPage = false;
            this._lastFilter = null;
            this._page = 1;
            this._filterPage = 1;
            this.__listScrollOffset = 0;
            this._fetchPage();
            return;
          }

          if (this._shouldFetch() === false && this._lastPage === true && this._filter === this._lastFilter) return;

          if (this._filter !== this._lastFilter) {
            this._filterPage = 1;
          }

          this._lastFilter = this._filter;

          this._fetch({ filter: this._filter, page: this._filterPage, limit: this._limit, options: {
            statusFilter: this._statusFilter,
            sorting: this._sorting
          } }, (result, resp) => {
            if (resp && resp.statusCode === 200) {
              if (this._filterPage === 1) {
                this._entries = result.entries.map(entry => entry.doc);
              } else {
                this._entries = this._entries.concat(result.entries.map(entry => entry.doc));
              }

              // Restore scrolling position in the list.
              if (this.__list !== undefined) {
                this.__list.scrollTop = this.__listScrollOffset || 0;
              }

              // Check if we reached the last page.
              this._lastPage = result.pages <= this._filterPage || result.pages === 0;

              // Clear scroll threshold so the next page can be loaded.
              this.clearTriggers();

              this.__fillList();
            }
          });
        }
      );
    }

    // Load pages until the list fills the screen.
    // We check the list height after next render to see if the list already fills the screen.
    // If not, load the next page.
    // This needs to be triggered async so that the current `_fetchPage` request
    // is finished and no longer considered "in flight".
    __fillList() {
      if (!this._lastPage && !this.listOverflows()) {
        setTimeout(() => {
          if (this._hasFilter) {
            this._filterPage++;
            this._fetchFiltered();
          } else {
            this._page++;
            this._fetchPage();
          }
        });
      }
    }
  };
});
