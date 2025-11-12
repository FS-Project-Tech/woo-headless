import Link from "next/link";

export interface CrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: CrumbItem[] }) {
  const last = items.length - 1;
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1">
            {idx === last || !item.href ? (
              <span className="truncate font-medium text-gray-800">{item.label}</span>
            ) : (
              <Link href={item.href} className="truncate hover:text-gray-900">
                {item.label}
              </Link>
            )}
            {idx !== last && <span className="text-gray-400">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}


