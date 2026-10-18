'use client';

import {useState} from 'react';
import {Trash2} from 'lucide-react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Link} from '@astryxdesign/core/Link';
import {List, ListItem} from '@astryxdesign/core/List';
import {Text} from '@astryxdesign/core/Text';
import {fetchContractFiles, deleteContractFile, type ContractFile} from '@/lib/api/fetchContractFiles';
import {formatNumber} from '@/utils/format';

export function SavedContractFiles({contractId, isDisabled = false}: {contractId: string; isDisabled?: boolean}) {
  const query = useQuery({
    queryKey: ['contractFiles', contractId],
    queryFn: () => fetchContractFiles(contractId),
  });
  const queryClient = useQueryClient();
  const [removingFile, setRemovingFile] = useState<ContractFile | null>(null);
  const removeFile = useMutation({
    mutationFn: (file: ContractFile) => deleteContractFile(contractId, file.path),
    onSuccess: (_, deleted) => {
      queryClient.setQueryData<ContractFile[]>(['contractFiles', contractId], files => files?.filter(file => file.path !== deleted.path));
      void queryClient.invalidateQueries({queryKey: ['contractFiles', contractId]});
      setRemovingFile(null);
    },
  });
  return <VStack gap={2} className="min-w-0">
    <Heading level={4}>Tệp đã lưu</Heading>
    {query.isPending ? <Text role="status" color="secondary">Đang tải tệp hợp đồng…</Text>
      : query.isError ? <Banner status="error" title="Không thể tải tệp đã lưu" description={query.error.message}
        endContent={<Button label="Thử lại" type="button" size="sm" onClick={() => {void query.refetch();}} />} />
      : !query.data.length ? <Text color="secondary">Chưa có tệp PDF hoặc DOCX được lưu.</Text>
      : <List hasDividers density="compact" aria-label="Tệp hợp đồng đã lưu" className="max-h-64 overflow-y-auto">
        {query.data.map(file => <ListItem key={file.path} label={file.name}
          description={`${formatNumber(Math.max(1, Math.ceil(file.size / 1024)))} KB`}
          endContent={<HStack gap={2} vAlign="center">
            <Link href={`/api/contracts/${contractId}/files?path=${encodeURIComponent(file.path)}`} target="_blank" rel="noopener noreferrer">Tải xuống</Link>
            <IconButton label={`Xóa tệp ${file.name}`} tooltip="Xóa tệp" icon={<Icon icon={Trash2} size="sm" />}
              type="button" size="sm" variant="ghost" isDisabled={isDisabled || removeFile.isPending}
              onClick={() => {removeFile.reset(); setRemovingFile(file);}} />
          </HStack>} />)}
      </List>}
    <AlertDialog isOpen={removingFile !== null}
      onOpenChange={open => {if (!open && !removeFile.isPending) setRemovingFile(null);}}
      title="Xóa tệp hợp đồng?"
      description={removeFile.error?.message ?? `Xóa vĩnh viễn tệp “${removingFile?.name ?? ''}”? Tệp sẽ bị xóa ngay và không thể khôi phục khi hủy sửa hợp đồng.`}
      actionLabel="Xóa tệp" cancelLabel="Hủy" isActionLoading={removeFile.isPending}
      onAction={() => {if (removingFile && !removeFile.isPending && !isDisabled) removeFile.mutate(removingFile);}} />
  </VStack>;
}
