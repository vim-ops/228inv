import Fuse from 'fuse.js';
import { useMemo, useState } from 'react';

interface SearchOptions<T> {
  items: T[];
  keys: string[];
  threshold?: number;
}

export function useSearch<T>({ items, keys, threshold = 0.3 }: SearchOptions<T>) {
  const [query, setQuery] = useState('');

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys,
        threshold,
        shouldSort: true,
      }),
    [items, keys, threshold]
  );

  const results = useMemo(() => {
    if (!query) return items;
    return fuse.search(query).map((result) => result.item);
  }, [fuse, items, query]);

  return {
    query,
    setQuery,
    results,
  };
}
