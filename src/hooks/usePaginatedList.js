import { useCallback, useEffect, useRef, useState } from "react";

// DRF's global PageNumberPagination (PAGE_SIZE=25, see backend settings.py)
// wraps every list response as {count, next, previous, results} — this hook
// is the one place that unwraps it and drives a `page` query param, so list
// pages stop silently losing every record past page 1.
const asPage = (data) => {
  if (Array.isArray(data)) {
    // Endpoint not paginated (or pagination disabled) — treat as one page.
    return { results: data, count: data.length };
  }
  return { results: data?.results ?? [], count: data?.count ?? 0 };
};

export default function usePaginatedList(fetcher, params = {}) {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageSize = 25;
  const serializedParams = JSON.stringify(params);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const skipNextReset = useRef(true);

  const fetchPage = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current({ ...JSON.parse(serializedParams), page: pageNum });
      const { results, count: total } = asPage(res.data);
      setItems(results);
      setCount(total);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedParams]);

  // Params changed — go back to page 1 (skipped on first mount, where the
  // page-effect below already fetches page 1).
  useEffect(() => {
    if (skipNextReset.current) {
      skipNextReset.current = false;
      return;
    }
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedParams]);

  useEffect(() => {
    fetchPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, serializedParams]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return {
    items,
    count,
    page,
    setPage,
    totalPages,
    pageSize,
    loading,
    error,
    refetch: () => fetchPage(page),
  };
}
