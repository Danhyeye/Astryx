export type ApiResponse<TData> = {
  code: number;
  message: string;
  data: TData | null;
};

export type ApiErrorResponse = ApiResponse<null>;
