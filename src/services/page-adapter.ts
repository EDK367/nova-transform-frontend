import type { PageResponse } from '@/types';

type PageOptions = {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
};

export function toPage<T extends object>(
  items: T[],
  options?: PageOptions
): PageResponse<T> {
  const page = Math.max(0, options?.page ?? 0);
  const size = Math.max(1, options?.size ?? 10);
  const sorted = [...items];

  if (options?.sortBy) {
    const field = options.sortBy as keyof T;

    sorted.sort((a, b) => {
      const left = a[field];
      const right = b[field];

      const result =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left ?? '').localeCompare(
              String(right ?? ''),
              'es',
              { numeric: true }
            );

      return options.sortDirection === 'desc'
        ? -result
        : result;
    });
  }

  return {
    content: sorted.slice(
      page * size,
      (page + 1) * size
    ),
    page,
    size,
    totalElements: sorted.length,
    totalPages: Math.ceil(sorted.length / size),
  };
}
