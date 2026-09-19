'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { FamilyMember } from '@/types/family';

export interface MemberSelectorProps {
  /** Pool of selectable members. */
  members: FamilyMember[];
  /** Currently selected member IDs. */
  value: string[];
  /** Toggle a member ID. */
  onChange: (next: string[]) => void;
  /** Single vs multi-select mode. */
  multiple?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Lightweight searchable combobox that renders a single chip-list when closed
 * and an inline panel of checkboxes when open. Multi-select by default.
 */
export function MemberSelector({
  members,
  value,
  onChange,
  multiple = true,
  placeholder = 'Chọn thành viên…',
  emptyMessage = 'Không có thành viên nào.',
  className,
  disabled,
}: MemberSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter((m) =>
      (m.fullName ?? '').toLowerCase().includes(term)
    );
  }, [members, search]);

  const selectedMembers = useMemo(
    () => members.filter((m) => value.includes(m.id)),
    [members, value]
  );

  const toggle = (id: string) => {
    if (multiple) {
      onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    } else {
      onChange(value[0] === id ? [] : [id]);
      setOpen(false);
    }
  };

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== id));
  };

  return (
    <div className={cn('relative w-full', className)}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          'flex min-h-[42px] w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 py-2 text-left text-sm transition-colors',
          'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
          disabled && 'cursor-not-allowed bg-neutral-50 text-neutral-400'
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selectedMembers.length === 0 && (
            <span className="text-neutral-400">{placeholder}</span>
          )}
          {selectedMembers.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 py-0.5 pl-0.5 pr-1.5 text-xs text-primary-700"
            >
              <Avatar src={m.avatarUrl} name={m.fullName} size="xs" />
              <span className="truncate font-medium">{m.fullName}</span>
              <button
                type="button"
                onClick={(e) => remove(m.id, e)}
                className="rounded-full p-0.5 hover:bg-primary-100"
                aria-label={`Xoá ${m.fullName}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <ChevronDown
          className={cn(
            'ml-2 h-4 w-4 shrink-0 text-neutral-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-large">
          <div className="border-b border-neutral-100 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Tìm kiếm thành viên…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-neutral-200 bg-neutral-50 py-1.5 pl-8 pr-3 text-xs focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-center text-xs text-neutral-500">
                {emptyMessage}
              </li>
            )}
            {filtered.map((m) => {
              const selected = value.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      selected
                        ? 'bg-primary-50 text-primary-800'
                        : 'hover:bg-neutral-50'
                    )}
                  >
                    <Avatar src={m.avatarUrl} name={m.fullName} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-neutral-900">
                        {m.fullName}
                      </p>
                      {typeof m.generation === 'number' && (
                        <p className="truncate text-[11px] text-neutral-500">
                          Đời {m.generation}
                          {m.generationNumber ? ` · ${m.generationName ?? ''}` : ''}
                        </p>
                      )}
                    </div>
                    {selected && (
                      <span className="text-xs font-semibold text-primary-600">✓</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MemberSelector;