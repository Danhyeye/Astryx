'use client';

import type {ComponentProps} from 'react';
import {TextInput} from '@astryxdesign/core/TextInput';

type PhoneInputProps = Omit<ComponentProps<typeof TextInput>, 'type' | 'ref' | 'changeAction'>;

// Astryx currently exposes only text/password/email types. Configure its native
// input for telephone entry while keeping the phone value as a string.
function configurePhoneInput(input: HTMLInputElement | null) {
  if (!input) return;
  input.type = 'tel';
  input.inputMode = 'tel';
  input.autocomplete = 'tel';
}

export function PhoneInput({onChange, ...props}: PhoneInputProps) {
  return <TextInput {...props} ref={configurePhoneInput} onChange={(value, event) => {
    if (/^\+?[\d\s().-]*$/.test(value)) onChange?.(value, event);
  }} />;
}
