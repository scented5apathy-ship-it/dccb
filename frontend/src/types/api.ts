/**
 * Generic API response envelopes shared by every backend endpoint.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp?: string;
}

export interface ApiError {
  code?: string;
  message: string;
  details?: Record<string, string[]>;
  status?: number;
}

export interface MessageResponse {
  message: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortOption<TField extends string = string> {
  field: TField;
  direction: SortDirection;
}