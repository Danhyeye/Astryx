export type AppUser = {
  email: string;
  is_active: boolean;
  created_at: string;
};

export type AppUsersResponse = {
  data: AppUser[];
  total: number;
  activeCount: number;
  disabledCount: number;
  page: number;
  pageSize: number;
};
