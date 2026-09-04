import {useState} from 'react';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';

import type {LandTableRow} from '@/data';
import {useDeleteLand} from '@/hooks/useLands';

function errorMessageOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error != null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Please try deleting the selected land again.';
}

export function DeleteLandsDialog({
  lands,
  isOpen,
  onOpenChange,
  onDeleted,
}: {
  lands: LandTableRow[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDeleted?: (landIds: string[]) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const deleteLand = useDeleteLand();
  const isDeleting = deleteLand.isPending;
  const count = lands.length;
  const isSingle = count === 1;
  const targetLabel = isSingle ? lands[0]?.name ?? 'this land' : `${count} lands`;
  const description =
    submitError ??
    `This will permanently delete ${targetLabel}. This action cannot be undone.`;

  const handleOpenChange = (open: boolean) => {
    if (!open && isDeleting) {
      return;
    }

    onOpenChange(open);
  };

  const handleDelete = async () => {
    if (isDeleting || count === 0) {
      return;
    }

    setSubmitError(null);

    try {
      for (const land of lands) {
        await deleteLand.mutateAsync(land.id);
      }

      onDeleted?.(lands.map(land => land.id));
      handleOpenChange(false);
    } catch (error) {
      setSubmitError(errorMessageOf(error));
    }
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={submitError == null ? 'Delete land?' : 'Could not delete land'}
      description={description}
      actionLabel={isSingle ? 'Delete land' : 'Delete lands'}
      onAction={handleDelete}
      isActionLoading={isDeleting}
      width={420}
    />
  );
}

