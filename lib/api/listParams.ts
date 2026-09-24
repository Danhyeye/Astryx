/** Validated paging and allowlisted sorting for entity list endpoints. */
export function listParams(params: URLSearchParams, entity: string) {
  const integer = (key: string, fallback: number, max: number) => {
    const value = Number(params.get(key) ?? fallback);
    return Number.isSafeInteger(value) && value > 0 ? Math.min(value, max) : fallback;
  };
  const page = integer('page', 1, 1000000);
  const pageSize = integer('pageSize', 15, 100);
  const fields: Record<string, string> = {
    summary: entity === 'plots' ? 'plot_number' : entity === 'contracts' ? 'customers(name)' : 'name',
    status: 'status', plotNumber: 'plot_number', areaSqm: 'area_sqm',
    phone: 'phone', email: 'email', address: 'address', location: 'location',
    description: 'description', notes: 'notes', rentAmount: 'rent_amount',
    depositAmount: 'deposit_amount', paymentFrequency: 'payment_frequency',
    nextPaymentDueSort: 'next_payment_due_date', nextPaymentDueDate: 'next_payment_due_date',
    startDate: 'start_date', endDate: 'end_date', createdAt: 'created_at', updatedAt: 'updated_at',
    land: 'lands(name)', landLocation: 'lands(location)',
  };
  const allowed: Record<string, string[]> = {
    lands: ['summary','areaSqm','location','description','createdAt','updatedAt'],
    customers: ['summary','phone','email','address','createdAt','updatedAt'],
    plots: ['summary','plotNumber','areaSqm','status','description','land','landLocation','createdAt','updatedAt'],
    contracts: ['summary','status','rentAmount','depositAmount','paymentFrequency','nextPaymentDueSort','nextPaymentDueDate','startDate','endDate','createdAt','updatedAt','land'],
  };
  const key = params.get('sort') ?? 'createdAt';
  const secondary = params.get('sort2') ?? '';
  return {page, pageSize, from: (page - 1) * pageSize, to: page * pageSize - 1,
    sort: fields[allowed[entity]?.includes(key) ? key : 'createdAt'],
    ascending: params.get('direction') === 'ascending',
    sort2: allowed[entity]?.includes(secondary) ? fields[secondary] : 'id',
    ascending2: params.get('direction2') !== 'descending',
    // Strip PostgREST expression syntax; percent/underscore are literal search input.
    search: (params.get('q') ?? '').trim().replace(/[(),.*%_\\"']/g, ' ').trim(),
  };
}
