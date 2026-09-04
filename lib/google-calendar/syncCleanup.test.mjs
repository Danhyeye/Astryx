import assert from 'node:assert/strict';
import test from 'node:test';

import {findStaleGoogleEventMappings} from './syncCleanup.ts';

test('findStaleGoogleEventMappings returns mapped Google events outside the active due keys', () => {
  const stale = findStaleGoogleEventMappings(
    [
      {
        id: 'mapping-1',
        local_event_key: 'contract-1:2026-09-04',
        external_event_id: 'google-1',
      },
      {
        id: 'mapping-2',
        local_event_key: 'contract-1:2026-10-01',
        external_event_id: 'google-2',
      },
      {
        id: 'mapping-3',
        local_event_key: 'contract-1:2026-11-04',
        external_event_id: null,
      },
      {
        id: 'mapping-4',
        local_event_key: null,
        external_event_id: 'google-4',
      },
    ],
    ['contract-1:2026-10-01'],
  );

  assert.deepEqual(
    stale.map(mapping => mapping.id),
    ['mapping-1'],
  );
});
