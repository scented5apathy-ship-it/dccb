import type { FamilyMember } from './family';

/** Difficulty enum - matches backend Difficulty */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'EASY' | 'MEDIUM' | 'HARD';

/** Reaction type - matches backend ReactionType */
export type ReactionType = 'LIKE' | 'LOVE' | 'YUM' | 'WANT_TO_TRY';

/** Single ingredient in a recipe (matches backend IngredientDto). */
export interface Ingredient {
  id?: string;
  name: string;
  quantity?: string | number;
  unit?: string;
  notes?: string;
  orderIndex?: number;
}

/** Single step in a recipe (matches backend StepDto). */
export interface RecipeStep {
  id?: string;
  stepNumber?: number;
  order?: number;
  instruction?: string;
  description?: string;
  durationMinutes?: number;
  imageUrl?: string;
}

/** Recipe entity (matches backend RecipeDto). */
export interface Recipe {
  id: string;
  familyId: string;
  authorId?: string;
  title: string;
  description?: string;
  story?: string;
  cuisineType?: string;
  difficulty?: Difficulty;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  instructions?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Compact user summary (matches backend UserSummary). */
export interface UserSummary {
  id: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}

/** Compact member summary (matches OriginDto.MemberSummary). */
export interface MemberSummary {
  id: string;
  fullName?: string;
  generationNumber?: number;
  generationName?: string;
}

/** Recipe + stats (matches backend RecipeWithStats). */
export interface RecipeWithStats {
  recipe: Recipe;
  author?: UserSummary | null;
  reactions?: ReactionCountMap;
  comments?: number;
  origins?: number;
  viewCount?: number;
}

/** Recipe detail - one response carries everything the detail page needs. */
export interface RecipeDetail {
  recipe: Recipe;
  author?: UserSummary | null;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  origins: RecipeOrigin[];
  comments: CommentThread[];
  reactions?: ReactionCountMap;
  userReaction?: ReactionType | null;
}

/** Reaction count map - shape returned by the recipe endpoint. */
export interface ReactionCountMap {
  like?: number;
  love?: number;
  yum?: number;
  want_to_try?: number;
  wantToTry?: number;
}

/** Paginated recipes (matches backend PaginatedRecipes). */
export interface PaginatedRecipes {
  recipes: RecipeWithStats[];
  total: number;
  page: number;
  size: number;
}

/** Genealogy origin edge (matches backend OriginDto). */
export interface RecipeOrigin {
  id: string;
  recipeId: string;
  fromMemberId?: string;
  toMemberId?: string;
  yearTransmitted?: number;
  generationGap?: number;
  story?: string;
  createdAt?: string;
  fromMember?: MemberSummary;
  toMember?: MemberSummary;
}

/** Genealogy tree response (matches backend GenealogyTreeResponse). */
export interface RecipeGenealogyTree {
  recipe: { id: string; title: string };
  tree: GenealogyTreeNode;
  totalGenerations: number;
  oldestYear?: number | null;
  newestYear?: number | null;
}

export interface GenealogyTreeNode {
  member: MemberSummary;
  year?: number | null;
  story?: string;
  children: GenealogyTreeNode[];
}

/** Comment thread (matches backend CommentThread). */
export interface CommentThread {
  comment: RecipeComment;
  replies: CommentThread[];
}

export interface RecipeComment {
  id: string;
  recipeId?: string;
  userId?: string;
  parentCommentId?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  user?: UserSummary;
}

/** Flattened comment shape - the API returns either CommentThread or plain CommentDto. */
export type RecipeThreadComment =
  | (RecipeComment & { replies?: RecipeThreadComment[] })
  | CommentThread;

/** Reaction counts (matches backend ReactionCounts). */
export interface ReactionCounts {
  like: number;
  love: number;
  yum: number;
  wantToTry: number;
  users?: UserReaction[];
}

export interface UserReaction {
  userId: string;
  fullName?: string;
  avatarUrl?: string;
  reactionType: ReactionType;
}

/** Create recipe request - matches backend CreateRecipeRequest. */
export interface CreateRecipeRequest {
  title: string;
  description?: string;
  story?: string;
  cuisineType?: string;
  difficulty?: Difficulty;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  instructions?: string;
  imageUrl?: string;
  isPublic?: boolean;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  origins: CreateOriginRequest[];
}

/** Update recipe request - matches backend UpdateRecipeRequest. */
export interface UpdateRecipeRequest {
  title?: string;
  description?: string;
  story?: string;
  cuisineType?: string;
  difficulty?: Difficulty;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  instructions?: string;
  imageUrl?: string;
  isPublic?: boolean;
  ingredients?: Ingredient[];
  steps?: RecipeStep[];
  origins?: CreateOriginRequest[];
}

/** Create origin request - matches backend CreateOriginRequest. */
export interface CreateOriginRequest {
  fromMemberId: string;
  toMemberId: string;
  yearTransmitted?: number;
  generationGap?: number;
  story?: string;
}

/** Create comment request. */
export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
}

/** Update comment request. */
export interface UpdateCommentRequest {
  content: string;
}

/** Recipe list filters. */
export interface RecipeFilters {
  cuisine?: string;
  difficulty?: string;
  search?: string;
  authorId?: string;
  page?: number;
  size?: number;
  sort?: 'popular' | 'recent' | 'trending';
}

/** Public search filters. */
export interface PublicRecipeFilters {
  cuisine?: string;
  difficulty?: string;
  search?: string;
  sort?: 'popular' | 'recent' | 'trending';
  page?: number;
  size?: number;
}

// Legacy alias kept for backwards compatibility with existing components.
export type RecipeOriginLegacy = {
  id: string;
  recipeId: string;
  memberId: string;
  member?: FamilyMember;
  generation: number;
  year?: number;
  notes?: string;
  modifications?: string;
};