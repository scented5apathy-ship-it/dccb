'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, UtensilsCrossed, Filter, TrendingUp, Clock, Flame } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { usePublicRecipes, useRecipes } from '@/hooks/useRecipes';
import { useFamilies } from '@/hooks/useFamily';
import type { RecipeWithStats } from '@/types/recipe';

type SortKey = 'recent' | 'popular' | 'trending';

export default function RecipesPage() {
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [page, setPage] = useState(0);
  const size = 12;

  const filters = useMemo(
    () => ({
      cuisine: cuisine || undefined,
      difficulty: difficulty || undefined,
      search: search || undefined,
      sort,
      page,
      size,
    }),
    [cuisine, difficulty, search, sort, page]
  );

  const publicQuery = usePublicRecipes(filters);
  const { data: families } = useFamilies();
  const firstFamily = families?.[0];
  const familyQuery = useRecipes(firstFamily?.family.id, filters);

  // Prefer family recipes if a family is available, otherwise fall back to public.
  const active = firstFamily ? familyQuery : publicQuery;
  const recipes: RecipeWithStats[] = active.data?.recipes ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">
            Công thức gia đình
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {firstFamily
              ? `Khám phá các công thức trong ${firstFamily.family.name ?? 'gia đình của bạn'}`
              : 'Khám phá các công thức truyền thống được chia sẻ bởi cộng đồng.'}
          </p>
        </div>
        {firstFamily && (
          <Link href="/recipes/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Tạo công thức</Button>
          </Link>
        )}
      </header>

      <Card padding="md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="min-w-[200px] flex-1">
              <Input
                placeholder="Tìm theo tên công thức…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <select
              value={cuisine}
              onChange={(e) => {
                setCuisine(e.target.value);
                setPage(0);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tất cả phong cách</option>
              <option value="Miền Bắc">Miền Bắc</option>
              <option value="Miền Trung">Miền Trung</option>
              <option value="Miền Nam">Miền Nam</option>
              <option value="Chay">Chay</option>
              <option value="Hải sản">Hải sản</option>
              <option value="Món ngọt">Món ngọt</option>
            </select>
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(0);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Mọi độ khó</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
            <SortBtn icon={<Clock className="h-3.5 w-3.5" />} active={sort === 'recent'} onClick={() => setSort('recent')}>
              Mới nhất
            </SortBtn>
            <SortBtn icon={<Flame className="h-3.5 w-3.5" />} active={sort === 'popular'} onClick={() => setSort('popular')}>
              Phổ biến
            </SortBtn>
            <SortBtn icon={<TrendingUp className="h-3.5 w-3.5" />} active={sort === 'trending'} onClick={() => setSort('trending')}>
              Thịnh hành
            </SortBtn>
          </div>
        </div>
      </Card>

      {active.isLoading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" label="Đang tải công thức…" />
        </div>
      )}

      {!active.isLoading && recipes.length === 0 && (
        <Card padding="lg">
          <EmptyState
            icon={<UtensilsCrossed className="h-10 w-10" />}
            title="Chưa có công thức nào"
            description="Hãy là người đầu tiên chia sẻ công thức truyền thống của gia đình bạn."
            action={
              firstFamily ? (
                <Link href="/recipes/new">
                  <Button leftIcon={<Plus className="h-4 w-4" />}>Tạo công thức</Button>
                </Link>
              ) : undefined
            }
          />
        </Card>
      )}

      {recipes.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((r) => (
              <RecipeCardWithStats key={r.recipe.id} item={r} />
            ))}
          </div>

          <Pagination
            page={active.data?.page ?? page}
            size={size}
            total={active.data?.total ?? 0}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function SortBtn({
  children,
  icon,
  active,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-white text-primary-700 shadow-soft'
          : 'text-neutral-600 hover:bg-white/60'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Pagination({
  page,
  size,
  total,
  onChange,
}: {
  page: number;
  size: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
      >
        Trước
      </Button>
      <span className="text-sm text-neutral-600">
        Trang {page + 1} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        Sau
      </Button>
    </div>
  );
}

function RecipeCardWithStats({ item }: { item: RecipeWithStats }) {
  // Reuse the existing RecipeCard by projecting a Recipe shape + a few extras.
  const enriched = {
    ...item.recipe,
    description: item.recipe.description,
    coverImageUrl: item.recipe.imageUrl ?? item.recipe.coverImageUrl,
  };
  return (
    <div className="relative">
      <RecipeCard recipe={enriched} />
      {item.reactions && (
        <div className="pointer-events-none absolute bottom-14 right-3 flex gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-neutral-700 shadow-soft backdrop-blur">
          <span>👍 {item.reactions.like ?? 0}</span>
          <span>❤️ {item.reactions.love ?? 0}</span>
          <span>😋 {item.reactions.yum ?? 0}</span>
        </div>
      )}
    </div>
  );
}