import {useState} from 'react';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';

import type {CustomerTableRow} from '@/data';
import {useDeleteCustomer} from '@/hooks/useCustomers';

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

  return 'Please try deleting the selected customer again.';
}

export function DeleteCustomersDialog({
  customers,
  isOpen,
  onOpenChange,
  onDeleted,
}: {
  customers: CustomerTableRow[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDeleted?: (customerIds: string[]) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const deleteCustomer = useDeleteCustomer();
  const isDeleting = deleteCustomer.isPending;
  const count = customers.length;
  const isSingle = count === 1;
  const targetLabel = isSingle
    ? customers[0]?.customer ?? 'this customer'
    : `${count} customers`;
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
      for (const customer of customers) {
        await deleteCustomer.mutateAsync(customer.id);
      }

      onDeleted?.(customers.map(customer => customer.id));
      handleOpenChange(false);
    } catch (error) {
      setSubmitError(errorMessageOf(error));
    }
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={
        submitError == null ? 'Delete customer?' : 'Could not delete customer'
      }
      description={description}
      actionLabel={isSingle ? 'Delete customer' : 'Delete customers'}
      onAction={handleDelete}
      isActionLoading={isDeleting}
      width={420}
    />
  );
}
