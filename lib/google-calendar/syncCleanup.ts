export type GoogleEventMapping = {
  local_event_key: string | null;
  external_event_id: string | null;
};

export function findStaleGoogleEventMappings<T extends GoogleEventMapping>(
  mappings: readonly T[],
  activeLocalEventKeys: readonly string[],
): T[] {
  const activeKeys = new Set(activeLocalEventKeys);

  return mappings.filter(
    mapping =>
      mapping.local_event_key != null &&
      mapping.external_event_id != null &&
      !activeKeys.has(mapping.local_event_key),
  );
}
