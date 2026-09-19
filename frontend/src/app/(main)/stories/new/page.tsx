'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { showToast } from '@/components/ui/Toast';
import { StoryForm } from '@/components/story/StoryForm';
import { useFamilies } from '@/hooks/useFamily';
import { useFamilyMembers } from '@/hooks/useFamily';
import { useCreateStory } from '@/hooks/useStories';
import type { CreateStoryRequest } from '@/types/story';

// Wrap the body in a Suspense boundary so `useSearchParams` (which Next.js
// treats as opt-in to client-side rendering during pre-render) doesn't force
// the whole route to bail out of static generation. Same shape as
// (auth)/login/page.tsx.
export default function NewStoryPage() {
  return (
    <Suspense fallback={null}>
      <NewStoryView />
    </Suspense>
  );
}

function NewStoryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetFamilyId = searchParams.get('familyId');

  const { data: families, isLoading } = useFamilies();
  const [familyId, setFamilyId] = useState<string | undefined>(presetFamilyId ?? undefined);

  useEffect(() => {
    if (!familyId && families && families.length > 0) {
      setFamilyId(families[0]?.family.id);
    }
  }, [families, familyId]);

  const { data: membersResp } = useFamilyMembers(familyId);
  const members = useMemo(() => {
    const resp = membersResp as unknown;
    if (!resp) return [];
    if (Array.isArray(resp)) return resp as never;
    const r = resp as { members?: unknown };
    if (Array.isArray(r.members)) {
      return (r.members as Array<{ member?: unknown }>).map((m) => (m.member ?? m) as never) as never;
    }
    return [];
  }, [membersResp]);

  const createStory = useCreateStory();

  const onSubmit = async (payload: CreateStoryRequest) => {
    if (!familyId) {
      showToast.error('Vui lòng chọn gia đình');
      return;
    }
    try {
      const result = await createStory.mutateAsync({ familyId, payload });
      showToast.success('Đã đăng câu chuyện');
      router.push(`/stories/${result.story.id}`);
    } catch (e) {
      showToast.error('Không thể đăng câu chuyện', {
        description: e instanceof Error ? e.message : '',
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/stories"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Link>

      <header>
        <h1 className="font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">
          Viết câu chuyện mới
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Lưu giữ những kỷ niệm, truyền thống và câu chuyện gia đình.
        </p>
      </header>

      {isLoading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="md" label="Đang tải gia đình…" />
        </div>
      )}

      {!isLoading && families && families.length === 0 && (
        <Card padding="lg">
          <p className="text-sm text-neutral-600">
            Bạn chưa thuộc gia đình nào. Hãy tạo hoặc tham gia gia đình trước.
          </p>
        </Card>
      )}

      {!isLoading && families && families.length > 0 && (
        <Card padding="md">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Gia đình
          </label>
          <select
            value={familyId ?? ''}
            onChange={(e) => setFamilyId(e.target.value)}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="" disabled>
              Chọn gia đình
            </option>
            {families.map((f) => (
              <option key={f.family.id} value={f.family.id}>
                {f.family.name}
              </option>
            ))}
          </select>
        </Card>
      )}

      {familyId && (
        <StoryForm
          familyId={familyId}
          members={members}
          onSubmit={onSubmit}
          submitting={createStory.isPending}
        />
      )}
    </div>
  );
}