'use client';

import Link from 'next/link';
import {
  Home,
  Users,
  UtensilsCrossed,
  BookOpen,
  Clock,
  Calendar,
  Trees,
  Plus,
  ArrowRight,
  Sparkles,
  ChefHat,
  Quote,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useFamilies } from '@/hooks/useFamily';
import { recipeApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user, isHydrated } = useAuth();
  const { data: familiesRaw, isLoading } = useFamilies();
  // Defensive: ensure families is always an array even if the API returns an envelope
  const families = Array.isArray(familiesRaw) ? familiesRaw : [];

  // Fetch public recipes count for the "global" stat
  const publicRecipesQuery = useQuery({
    queryKey: ['recipes', 'public', 'dashboard'],
    queryFn: () => recipeApi.searchPublic({ page: 0, size: 1 }),
    enabled: Boolean(user),
    staleTime: 60_000,
  });
  const publicRecipesCount = publicRecipesQuery.data?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <Card
        padding="lg"
        className="relative overflow-hidden border-2 border-amber-200/60 bg-gradient-to-br from-amber-50 via-primary-50/40 to-rose-50/40"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-200/40 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-rose-200/40 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              size="lg"
              name={user?.fullName ?? '?'}
              className="ring-4 ring-white shadow-medium"
            />
            <div>
              <p className="font-serif text-2xl font-semibold text-neutral-900">
                {user ? `Chào mừng, ${user.fullName}` : 'Chào mừng trở lại'}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Tổng quan về gia đình và hoạt động gần đây của bạn.
              </p>
            </div>
          </div>
          <Link href="/families/new">
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              className="shadow-medium"
            >
              Tạo gia đình mới
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Home className="h-5 w-5" />}
          label="Gia đình"
          value={isLoading ? '—' : families.length.toString()}
          href="/families"
          tone="primary"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Thành viên"
          value={
            isLoading
              ? '—'
              : families.reduce((sum, f) => sum + (f.memberCount ?? 0), 0).toString()
          }
          href="/families"
          tone="amber"
        />
        <StatCard
          icon={<UtensilsCrossed className="h-5 w-5" />}
          label="Công thức chung"
          value={publicRecipesQuery.isLoading ? '—' : publicRecipesCount.toString()}
          href="/recipes"
          tone="rose"
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Câu chuyện"
          value="—"
          href="/stories"
          tone="sky"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card padding="lg" className="lg:col-span-2">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-500" />
                Hoạt động gần đây
              </span>
            }
            description="Cập nhật mới nhất từ các gia đình bạn tham gia."
          />
          {!isHydrated ? (
            <Spinner size="md" label="Đang tải..." />
          ) : isLoading ? (
            <Spinner size="md" label="Đang tải gia đình..." />
          ) : !families || families.length === 0 ? (
            <CardContent>
              <EmptyActivity />
            </CardContent>
          ) : (
            <CardContent className="space-y-3">
              {families.slice(0, 5).map((f) => (
                <Link
                  key={f.family.id}
                  href={`/families/${f.family.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 px-3 py-2 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={f.family.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {f.family.name}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {f.family.memberCount ?? 0} thành viên · Vai trò:{' '}
                        <span className="font-medium text-neutral-700">
                          {f.role}
                        </span>
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300" />
                </Link>
              ))}
            </CardContent>
          )}
        </Card>

        <Card padding="lg">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-500" />
                Thao tác nhanh
              </span>
            }
          />
          <CardContent className="space-y-2">
            <Link href="/families/new">
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                fullWidth
              >
                Tạo gia đình mới
              </Button>
            </Link>
            <Link href="/families">
              <Button
                variant="outline"
                leftIcon={<Trees className="h-4 w-4" />}
                fullWidth
              >
                Xem cây gia phả
              </Button>
            </Link>
            <Link href="/recipes/new">
              <Button
                variant="outline"
                leftIcon={<ChefHat className="h-4 w-4" />}
                fullWidth
              >
                Thêm công thức
              </Button>
            </Link>
            <Link href="/stories/new">
              <Button
                variant="ghost"
                leftIcon={<Quote className="h-4 w-4" />}
                fullWidth
              >
                Viết câu chuyện
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/time-capsules">
                <Button variant="ghost" size="sm" fullWidth>
                  <Clock className="mr-1.5 h-4 w-4" /> Hộp thời gian
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="ghost" size="sm" fullWidth>
                  <Calendar className="mr-1.5 h-4 w-4" /> Sự kiện
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {families && families.length > 0 && (
        <Card padding="lg">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary-500" />
                Gia đình của bạn
              </span>
            }
            description="Các gia đình bạn đang tham gia."
            action={
              <Link href="/families">
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Tất cả
                </Button>
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {families.slice(0, 3).map((f) => (
              <Link
                key={f.family.id}
                href={`/families/${f.family.id}`}
                className="group flex items-center gap-3 rounded-lg border border-neutral-100 p-3 transition-all hover:border-primary-200 hover:bg-primary-50/40 hover:shadow-soft"
              >
                <Avatar name={f.family.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900 group-hover:text-primary-700">
                    {f.family.name}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {f.family.memberCount ?? 0} thành viên ·{' '}
                    <span className="text-neutral-600">{f.role}</span>
                  </p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-primary-500" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Feature spotlight */}
      <Card
        padding="lg"
        className="border-2 border-primary-100/60 bg-gradient-to-r from-primary-50/40 via-amber-50/30 to-rose-50/30"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Spotlight
            icon={<ChefHat className="h-5 w-5" />}
            title="Cây gia phả công thức"
            description="Theo dõi công thức được truyền qua từng thế hệ"
            href="/recipes"
            tone="primary"
          />
          <Spotlight
            icon={<Clock className="h-5 w-5" />}
            title="Hộp thời gian"
            description="Niêm phong lời nhắn cho thế hệ tương lai"
            href="/time-capsules"
            tone="amber"
          />
          <Spotlight
            icon={<Trees className="h-5 w-5" />}
            title="Cây gia phả trực quan"
            description="Khám phá nhiều đời trong gia tộc của bạn"
            href="/families"
            tone="rose"
          />
        </div>
      </Card>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  tone?: 'primary' | 'amber' | 'rose' | 'sky';
}

const tonePalette = {
  primary: 'bg-primary-100 text-primary-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  sky: 'bg-sky-100 text-sky-700',
};

function StatCard({ icon, label, value, href, tone = 'primary' }: StatCardProps) {
  return (
    <Link href={href}>
      <Card
        hoverable
        padding="md"
        className="flex items-center gap-3 transition hover:border-primary-200"
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg shadow-soft',
            tonePalette[tone]
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="font-serif text-xl font-semibold text-neutral-900">
            {value}
          </p>
        </div>
      </Card>
    </Link>
  );
}

interface SpotlightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  tone?: 'primary' | 'amber' | 'rose';
}

function Spotlight({ icon, title, description, href, tone = 'primary' }: SpotlightProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-start gap-3 rounded-xl border bg-white/70 p-3 transition hover:shadow-medium',
        tone === 'primary' && 'border-primary-100 hover:border-primary-300',
        tone === 'amber' && 'border-amber-100 hover:border-amber-300',
        tone === 'rose' && 'border-rose-100 hover:border-rose-300'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          tonePalette[tone]
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-serif text-sm font-semibold text-neutral-900 group-hover:text-primary-700">
          {title}
        </p>
        <p className="text-xs text-neutral-600">{description}</p>
      </div>
    </Link>
  );
}

function EmptyActivity() {
  return (
    <div className="rounded-lg border border-dashed border-neutral-200 px-4 py-8 text-center">
      <Sparkles className="mx-auto mb-2 h-8 w-8 text-primary-300" />
      <p className="text-sm font-medium text-neutral-700">
        Chưa có hoạt động nào
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        Hãy bắt đầu bằng cách tạo gia đình mới.
      </p>
      <div className="mt-3">
        <Link href="/families/new">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Tạo gia đình
          </Button>
        </Link>
      </div>
    </div>
  );
}