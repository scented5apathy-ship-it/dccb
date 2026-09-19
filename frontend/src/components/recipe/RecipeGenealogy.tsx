'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  History,
  Sparkles,
  Users,
  CalendarRange,
  ChefHat,
  ArrowDown,
  GitBranch,
  Flame,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import type { RecipeGenealogyTree, GenealogyTreeNode } from '@/types/recipe';

export interface RecipeGenealogyProps {
  /** Genealogy tree response from /recipes/{id}/genealogy-tree. */
  tree: RecipeGenealogyTree | null | undefined;
  /** Optional link target for a member node. */
  buildMemberHref?: (memberId: string) => string;
}

interface FlatNode {
  node: GenealogyTreeNode;
  depth: number;
  parentId: string | null;
  x: number;
  y: number;
  isLeaf: boolean;
}

interface LayoutResult {
  nodes: FlatNode[];
  width: number;
  height: number;
}

const NODE_W = 240;
const NODE_H = 140;
const H_GAP = 36;
const V_GAP = 80;

function layoutTree(root: GenealogyTreeNode): LayoutResult {
  // Compute width per subtree (count of leaves)
  const widths = new Map<GenealogyTreeNode, number>();
  const compute = (n: GenealogyTreeNode): number => {
    if (!n.children || n.children.length === 0) {
      widths.set(n, 1);
      return 1;
    }
    const total = n.children.reduce((acc, c) => acc + compute(c), 0);
    widths.set(n, total);
    return total;
  };
  compute(root);

  const nodes: FlatNode[] = [];
  let maxDepth = 0;
  const place = (
    n: GenealogyTreeNode,
    depth: number,
    leftIndex: number,
    parentId: string | null
  ) => {
    const w = widths.get(n) ?? 1;
    const isLeaf = !n.children || n.children.length === 0;
    const x =
      leftIndex * (NODE_W + H_GAP) +
      (w * (NODE_W + H_GAP)) / 2 -
      NODE_W / 2;
    const y = depth * (NODE_H + V_GAP);
    nodes.push({ node: n, depth, parentId, x, y, isLeaf });
    maxDepth = Math.max(maxDepth, depth);
    let cursor = leftIndex;
    for (const c of n.children ?? []) {
      const cw = widths.get(c) ?? 1;
      place(c, depth + 1, cursor, n.member?.id ?? null);
      cursor += cw;
    }
  };
  place(root, 0, 0, null);

  const totalWidth = (widths.get(root) ?? 1) * (NODE_W + H_GAP);
  const totalHeight = (maxDepth + 1) * (NODE_H + V_GAP);
  return { nodes, width: totalWidth, height: totalHeight };
}

const generationPalette: Array<{
  bg: string;
  ring: string;
  chip: string;
  accent: string;
}> = [
  {
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100/70',
    ring: 'ring-amber-300',
    chip: 'bg-amber-200 text-amber-900',
    accent: 'text-amber-700',
  },
  {
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
    ring: 'ring-orange-300',
    chip: 'bg-orange-200 text-orange-900',
    accent: 'text-orange-700',
  },
  {
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
    ring: 'ring-yellow-300',
    chip: 'bg-yellow-200 text-yellow-900',
    accent: 'text-yellow-800',
  },
  {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    ring: 'ring-red-300',
    chip: 'bg-red-200 text-red-900',
    accent: 'text-red-700',
  },
  {
    bg: 'bg-gradient-to-br from-rose-50 to-pink-50',
    ring: 'ring-rose-300',
    chip: 'bg-rose-200 text-rose-900',
    accent: 'text-rose-700',
  },
  {
    bg: 'bg-gradient-to-br from-pink-50 to-fuchsia-50',
    ring: 'ring-pink-300',
    chip: 'bg-pink-200 text-pink-900',
    accent: 'text-pink-700',
  },
];

