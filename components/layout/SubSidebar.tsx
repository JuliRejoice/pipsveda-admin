'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Filter,
  Settings,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface SubSidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
  isNew?: boolean;
}

export interface SubSidebarSection {
  title?: string;
  items: SubSidebarItem[];
}

interface SubSidebarProps {
  title: string;
  sections: SubSidebarSection[];
  searchable?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onSearch?: (query: string) => void;
  headerActions?: React.ReactNode;
  className?: string;
}

export default function SubSidebar({
  title,
  sections,
  searchable = false,
  collapsible = true,
  defaultCollapsed = false,
  onSearch,
  headerActions,
  className
}: SubSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.trimStart();
    setSearchQuery(query);
    onSearch?.(query);
  };

  const filteredSections = searchQuery
    ? sections.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.items.length > 0)
    : sections;

  return (
    <div className={cn(
      "bg-background border-b border-border w-full",
      className
    )}>
      {/* Header with Title and Actions */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>

        {/* Search */}
        {searchable && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
        )}
      </div>

      {/* Horizontal Navigation */}
      <div className="px-6">
        <div className="flex items-center space-x-8 overflow-x-auto">
          {filteredSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="flex items-center space-x-6">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (pathname.startsWith(item.href) && item.href !== '/dashboard');

                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative group whitespace-nowrap",
                      isActive 
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      
                      {/* Badges */}
                      <div className="flex items-center gap-1">
                        {item.isNew && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            New
                          </Badge>
                        )}
                        {item.badge && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            {item.badge}
                          </Badge>
                        )}
                      </div>

                      {/* Active underline */}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                      )}
                    </div>
                  </Link>
                );
              })}
              
              {/* Section separator */}
              {sectionIndex < filteredSections.length - 1 && (
                <div className="h-6 w-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
