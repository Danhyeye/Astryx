'use client';

import {useState} from 'react';
import {Dialog,DialogHeader} from '@astryxdesign/core/Dialog';
import {Button} from '@astryxdesign/core/Button';
import {Banner} from '@astryxdesign/core/Banner';
import {Layout,LayoutContent,LayoutFooter,HStack,VStack} from '@astryxdesign/core/Layout';
import {ContractFileInput} from './ContractFileInput';
import {uploadContractFiles} from '@/lib/api/fetchContractFiles';

export function UploadContractFilesDialog({id,onClose,onUploaded}: {
  id:string;onClose:()=>void;onUploaded:()=>void;
}) {
  const [files,setFiles]=useState<File[]>([]);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const close=()=>{if(!pending)onClose();};
  async function upload() {
    if(pending || !files.length)return;
    setPending(true);setError(null);
    try {await uploadContractFiles(id,files);onUploaded();onClose();}
    catch(error){setError(error instanceof Error?error.message:'Không thể tải tệp. Vui lòng thử lại.');}
    finally{setPending(false);}
  }
  return <Dialog isOpen onOpenChange={open=>{if(!open)close();}} purpose="form" width={560} padding={5}>
    <Layout height="auto"
      header={<DialogHeader title="Thêm tệp hợp đồng" onOpenChange={open=>{if(!open)close();}} />}
      content={<LayoutContent padding={4} label="Tải tệp hợp đồng"><VStack gap={4}>
        {error && <Banner status="error" title="Tải tệp thất bại" description={error} />}
        <ContractFileInput files={files} onChange={setFiles} isDisabled={pending} />
      </VStack></LayoutContent>}
      footer={<LayoutFooter hasDivider><HStack gap={3} hAlign="end">
        <Button label="Hủy" variant="ghost" isDisabled={pending} onClick={close} />
        <Button label="Tải tệp lên" variant="primary" isDisabled={!files.length || pending} isLoading={pending} onClick={upload} />
      </HStack></LayoutFooter>} />
  </Dialog>;
}