export function RecipeGenealogy({ tree, buildMemberHref }: RecipeGenealogyProps) {
  const layout = useMemo(() => {
    if (!tree?.tree?.member) return null;
    return layoutTree(tree.tree);
  }, [tree]);

  // Derived stats
  const stats = useMemo(() => {
    if (!tree?.tree) return null;
    const totalMembers = countNodes(tree.tree);
    const leafCount =
      tree.tree.children?.length === 0 ? 1 : leafCountOf(tree.tree);
    const yearSpan =
      tree.oldestYear && tree.newestYear
        ? tree.newestYear - tree.oldestYear
        : null;
    const avgYearsPerGen =
      tree.totalGenerations > 1 && yearSpan && yearSpan > 0
        ? Math.round(yearSpan / (tree.totalGenerations - 1))
        : null;
    return { totalMembers, leafCount, yearSpan, avgYearsPerGen };
  }, [tree]);

  if (!tree || !tree.tree || !tree.tree.member) {
    return (
      <Card padding="lg">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary-600" />
              Cây gia phả công thức
            </span>
          }
          description="Hành trình truyền dạy qua các thế hệ"
        />
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
          <History className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 text-sm font-medium text-neutral-700">
            Chưa có thông tin truyền dạy.
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Khi thành viên thêm "nguồn gốc" cho công thức này, cây phả hệ sẽ xuất hiện tại đây.
          </p>
        </div>
      </Card>
    );
  }

  const { nodes, width, height } = layout!;

  return (
    <Card padding="lg" className="border border-primary-100/70 bg-gradient-to-br from-primary-50/30 via-white to-amber-50/30">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary-600" />
            Cây gia phả công thức
          </span>
        }
        description={
          tree.recipe?.title ? (
            <span className="flex items-center gap-1.5">
              <ChefHat className="h-3.5 w-3.5" />
              Hành trình của <span className="font-semibold text-neutral-700">&ldquo;{tree.recipe.title}&rdquo;</span> qua các thế hệ
            </span>
          ) : (
            'Hành trình công thức được truyền từ thế hệ này sang thế hệ khác'
          )
        }
      />

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          icon={<GitBranch className="h-4 w-4" />}
          label="Thế hệ"
          value={tree.totalGenerations}
        />
        <Stat
          icon={<CalendarRange className="h-4 w-4" />}
          label="Từ năm"
          value={tree.oldestYear ?? '—'}
        />
        <Stat
          icon={<CalendarRange className="h-4 w-4" />}
          label="Đến năm"
          value={tree.newestYear ?? '—'}
        />
        <Stat
          icon={<Sparkles className="h-4 w-4" />}
          label="Số người"
          value={stats?.totalMembers ?? 0}
        />
      </div>

      {/* Insight ribbon - recipe legacy stats */}
      {stats && (stats.avgYearsPerGen || stats.leafCount > 1) && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
          <Flame className="h-4 w-4 text-amber-600" />
          <span className="font-medium">Di sản:</span>
          {stats.avgYearsPerGen && (
            <span>
              Trung bình <strong>{stats.avgYearsPerGen} năm</strong> mỗi thế hệ truyền dạy
            </span>
          )}
          {stats.leafCount > 1 && (
            <span>
              · Đã lan toả tới <strong>{stats.leafCount} nhánh</strong> cuối cùng
            </span>
          )}
        </div>
      )}

      {/* Tree */}
      <div className="overflow-x-auto rounded-xl bg-gradient-to-br from-primary-50/40 via-amber-50/30 to-rose-50/30 p-4">
        <div className="relative" style={{ width, height, minWidth: width }}>
          <svg
            width={width}
            height={height}
            className="pointer-events-none absolute inset-0"
          >
            <defs>
              <linearGradient id="lineage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D97706" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#B45309" stopOpacity={0.95} />
              </linearGradient>
              <marker
                id="lineage-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerUnits="strokeWidth"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#B45309" />
              </marker>
            </defs>
            {nodes.map((n) => {
              if (!n.parentId) return null;
              const parent = nodes.find(
                (p) => p.node.member?.id === n.parentId
              );
              if (!parent) return null;
              const x1 = parent.x + NODE_W / 2;
              const y1 = parent.y + NODE_H;
              const x2 = n.x + NODE_W / 2;
              const y2 = n.y;
              const midY = (y1 + y2) / 2;
              const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2 - 4}`;
              return (
                <g key={`${parent.node.member?.id ?? 'root'}-${n.node.member?.id ?? 'leaf'}`}>
                  <path
                    d={d}
                    fill="none"
                    stroke="url(#lineage)"
                    strokeWidth={3}
                    strokeDasharray="6 4"
                    markerEnd="url(#lineage-arrow)"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
          </svg>

          {nodes.map((n, idx) => {
            const palette =
              generationPalette[n.depth % generationPalette.length]!;
            const isRoot = n.depth === 0;
            const memberId = n.node.member?.id;
            const content = (
              <div
                className={`group absolute flex flex-col rounded-2xl border-2 p-3 shadow-medium ring-1 transition hover:shadow-large hover:-translate-y-0.5 ${palette.bg} ${palette.ring} ${
                  isRoot
                    ? 'border-amber-400/80 ring-amber-300'
                    : n.isLeaf
                      ? 'border-rose-300/80 ring-rose-200'
                      : 'border-neutral-200'
                }`}
                style={{
                  left: n.x,
                  top: n.y,
                  width: NODE_W,
                  height: NODE_H,
                }}
              >
                <div className="flex items-start gap-2">
                  <Avatar
                    name={n.node.member?.fullName ?? '?'}
                    size="sm"
                    className="shrink-0 ring-2 ring-white"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {n.node.member?.fullName ?? 'Không rõ'}
                    </p>
                    <p className="truncate text-[11px] text-neutral-500">
                      {n.node.member?.generationName ??
                        (n.node.member?.generationNumber
                          ? `Đời ${n.node.member.generationNumber}`
                          : '')}
                    </p>
                  </div>
                  {isRoot && (
                    <Badge variant="warning" size="sm" className="shrink-0">
                      Cội nguồn
                    </Badge>
                  )}
                  {!isRoot && n.isLeaf && (
                    <Badge variant="danger" size="sm" className="shrink-0">
                      Mới nhất
                    </Badge>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-neutral-600">
                  <Badge variant="primary" size="sm" className={palette.chip}>
                    Đời {n.node.member?.generationNumber ?? n.depth + 1}
                  </Badge>
                  {n.node.year && (
                    <span className={`font-medium ${palette.accent}`}>
                      ~{n.node.year}
                    </span>
                  )}
                </div>
                {n.node.story && (
                  <p className="mt-1 line-clamp-2 text-[11px] italic text-neutral-600">
                    &ldquo;{n.node.story}&rdquo;
                  </p>
                )}
              </div>
            );
            return memberId && buildMemberHref ? (
              <Link
                key={`${memberId}-${idx}`}
                href={buildMemberHref(memberId)}
                className="block"
              >
                {content}
              </Link>
            ) : (
              <div key={`${memberId ?? 'node'}-${idx}`}>{content}</div>
            );
          })}
        </div>
      </div>

      {/* Direction legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 px-1 text-[11px] text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <ArrowDown className="h-3 w-3 text-amber-600" />
          Hướng truyền dạy
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border-2 border-amber-400/80 bg-amber-50" />
          Cội nguồn
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border-2 border-rose-300/80 bg-rose-50" />
          Thế hệ mới nhất
        </span>
      </div>

      {/* Linear readout */}
      {nodes.length > 0 && (
        <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
          <p className="font-semibold text-neutral-700">Hành trình truyền dạy:</p>
          <ol className="mt-2 flex flex-wrap items-center gap-2">
            {nodes.map((n, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="rounded-full bg-white px-2 py-0.5 font-medium text-neutral-800 shadow-sm">
                  {n.node.member?.fullName ?? '?'}
                </span>
                {idx < nodes.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
}

function countNodes(n: GenealogyTreeNode): number {
  return 1 + (n.children ?? []).reduce((acc, c) => acc + countNodes(c), 0);
}

function leafCountOf(n: GenealogyTreeNode): number {
  if (!n.children || n.children.length === 0) return 1;
  return n.children.reduce((acc, c) => acc + leafCountOf(c), 0);
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-white/80 p-3 shadow-soft backdrop-blur-sm">
      <div className="flex items-center gap-2 text-neutral-500">
        <div className="text-primary-600">{icon}</div>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}

export default RecipeGenealogy;