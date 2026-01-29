import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className={className}>
            <ol className="flex items-center flex-wrap gap-1 text-sm">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center">
                            {index === 0 && (
                                <Home className="w-4 h-4 mr-1 text-gray-400" />
                            )}

                            {item.href && !isLast ? (
                                <Link
                                    href={item.href}
                                    className="text-gray-500 hover:text-coral transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className={isLast ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                                    {item.label}
                                </span>
                            )}

                            {!isLast && (
                                <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
