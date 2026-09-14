import {fetchAllPages} from '@/lib/api/fetchAllPages';
import {NextResponse} from 'next/server';

import {buildSelectedDaySync, parseSyncDate} from '@/lib/google-calendar/selectedDaySync';
import {
  buildGoogleDueEvent,
  deleteGoogleEvent,
  getGoogleCalendarEnv,
  insertGoogleEvent,
  isTokenExpired,
  refreshGoogleAccessToken,
  tokenExpiresAt,
  updateGoogleEvent,
} from '@/lib/google-calendar/googleCalendar';
import {contractStatusToDatabase, contractStatusFromDatabase, paymentFrequencyFromDatabase} from '@/lib/contractDbValues';
import {mapCustomer, mapLand, mapPlot} from '@/lib/mappers';
import {createAdminClient} from '@/lib/supabase/admin';
import type {ApiErrorResponse} from '@/types/api-response';
import type {Contract} from '@/types/contract';
import type {Database} from '@/types/database.types';
import type {GoogleCalendarSyncResponse} from '@/types/google-calendar';

type AdminClient = ReturnType<typeof createAdminClient>;
type ContractRow = Database['public']['Tables']['contracts']['Row'];
type CustomerRow = Database['public']['Tables']['customers']['Row'];
type LandRow = Database['public']['Tables']['lands']['Row'];
type PlotRow = Database['public']['Tables']['plots']['Row'];
type CalendarIntegrationRow =
  Database['public']['Tables']['calendar_integrations']['Row'];
type CalendarOauthTokenRow =
  Database['public']['Tables']['calendar_oauth_tokens']['Row'];
type CalendarSyncEventRow =
  Database['public']['Tables']['calendar_sync_events']['Row'];
type ContractRowWithRelations = ContractRow & {
  contract_payments: Database['public']['Tables']['contract_payments']['Row'][] | null;
  customers: CustomerRow | null;
  lands: LandRow | null;
  plots: (PlotRow & {lands: LandRow | null}) | null;
};

const CONTRACT_SELECT = `*,
  contract_payments (*), customers (*),
  lands (*),
  plots (*, lands(*))`;

