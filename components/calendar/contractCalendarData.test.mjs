import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildContractCalendarEvents,
  buildContractOptions,
  eventDateKey,
} from './contractCalendarData.ts';

function createContract(overrides = {}) {
  return {
    id: 'contract-1',
    deposit_amount: 0,
    rent_amount: 1000,
    due_day: 1,
    lease_duration_months: 12,
    payment_frequency: 'MONTHLY',
    payment_due_day: 1,
    next_payment_due_date: '2026-01-01',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'ACTIVE',
    notes: '',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    customers: [
      {
        id: 'customer-1',
        name: 'Acme Tenant',
        phone: '',
        email: '',
        address: '',
        notes: '',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
    lands: [
      {
        id: 'land-1',
        name: 'North Field',
        location: 'District 9',
        area_sqm: 1000,
        description: '',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        images: [],
      },
    ],
    plots: [],
    ...overrides,
  };
}

test('buildContractCalendarEvents expands monthly quarterly and yearly due dates', () => {
  const events = buildContractCalendarEvents([
    createContract({
      id: 'monthly',
      rent_amount: 1000,
      payment_frequency: 'MONTHLY',
      due_day: 5,
      payment_due_day: 1,
      start_date: '2026-01-01',
      end_date: '2026-03-31',
    }),
    createContract({
      id: 'quarterly',
      rent_amount: 3000,
      payment_frequency: 'QUARTERLY',
      due_day: 10,
      payment_due_day: 1,
      start_date: '2026-01-01',
      end_date: '2026-07-31',
    }),
    createContract({
      id: 'yearly',
      rent_amount: 12000,
      payment_frequency: 'YEARLY',
      due_day: 15,
      payment_due_day: 1,
      start_date: '2026-01-01',
      end_date: '2027-12-31',
    }),
  ]);

  assert.deepEqual(
    events.map(event => [event.contractId, event.date, event.amount]),
    [
      ['monthly', '2026-01-05', 1000],
      ['quarterly', '2026-01-10', 3000],
      ['yearly', '2026-01-15', 12000],
      ['monthly', '2026-02-05', 1000],
      ['monthly', '2026-03-05', 1000],
      ['quarterly', '2026-04-10', 3000],
      ['quarterly', '2026-07-10', 3000],
      ['yearly', '2027-01-15', 12000],
    ],
  );
});

test('buildContractCalendarEvents uses contract due day inside the contract period', () => {
  const events = buildContractCalendarEvents([
    createContract({
      id: 'monthly-after-start',
      due_day: 1,
      payment_due_day: 4,
      payment_frequency: 'MONTHLY',
      start_date: '2026-09-04',
      end_date: '2027-01-02',
    }),
  ]);

  assert.deepEqual(
    events.map(event => event.date),
    ['2026-10-01', '2026-11-01', '2026-12-01', '2027-01-01'],
  );
});

test('buildContractOptions creates sorted customer and target labels', () => {
  const options = buildContractOptions([
    createContract({
      id: 'beta',
      customers: [{...createContract().customers[0], name: 'Beta Tenant'}],
      lands: [{...createContract().lands[0], name: 'South Field'}],
    }),
    createContract({
      id: 'alpha',
      customers: [{...createContract().customers[0], name: 'Alpha Tenant'}],
      lands: [{...createContract().lands[0], name: 'North Field'}],
    }),
  ]);

  assert.deepEqual(options, [
    {label: 'Alpha Tenant - North Field', value: 'alpha'},
    {label: 'Beta Tenant - South Field', value: 'beta'},
  ]);
});

test('eventDateKey returns ISO date keys for strings and dates', () => {
  assert.equal(eventDateKey('2026-09-04T12:30:00.000Z'), '2026-09-04');
  assert.equal(
    eventDateKey(new Date('2026-10-11T18:30:00.000Z')),
    '2026-10-11',
  );
  assert.equal(eventDateKey('not-a-date'), '');
});
