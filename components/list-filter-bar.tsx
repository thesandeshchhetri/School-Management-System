"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export type FilterOption = { value: string; label: string };

export type ListFilterBarProps = {
  searchPlaceholder?: string;
  filterLabel?: string;
  filterOptions?: FilterOption[];   // e.g. class names
  sortOptions?: FilterOption[];     // e.g. Name A-Z, Class, Date
  defaultSort?: string;
};

export type FilterState = {
  search: string;
  filter: string;
  sort: string;
};

/**
 * A reusable search + filter + sort bar.
 * Returns the current filter state and a render prop for the content.
 *
 * Usage:
 *   <ListFilterBar ... >
 *     {({ search, filter, sort }) => <YourList search={search} filter={filter} sort={sort} />}
 *   </ListFilterBar>
 */
export default function ListFilterBar({
  searchPlaceholder = "Search…",
  filterLabel = "All",
  filterOptions = [],
  sortOptions = [],
  defaultSort = "",
  children,
  totalCount,
  filteredCount,
}: ListFilterBarProps & {
  children: (state: FilterState) => React.ReactNode;
  totalCount?: number;
  filteredCount?: number;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [sort,   setSort]   = useState(defaultSort);
  const [open,   setOpen]   = useState(false);

  const hasActive = search || filter || (sort && sort !== defaultSort);

  const reset = useCallback(() => {
    setSearch("");
    setFilter("");
    setSort(defaultSort);
  }, [defaultSort]);

  const state = useMemo(() => ({ search, filter, sort }), [search, filter, sort]);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-soft pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="input pl-8 py-2 text-sm"
          />
        </div>

        {/* Filter dropdown */}
        {filterOptions.length > 0 && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label={`Filter by ${filterLabel}`}
            className="input py-2 text-sm w-auto min-w-[140px]"
          >
            <option value="">{filterLabel}: All</option>
            {filterOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {/* Sort dropdown */}
        {sortOptions.length > 0 && (
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort by"
            className="input py-2 text-sm w-auto min-w-[140px]"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {/* Clear */}
        {hasActive && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-ink-soft bg-white/70 border border-border hover:bg-white transition-colors"
            aria-label="Clear filters"
          >
            <X className="w-3 h-3" aria-hidden="true" />
            Clear
          </button>
        )}

        {/* Count indicator */}
        {totalCount !== undefined && filteredCount !== undefined && filteredCount < totalCount && (
          <span className="text-xs text-ink-soft ml-auto">
            Showing {filteredCount} of {totalCount}
          </span>
        )}
      </div>

      {children(state)}
    </div>
  );
}
