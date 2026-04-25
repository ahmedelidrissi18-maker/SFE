export const DEFAULT_PAGE_SIZE = 10;

type SearchParamValue = string | string[] | undefined;

export function parsePageParam(value?: SearchParamValue) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number.parseInt(rawValue ?? "", 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return parsedValue;
}

export function getPaginationMeta(input: {
  requestedPage: number;
  totalItems: number;
  pageSize?: number;
}) {
  const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(input.totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, input.requestedPage), totalPages);
  const skip = (currentPage - 1) * pageSize;
  const take = pageSize;
  const startItem = input.totalItems === 0 ? 0 : skip + 1;
  const endItem = input.totalItems === 0 ? 0 : Math.min(skip + pageSize, input.totalItems);

  return {
    currentPage,
    pageSize,
    totalItems: input.totalItems,
    totalPages,
    skip,
    take,
    startItem,
    endItem,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}

export function buildPaginationHref(
  pathname: string,
  searchParams: Record<string, SearchParamValue>,
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry.trim() !== "") {
          params.append(key, entry);
        }
      }

      continue;
    }

    if (typeof value === "string" && value.trim() !== "") {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
