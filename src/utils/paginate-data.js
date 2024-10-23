const defaultPageLimit = process.env.PAGE_LIMIT;
export function paginateData(array, page = 1, pageLimit = defaultPageLimit) {
  // Calculate start index and end index based on page and pageLimit
  const startIndex = (page - 1) * pageLimit;
  const endIndex = startIndex + pageLimit;

  const paginatedArray = array.slice(startIndex, endIndex);

  const totalPages = Math.ceil(array.length / pageLimit);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const pagination = {
    pages: pages,
    total: array.length,
    activePage: page,
    pageLimit: pageLimit,
  };

  return {
    data: paginatedArray,
    pagination: pagination,
  };
}
