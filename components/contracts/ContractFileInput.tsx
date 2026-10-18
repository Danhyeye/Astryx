'use client';

import {useEffect, useRef} from 'react';
import {FileInput} from '@astryxdesign/core/FileInput';
import {CONTRACT_FILE_ACCEPT, MAX_CONTRACT_FILE_SIZE} from '@/lib/contractFiles';

export function ContractFileInput({files,onChange,isDisabled,label = "Tệp hợp đồng"}: {
  files:File[];onChange:(files:File[])=>void;isDisabled:boolean;label?:string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = inputRef.current;
    // The native file-picker cancel event must not reach the parent dialog.
    const stopCancel = (event: Event) => event.stopPropagation();
    input?.addEventListener('cancel', stopCancel);
    return () => input?.removeEventListener('cancel', stopCancel);
  }, []);

  return <FileInput label={label} description="PDF hoặc DOCX, tối đa 5 tệp, mỗi tệp 10 MB. Tệp được tải lên khi lưu hợp đồng."
    ref={inputRef}
    mode="dropzone" accept={CONTRACT_FILE_ACCEPT} maxSize={MAX_CONTRACT_FILE_SIZE}
    maxFiles={5} isMultiple value={files} onChange={value=>onChange(Array.isArray(value)?value:value?[value]:[])}
    isDisabled={isDisabled} />;
}
