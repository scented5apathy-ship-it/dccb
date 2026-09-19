'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, UtensilsCrossed } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { useFamily, useFamilyMembers } from '@/hooks/useFamily';
import { useRecipes } from '@/hooks/useRecipes';
import type { RecipeWithStats } from '@/types/recipe';

interface PageProps {
  params: { id: string };
}

export default function FamilyRecipesPage({ params }: PageProps) {
  const familyId = params.id;
  const { data: family } = useFamily(familyId);
  void useFamilyMembers(familyId);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(0);
  const size = 12;

  const filters = useMemo(
    () => ({
      cuisine: cuisine || undefined,
      difficulty: difficulty || undefined,
      search: search || undefined,
      page,
      size,
    }),
    [cuisine, difficulty, search, page]
  );

  const { data, isLoading } = useRecipes(familyId, filters);
  const recipes: RecipeWithStats[] = data?.recipes ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Gia đình
          </p>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">
            {family?.family?.name ?? 'Công thức gia đình'}
          </h1>
          {family?.family?.description && (
            <p className="mt-1 text-sm text-neutral-500">
              {family.family.description}
            </p>
          )}
        </div>
        <Link href={`/recipes/new?familyId=${familyId}`}>
          <Button leftIcon={<Plus className="h-4 w-4" />}>Tạo công thức</Button>
        </Link>
      </header>

      <Card padding="md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
      </Card>

      {isLoading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" label="Đang tải công thức…" />
        </div>
      )}

      {!isLoading && recipes.length === 0 && (
        <Card padding="lg">
          <EmptyState
            icon={<UtensilsCrossed className="h-10 w-10" />}
            title="Chưa có công thức nào trong gia đình này"
            description="Hãy là người đầu tiên chia sẻ công thức của dòng họ."
            action={
              <Link href={`/recipes/new?familyId=${familyId}`}>
                <Button leftIcon={<Plus className="h-4 w-4" />}>Tạo công thức</Button>
              </Link>
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
            page={data?.page ?? page}
            size={size}
            total={data?.total ?? 0}
            onChange={setPage}
          />
        </>
      )}
    </div>
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
      <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => onChange(page - 1)}>
        Trước
      </Button>
      <span className="text-sm text-neutral-600">Trang {page + 1} / {totalPages}</span>
      <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Sau
      </Button>
    </div>
  );
}

function RecipeCardWithStats({ item }: { item: RecipeWithStats }) {
  const enriched = {
    ...item.recipe,
    coverImageUrl: item.recipe.imageUrl ?? item.recipe.coverImageUrl,
  };
  return <RecipeCard recipe={enriched} />;
}