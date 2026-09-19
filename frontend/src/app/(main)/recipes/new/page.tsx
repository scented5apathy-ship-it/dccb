'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { showToast } from '@/components/ui/Toast';
import { RecipeForm } from '@/components/recipe/RecipeForm';
import { useFamilies } from '@/hooks/useFamily';
import { useFamilyMembers } from '@/hooks/useFamily';
import { useCreateRecipe } from '@/hooks/useRecipes';
import type { CreateRecipeRequest } from '@/types/recipe';

export default function NewRecipePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetFamilyId = searchParams.get('familyId');

  const { data: families, isLoading } = useFamilies();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | undefined>(
    presetFamilyId ?? undefined
  );

  useEffect(() => {
    if (!selectedFamilyId && families && families.length > 0) {
      setSelectedFamilyId(families[0]?.family.id);
    }
  }, [families, selectedFamilyId]);

  const familyOptions = useMemo(
    () => families ?? [],
    [families]
  );

  const { data: membersResp } = useFamilyMembers(selectedFamilyId);
  const members = useMemo(() => {
    const resp = membersResp as unknown;
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    const r = resp as { members?: unknown };
    if (Array.isArray(r.members)) {
      // members might be MemberWithRelationships[] - unwrap to FamilyMember
      return (r.members as Array<{ member?: unknown }>).map((m) => (m.member ?? m) as never) as never;
    }
    return [];
  }, [membersResp]);

  const createRecipe = useCreateRecipe();

  const onSubmit = async (payload: CreateRecipeRequest) => {
    if (!selectedFamilyId) {
      showToast.error('Vui lòng chọn gia đình');
      return;
    }
    try {
      const created = await createRecipe.mutateAsync({
        familyId: selectedFamilyId,
        payload,
      });
      showToast.success('Đã tạo công thức');
      router.push(`/recipes/${created.recipe.id}`);
    } catch (e) {
      showToast.error('Không thể tạo công thức', {
        description: e instanceof Error ? e.message : '',
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Link>

      <header>
        <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">
          Tạo công thức mới
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Ghi lại công thức, nguyên liệu và hành trình truyền dạy trong gia đình bạn.
        </p>
      </header>

      {isLoading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="md" label="Đang tải gia đình…" />
        </div>
      )}

      {!isLoading && familyOptions.length === 0 && (
        <Card padding="lg">
          <p className="text-sm text-neutral-600">
            Bạn chưa thuộc gia đình nào. Hãy tạo hoặc tham gia một gia đình trước khi thêm công thức.
          </p>
          <Link
            href="/families/new"
            className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-800"
          >
            Tạo gia đình mới →
          </Link>
        </Card>
      )}

      {!isLoading && familyOptions.length > 0 && (
        <Card padding="md">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Gia đình
          </label>
          <select
            value={selectedFamilyId ?? ''}
            onChange={(e) => setSelectedFamilyId(e.target.value)}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="" disabled>
              Chọn gia đình
            </option>
            {familyOptions.map((f) => (
              <option key={f.family.id} value={f.family.id}>
                {f.family.name} · {f.memberCount ?? 0} thành viên
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-neutral-500">
            Công thức sẽ được lưu trong gia đình đã chọn.
          </p>
        </Card>
      )}

      {selectedFamilyId && (
        <RecipeForm
          familyId={selectedFamilyId}
          members={members}
          onSubmit={onSubmit}
          submitting={createRecipe.isPending}
        />
      )}
    </div>
  );
}