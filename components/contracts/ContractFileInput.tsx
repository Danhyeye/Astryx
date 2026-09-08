import {FileInput} from '@astryxdesign/core/FileInput';
import {CONTRACT_FILE_ACCEPT, MAX_CONTRACT_FILE_SIZE} from '@/lib/contractFiles';

export function ContractFileInput({files,onChange,isDisabled}: {
  files:File[];onChange:(files:File[])=>void;isDisabled:boolean;
}) {
  return <FileInput label="Tệp hợp đồng" description="PDF hoặc DOCX, tối đa 5 tệp, mỗi tệp 10 MB. Tệp được tải lên khi lưu hợp đồng."
    mode="dropzone" accept={CONTRACT_FILE_ACCEPT} maxSize={MAX_CONTRACT_FILE_SIZE}
    maxFiles={5} isMultiple value={files} onChange={value=>onChange(Array.isArray(value)?value:value?[value]:[])}
    isDisabled={isDisabled} />;
}
