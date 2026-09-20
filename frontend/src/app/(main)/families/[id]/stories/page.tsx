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
import { useFamily } from '@/hooks/useFamily';
import { usePermission } from '@/hooks/usePermission';
import { useStories } from '@/hooks/useStories';

interface PageProps {
  params: { id: string };
}

export default function FamilyStoriesPage({ params }: PageProps) {
  const familyId = params.id;
  const { data: family } = useFamily(familyId);
  const [search, setSearch] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      featured: featuredOnly || undefined,
      page: 0,
      size: 50,
    }),
    [search, featuredOnly]
  );

  const { data, isLoading } = useStories(familyId, filters);
  const items = data?.stories ?? [];
  const { isEditor } = usePermission(familyId);
  const canCreateStory = isEditor;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Gia đình
          </p>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">
            {family?.family?.name ?? 'Câu chuyện'}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Kho tàng ký ức và câu chuyện truyền dạy của gia đình.
          </p>
        </div>
        {canCreateStory && (
        <Link href={`/stories/new?familyId=${familyId}`}>
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
          <button
            type="button"
            onClick={() => setFeaturedOnly((v) => !v)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              featuredOnly
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <Star className="h-4 w-4" /> Chỉ nổi bật
          </button>
        </div>
      </Card>

      {isLoading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" label="Đang tải…" />
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <Card padding="lg">
          <EmptyState
            icon={<BookOpen className="h-10 w-10" />}
            title="Chưa có câu chuyện nào"
            description="Hãy chia sẻ những kỷ niệm đáng nhớ của gia đình bạn."
            action={
              canCreateStory ? (
              <Link href={`/stories/new?familyId=${familyId}`}>
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
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((t, idx) => (
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