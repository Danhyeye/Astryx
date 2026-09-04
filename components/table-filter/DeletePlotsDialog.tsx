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

  return 'Please try deleting the selected plot again.';
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
  const targetLabel = isSingle ? plots[0]?.summary ?? 'this plot' : `${count} plots`;
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
      title={submitError == null ? 'Delete plot?' : 'Could not delete plot'}
      description={description}
      actionLabel={isSingle ? 'Delete plot' : 'Delete plots'}
      onAction={handleDelete}
      isActionLoading={isDeleting}
      width={420}
    />
  );
}
