import {isVietnamPhone, isValidEmail, PHONE_ERROR, EMAIL_ERROR} from '@/utils/contact';
import {type FormEvent, useState} from 'react';
import {EntityFormBanner as Banner} from './EntityFormBanner';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from '@astryxdesign/core/Layout';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';

import type {CustomerTableRow} from '@/data';
import {useUpdateCustomer} from '@/hooks/useCustomers';
import {
  buildCustomerPayload,
  createCustomerFormFromCustomer,
  isCustomerFormValid,
} from './entityForms';
import {EntitySinglePageActions, EntitySinglePageForm} from './EntitySinglePageForm';

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

  return 'Vui lòng kiểm tra thông tin khách hàng và thử lại.';
}

export function EditCustomerDialog({
  customer,
  isOpen,
  onOpenChange,
  onSaved,
}: {
  customer: CustomerTableRow;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaved?: (customerId: string) => void;
}) {
  const formId = `edit-customer-${customer.id}`;
  const [form, setForm] = useState(() =>
    createCustomerFormFromCustomer(customer),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const updateCustomer = useUpdateCustomer();
  const isSubmitting = updateCustomer.isPending;
  const isFormValid = isCustomerFormValid(form);

  const handleOpenChange = (open: boolean) => {
    if (!open && isSubmitting) {
      return;
    }

    if (!open) {
      setForm(createCustomerFormFromCustomer(customer));

      setSubmitError(null);
    }

    onOpenChange(open);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || isSubmitting) {
      return;
    }

    setSubmitError(null);

    try {
      const response = await updateCustomer.mutateAsync({
        id: customer.id,
        data: buildCustomerPayload(form),
      });
      const updatedCustomer = response.data;

      onSaved?.(updatedCustomer?.id ?? customer.id);
      handleOpenChange(false);
    } catch (error) {
      setSubmitError(errorMessageOf(error));
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      purpose="form"
      width={720}
      maxHeight="88dvh"
      padding={5}>
      <Layout
        height="fill"
        header={
          <DialogHeader
            title="Chỉnh sửa khách hàng"
            subtitle={customer.customer}
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent padding={4} label="Biểu mẫu chỉnh sửa khách hàng">
            <form id={formId} onSubmit={handleSubmit}>
              <VStack gap={4}>
                {submitError != null && (
                  <Banner
                    status="error"
                    title="Không thể cập nhật khách hàng"
                    description={submitError}
                    container="section"
                  />
                )}

                <EntitySinglePageForm
                  sections={[
                    {
                      label: 'Danh tính',
                      content: <TextInput
                    label="Tên khách hàng"
                    value={form.name}
                    onChange={name =>
                      setForm(current => ({
                        ...current,
                        name,
                      }))
                    }
                    isRequired
                    hasAutoFocus
                    isDisabled={isSubmitting}
                    hasClear
                      />,
                    },
                    {
                      label: 'Liên hệ',
                      content: <>
                        <TextInput
                    label="Số điện thoại"
                    placeholder="0912345678 hoặc +84912345678"
                    status={form.phone.trim() && !isVietnamPhone(form.phone) ? {type: 'error', message: PHONE_ERROR} : undefined}
                    value={form.phone}
                    onChange={phone =>
                      setForm(current => ({
                        ...current,
                        phone,
                      }))
                    }
                    isDisabled={isSubmitting}
                    hasClear
                        />
                        <TextInput
                    label="Email"
                    type="email"
                    placeholder="ten@example.com"
                    status={form.email.trim() && !isValidEmail(form.email) ? {type: 'error', message: EMAIL_ERROR} : undefined}
                    value={form.email}
                    onChange={email =>
                      setForm(current => ({
                        ...current,
                        email,
                      }))
                    }
                    isDisabled={isSubmitting}
                    hasClear
                        />
                      </>,
                    },
                    {
                      label: 'Địa chỉ và ghi chú',
                      content: <>
                        <TextInput
                    label="Địa chỉ"
                    value={form.address}
                    onChange={address =>
                      setForm(current => ({
                        ...current,
                        address,
                      }))
                    }
                    isDisabled={isSubmitting}
                    hasClear
                        />
                        <TextArea
                    label="Ghi chú"
                    value={form.notes}
                    onChange={notes =>
                      setForm(current => ({
                        ...current,
                        notes,
                      }))
                    }
                    rows={4}
                    isDisabled={isSubmitting}
                        />
                      </>,
                    },
                  ]}
                />
              </VStack>
            </form>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <EntitySinglePageActions
              formId={formId}
              isFormValid={isFormValid}
              isSubmitting={isSubmitting}
              onCancel={() => handleOpenChange(false)}
              submitLabel="Lưu thay đổi"
            />
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
