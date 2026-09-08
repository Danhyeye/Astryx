import {useState} from 'react';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';

import type {PlotTableRow} from '@/data';
import {useDeletePlot} from '@/hooks/usePlots';

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

  return 'Vui lòng thử xóa lô đất đã chọn lần nữa.';
}

export function DeletePlotsDialog({
  plots,
  isOpen,
  onOpenChange,
  onDeleted,
}: {
  plots: PlotTableRow[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDeleted?: (plotIds: string[]) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const deletePlot = useDeletePlot();
  const isDeleting = deletePlot.isPending;
  const count = plots.length;
  const isSingle = count === 1;
  const targetLabel = isSingle ? plots[0]?.summary ?? 'lô đất này' : `${count} lô đất`;
  const description =
    submitError ??
    `Xóa vĩnh viễn ${targetLabel}. Không thể hoàn tác thao tác này.`;

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
      for (const plot of plots) {
        await deletePlot.mutateAsync(plot.id);
      }

      onDeleted?.(plots.map(plot => plot.id));
      handleOpenChange(false);
    } catch (error) {
      setSubmitError(errorMessageOf(error));
    }
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={submitError == null ? 'Xóa lô đất?' : 'Không thể xóa lô đất'}
      description={description}
      actionLabel={isSingle ? 'Xóa lô đất' : 'Xóa lô đất'}
      onAction={handleDelete}
      isActionLoading={isDeleting}
      width={420}
    />
  );
}
