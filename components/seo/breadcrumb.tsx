import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { BreadcrumbSchema } from './page-schema';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <>
      <BreadcrumbSchema items={items} />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.url} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
                {isLast ? (
                  <span className="text-gray-900 font-medium">{item.name}</span>
                ) : (
                  <Link href={item.url} className="hover:text-coral transition-colors">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
