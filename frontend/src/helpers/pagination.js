export default class Pagination {
  constructor(page = 1, limit = 20, sortBy = null, sortDir = 'asc') {
    this.page = page;
    this.limit = limit;
    this.sortBy = sortBy;
    this.sortDir = sortDir;
  }

  nextPage() {
    this.page++;
  }

  prevPage() {
    this.page = Math.max(1, this.page - 1);
  }
  
  setPage(page) {
    this.page = Math.max(1, page);
  }
  
  setLimit(limit) {
    this.limit = Math.max(1, limit);
  }

  updateSort(sortBy, sortDir) {
    this.sortBy = sortBy;
    this.sortDir = sortDir;
  }

  get value() {
    let sort = this.sortBy;

    if (this.sortDir === 'desc') {
      sort = '-' + sort;
    }

    return { page: this.page, limit: this.limit, sort }
  }
}