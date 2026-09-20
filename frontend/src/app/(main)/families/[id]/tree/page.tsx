'use client';

import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FamilyTree } from '@/components/family/FamilyTree';
import { usePermission } from '@/hooks/usePermission';

interface FamilyTreePageProps {
  params: { id: string };
}

export default function FamilyTreePage({ params }: FamilyTreePageProps) {
  // Managing members requires editor or admin role. Viewers see the tree
  // but no entry point to the management UI.
  const { isEditor } = usePermission(params.id);
  const canManageMembers = isEditor;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/families/${params.id}`}
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại gia đình
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-neutral-900">
            Cây gia phả
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Trực quan hoá mối quan hệ giữa các thành viên trong dòng họ.
          </p>
        </div>
        {canManageMembers && (
        <Link href={`/families/${params.id}/members`}>
          <Button variant="outline" leftIcon={<Users className="h-4 w-4" />}>
            Quản lý thành viên
          </Button>
        </Link>
        )}
      </div>

      <FamilyTree familyId={params.id} />
    </div>
  );
}