function apiError(message: string, status: number) {
  return NextResponse.json<ApiErrorResponse>(
    {code: status, message, data: null},
    {status},
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Đồng bộ Lịch Google thất bại.';
}

function toContract(row: ContractRowWithRelations): Contract {
  const {customers, lands, plots, ...contract} = row;
  const plotLand = plots?.lands ? mapLand(plots.lands) : null;

  return {
    id: contract.id,
    deposit_amount: contract.deposit_amount,
    rent_amount: contract.rent_amount,
    due_day: contract.due_day,
    lease_duration_months: contract.lease_duration_months ?? 0,
    payment_frequency: paymentFrequencyFromDatabase(contract.payment_frequency),
    payment_due_day: contract.payment_due_day ?? 0,
    next_payment_due_date: contract.next_payment_due_date ?? '',
    start_date: contract.start_date,
    end_date: contract.end_date ?? '',
    status: contractStatusFromDatabase(contract.status),
    notes: contract.notes ?? '',
    created_at: contract.created_at,
    updated_at: contract.updated_at,
    payments: row.contract_payments ?? [],
    customers: customers ? [mapCustomer(customers)] : [],
    lands: lands ? [mapLand(lands)] : [],
    plots: plots ? [mapPlot(plots, plotLand ? [plotLand] : [])] : [],
  };
}

async function loadContracts(supabase: AdminClient, date: string): Promise<Contract[]> {
  const {data} = await fetchAllPages<ContractRowWithRelations>(async (page, size) => {
    const {data, error} = await supabase.from('contracts').select(CONTRACT_SELECT)
      .neq('status', contractStatusToDatabase('CANCELLED') as ContractRow['status']).lte('start_date', date)
      .or(`end_date.is.null,end_date.gte.${date}`)
      .order('id', {ascending: true}).range((page - 1) * size, page * size - 1);
    if (error) throw new Error(error.message);
    return {data: data as ContractRowWithRelations[] | null};
  });
  return data.map(toContract);
}

async function loadIntegration(supabase: AdminClient) {
  const {data, error} = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('provider', 'google')
    .eq('status', 'active' as CalendarIntegrationRow['status'])
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function loadOauthToken(
  supabase: AdminClient,
  integrationId: string,
): Promise<CalendarOauthTokenRow | null> {
  const {data, error} = await supabase
    .from('calendar_oauth_tokens')
    .select('*')
    .eq('integration_id', integrationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function loadEventMappings(
  supabase: AdminClient,
  integrationId: string,
): Promise<Map<string, CalendarSyncEventRow>> {
  const {data} = await fetchAllPages<CalendarSyncEventRow>(async (page, size) => {
    const {data, error} = await supabase.from('calendar_sync_events').select('*')
      .eq('integration_id', integrationId).not('local_event_key', 'is', null)
      .order('id', {ascending: true}).range((page - 1) * size, page * size - 1);
    if (error) throw new Error(error.message);
    return {data};
  });

  return new Map(
    (data ?? [])
      .filter(row => row.local_event_key != null)
      .map(row => [row.local_event_key as string, row as CalendarSyncEventRow]),
  );
}

async function getAccessToken(
  supabase: AdminClient,
  config: ReturnType<typeof getGoogleCalendarEnv>,
  token: CalendarOauthTokenRow,
): Promise<string> {
  if (!isTokenExpired(token.expires_at)) {
    return token.access_token;
  }

  if (token.refresh_token == null) {
    throw new Error('Vui lòng kết nối lại Lịch Google.');
  }

  const refreshed = await refreshGoogleAccessToken(config, token.refresh_token);
  const {error} = await supabase
    .from('calendar_oauth_tokens')
    .update({
      access_token: refreshed.access_token,
      token_type: refreshed.token_type ?? token.token_type,
      scope: refreshed.scope ?? token.scope,
      expires_at: tokenExpiresAt(refreshed.expires_in),
    })
    .eq('id', token.id);

  if (error) {
    throw new Error(error.message);
  }

  return refreshed.access_token;
}

async function saveSyncEvent({
  supabase,
  existing,
  integrationId,
  contractId,
  localEventKey,
  dueDate,
  externalEventId,
  externalEventUrl,
  status,
  lastError,
  syncedAt,
}: {
  supabase: AdminClient;
  existing: CalendarSyncEventRow | undefined;
  integrationId: string;
  contractId: string;
  localEventKey: string;
  dueDate: string;
  externalEventId: string | null;
  externalEventUrl: string | null;
  status: 'synced' | 'failed';
  lastError: string | null;
  syncedAt: string | null;
}) {
  const payload = {
    integration_id: integrationId,
    contract_payment_id: null,
    contract_id: contractId,
    local_event_key: localEventKey,
    due_date: dueDate,
    external_event_id: externalEventId,
    external_event_url: externalEventUrl,
    status: status as CalendarSyncEventRow['status'],
    last_error: lastError,
    synced_at: syncedAt,
  };
  const result =
    existing == null
      ? await supabase.from('calendar_sync_events').insert(payload)
      : await supabase
          .from('calendar_sync_events')
          .update(payload)
          .eq('id', existing.id);

  if (result.error) {
    throw new Error(result.error.message);
  }
}

async function markSyncEventDeleted(
  supabase: AdminClient,
  event: CalendarSyncEventRow,
  syncedAt: string,
) {
  const {error} = await supabase
    .from('calendar_sync_events')
    .update({
      external_event_id: null,
      external_event_url: null,
      status: 'deleted' as CalendarSyncEventRow['status'],
      last_error: null,
      synced_at: syncedAt,
    })
    .eq('id', event.id);

  if (error) {
    throw new Error(error.message);
  }
}

async function markSyncEventFailed(
  supabase: AdminClient,
  event: CalendarSyncEventRow,
  lastError: string,
) {
  const {error} = await supabase
    .from('calendar_sync_events')
    .update({
      status: 'failed' as CalendarSyncEventRow['status'],
      last_error: lastError,
    })
    .eq('id', event.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(request: Request) {
  const date = parseSyncDate(await request.json().catch(() => null));
  if (date == null) {
    return apiError('Vui lòng chọn ngày đồng bộ hợp lệ (YYYY-MM-DD).', 400);
  }
  const config = getGoogleCalendarEnv();

  if (!config.isConfigured) {
    return apiError(
      `Thiếu cấu hình Lịch Google: ${config.missing.join(', ')}`,
      400,
    );
  }

  try {
    const supabase = createAdminClient();
    const integration = await loadIntegration(supabase);

    if (integration == null) {
      return apiError('Chưa kết nối Lịch Google.', 409);
    }

    const token = await loadOauthToken(supabase, integration.id);

    if (token == null) {
      return apiError('Vui lòng kết nối lại Lịch Google.', 409);
    }

    const accessToken = await getAccessToken(supabase, config, token);
    const contracts = await loadContracts(supabase, date);
    const mappings = await loadEventMappings(supabase, integration.id);
    const {events: dueEvents, staleMappings} = buildSelectedDaySync(contracts, [...mappings.values()], date);
    const errors: string[] = [];
    let created = 0;
    let updated = 0;
    let deleted = 0;
    let failed = 0;

    for (const event of dueEvents) {
      const existing = mappings.get(event.id);

      try {
        const payload = buildGoogleDueEvent(event);
        const googleEvent =
          existing?.external_event_id == null
            ? await insertGoogleEvent(config, accessToken, payload)
            : await updateGoogleEvent(
                config,
                accessToken,
                existing.external_event_id,
                payload,
              );
        const syncedAt = new Date().toISOString();

        await saveSyncEvent({
          supabase,
          existing,
          integrationId: integration.id,
          contractId: event.contractId,
          localEventKey: event.id,
          dueDate: event.date,
          externalEventId: googleEvent.id,
          externalEventUrl: googleEvent.htmlLink ?? existing?.external_event_url ?? null,
          status: 'synced',
          lastError: null,
          syncedAt,
        });

        if (existing?.external_event_id == null) {
          created += 1;
        } else {
          updated += 1;
        }
      } catch (error) {
        const message = messageOf(error);
        failed += 1;
        errors.push(`${event.contractLabel} ${event.date}: ${message}`);

        await saveSyncEvent({
          supabase,
          existing,
          integrationId: integration.id,
          contractId: event.contractId,
          localEventKey: event.id,
          dueDate: event.date,
          externalEventId: existing?.external_event_id ?? null,
          externalEventUrl: existing?.external_event_url ?? null,
          status: 'failed',
          lastError: message,
          syncedAt: null,
        });
      }
    }

    for (const staleMapping of staleMappings) {
      const externalEventId = staleMapping.external_event_id;

      if (externalEventId == null) {
        continue;
      }

      try {
        await deleteGoogleEvent(config, accessToken, externalEventId);
        await markSyncEventDeleted(supabase, staleMapping, new Date().toISOString());
        deleted += 1;
      } catch (error) {
        const message = messageOf(error);
        failed += 1;
        errors.push(
          `${staleMapping.local_event_key ?? 'Sự kiện Google cũ'}: ${message}`,
        );
        await markSyncEventFailed(supabase, staleMapping, message);
      }
    }

    const syncedAt = new Date().toISOString();
    const {error: integrationUpdateError} = await supabase
      .from('calendar_integrations')
      .update({
        calendar_id: config.calendarId,
        last_synced_at: syncedAt,
      })
      .eq('id', integration.id);

    if (integrationUpdateError) {
      throw new Error(integrationUpdateError.message);
    }

    return NextResponse.json<GoogleCalendarSyncResponse>({
      code: 200,
      message:
        failed === 0
          ? 'Đã đồng bộ Lịch Google.'
          : 'Đã đồng bộ Lịch Google nhưng có lỗi.',
      data: {
        date,
        total: dueEvents.length,
        created,
        updated,
        deleted,
        failed,
        calendarId: config.calendarId,
        errors,
      },
    });
  } catch (error) {
    return apiError(messageOf(error), 500);
  }
}
