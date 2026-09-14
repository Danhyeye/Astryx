'use client';

import {useLayoutEffect, useRef, useState} from 'react';
import {InputGroup, InputGroupText} from '@astryxdesign/core/InputGroup';
import {TextInput} from '@astryxdesign/core/TextInput';

import {formatInputNumber} from '@/utils/format';
import {formatCurrencyEdit} from './currencyEditing';

interface CurrencyInputProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  units?: string;
  isRequired?: boolean;
  hasClear?: boolean;
  isWheelEnabled?: boolean;
  isDisabled?: boolean;
}

export function CurrencyInput({
  label, value, onChange, min = 0, max = Number.MAX_SAFE_INTEGER,
  step = 1, units = 'VND', isRequired, hasClear, isDisabled,
}: CurrencyInputProps) {
  const input = useRef<HTMLInputElement>(null);
  const selection = useRef<number | null>(null);
  const [draft, setDraft] = useState<{text: string; value: number} | null>(null);
  const text = draft !== null && draft.value === value ? draft.text : value == null ? '' : formatInputNumber(value);

  useLayoutEffect(() => {
    if (input.current) input.current.inputMode = 'numeric';
    if (selection.current !== null) {
      input.current?.setSelectionRange(selection.current, selection.current);
      selection.current = null;
    }
  });

  function commit() {
    const next = Math.min(max, Math.max(min, value ?? 0));
    setDraft(null);
    if (next !== value) onChange(next);
  }

  return (
    <InputGroup label={label} isRequired={isRequired} isDisabled={isDisabled}>
      <TextInput
        ref={input}
        label={label}
        value={text}
        isRequired={isRequired}
        isDisabled={isDisabled}
        hasClear={hasClear}
        onChange={(next, event) => {
          const edit = formatCurrencyEdit(next, event.target.selectionStart ?? next.length);
          if (edit === null) return;
          selection.current = edit.cursor;
          setDraft(edit);
          onChange(edit.value);
        }}
        onBlur={commit}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'Enter') commit();
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            const next = Math.min(max, Math.max(min, (value ?? 0) + (event.key === 'ArrowUp' ? step : -step)));
            setDraft(null);
            onChange(next);
          }
          // Skip grouping characters so Backspace/Delete removes a digit.
          const element = event.currentTarget;
          const cursor = element.selectionStart ?? 0;
          if (cursor !== element.selectionEnd) return;
          if (event.key === 'Backspace' && text[cursor - 1] === ',') {
            element.setSelectionRange(cursor - 1, cursor - 1);
          } else if (event.key === 'Delete' && text[cursor] === ',') {
            element.setSelectionRange(cursor + 1, cursor + 1);
          }
        }}
      />
      <InputGroupText>{units}</InputGroupText>
    </InputGroup>
  );
}
