import type {ApiResponse} from './api-response';

export type GoogleCalendarStatus = {
  isConfigured: boolean;
  missing: string[];
  isConnected: boolean;
  needsReconnect: boolean;
  accountEmail: string | null;
  calendarId: string;
  lastSyncedAt: string | null;
};

export type GoogleCalendarSyncSummary = {
  date: string;
  total: number;
  created: number;
  updated: number;
  deleted: number;
  failed: number;
  calendarId: string;
  errors: string[];
};

export type GoogleCalendarStatusResponse =
  ApiResponse<GoogleCalendarStatus>;

export type GoogleCalendarSyncResponse =
  ApiResponse<GoogleCalendarSyncSummary>;
