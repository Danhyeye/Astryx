export type ApiResponse<TData> = {
  total?: number;
  page?: number;
  pageSize?: number;
  code: number;
  message: string;
  data: TData | null;
};

export type ApiErrorResponse = ApiResponse<null>;
