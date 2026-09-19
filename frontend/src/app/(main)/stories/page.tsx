'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, BookOpen, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { useFamilies } from '@/hooks/useFamily';
import { useStories, useStoryTags } from '@/hooks/useStories';

export default function StoriesPage() {
  const { data: families } = useFamilies();
  const firstFamily = families?.[0];
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      tag: tagFilter || undefined,
      featured: featuredOnly || undefined,
      page: 0,
      size: 24,
    }),
    [search, tagFilter, featuredOnly]
  );

  const { data: storiesResp, isLoading } = useStories(firstFamily?.family.id, filters);
  const { data: tags } = useStoryTags();

  const items = storiesResp?.stories ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">
            Câu chuyện gia đình
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {firstFamily
              ? `Những câu chuyện được lưu giữ trong ${firstFamily.family.name ?? 'gia đình'}.`
              : 'Các câu chuyện, kỷ niệm và truyền thống được lưu giữ.'}
          </p>
        </div>
        {firstFamily && (
          <Link href={`/stories/new?familyId=${firstFamily.family.id}`}>
            <Button leftIcon={<Plus className="h-4 w-4" />}>Viết câu chuyện</Button>
          </Link>
        )}
      </header>

      <Card padding="md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="Tìm kiếm câu chuyện…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Tất cả tag</option>
            {(tags ?? []).map((t) => {
              const tag = (t as { tag?: { id: string; name: string } }).tag ?? (t as unknown as { id: string; name: string });
              return (
                <option key={tag.id} value={tag.id}>
                  #{tag.name}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            onClick={() => setFeaturedOnly((v) => !v)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              featuredOnly
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <Star className="h-4 w-4" /> Nổi bật
          </button>
        </div>
      </Card>

      {isLoading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" label="Đang tải câu chuyện…" />
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <Card padding="lg">
          <EmptyState
            icon={<BookOpen className="h-10 w-10" />}
            title="Chưa có câu chuyện nào"
            description="Hãy chia sẻ những kỷ niệm đáng nhớ của gia đình bạn."
            action={
              firstFamily ? (
                <Link href={`/stories/new?familyId=${firstFamily.family.id}`}>
                  <Button leftIcon={<Plus className="h-4 w-4" />}>Viết câu chuyện</Button>
                </Link>
              ) : undefined
            }
          />
        </Card>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const s = item.story;
            const tagNames = item.tags ?? [];
            return (
              <Link key={s.id} href={`/stories/${s.id}`} className="block">
                <Card hoverable padding="md" className="h-full">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="line-clamp-2 font-serif text-base font-semibold text-neutral-900">
                      {s.title}
                    </h3>
                    {s.isFeatured && (
                      <Badge variant="warning" size="sm">
                        <Star className="h-3 w-3" /> Nổi bật
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-neutral-600">
                    {s.content.slice(0, 200)}
                  </p>
                  {tagNames.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {tagNames.slice(0, 3).map((t, idx) => (
                        <Badge key={`${t}-${idx}`} variant="primary" size="sm">
                          #{t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                    <span>{item.author?.fullName ?? '—'}</span>
                    {s.storyDate && <span>{s.storyDate}</span>}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}