import Link from "next/link";

function makeHref(basePath: string, query: Record<string, string | undefined>, page: number) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) q.set(k, v);
  if (page > 1) q.set("page", String(page)); else q.delete("page");
  const s = q.toString();
  return `${basePath}${s ? `?${s}` : ""}`;
}

export default function Pagination({
  basePath,
  query,
  currentPage,
  totalPages,
}: {
  basePath: string;
  query: Record<string, string | undefined>;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const window = 2;
  const start = Math.max(1, currentPage - window);
  const end = Math.min(totalPages, currentPage + window);
  const pages = [] as number[];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      <Link
        href={makeHref(basePath, query, Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`rounded border px-3 py-1 text-sm ${currentPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}
      >
        Prev
      </Link>
      {start > 1 && (
        <Link href={makeHref(basePath, query, 1)} className="rounded border px-3 py-1 text-sm hover:bg-gray-50">1</Link>
      )}
      {start > 2 && <span className="px-1 text-gray-500">…</span>}
      {pages.map((p) => (
        <Link
          key={p}
          href={makeHref(basePath, query, p)}
          aria-current={p === currentPage ? "page" : undefined}
          className={`rounded border px-3 py-1 text-sm ${p === currentPage ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
        >
          {p}
        </Link>
      ))}
      {end < totalPages - 1 && <span className="px-1 text-gray-500">…</span>}
      {end < totalPages && (
        <Link href={makeHref(basePath, query, totalPages)} className="rounded border px-3 py-1 text-sm hover:bg-gray-50">{totalPages}</Link>
      )}
      <Link
        href={makeHref(basePath, query, Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`rounded border px-3 py-1 text-sm ${currentPage === totalPages ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}
      >
        Next
      </Link>
    </nav>
  );
}


