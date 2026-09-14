import {type FormEvent, useEffect, useState} from 'react';
import {EntityFormBanner as Banner} from './EntityFormBanner';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {FileInput} from '@astryxdesign/core/FileInput';
import {GridSpan} from '@astryxdesign/core/Grid';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from '@astryxdesign/core/Layout';
import {NumberInput} from '@/components/NumberInput';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Thumbnail} from '@astryxdesign/core/Thumbnail';

import {useUploadImage} from '@/hooks/useImage';
import {useUpdateLand} from '@/hooks/useLands';
import type {LandTableRow} from '@/data';
import {
  buildUpdateLandPayload,
  clearReplacementImageForm,
  createLandFormFromLand,
  getReplacementImageLifecycle,
  isCreateLandFormValid,
  type ReplacementImageLifecycle,
} from './createLandForm';
import {LandImageGallery} from './LandImageGallery';
import {EntitySinglePageActions, EntitySinglePageForm} from './EntitySinglePageForm';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const REPLACEMENT_IMAGE_LABELS: Record<ReplacementImageLifecycle, string> = {
  empty: 'Chưa chọn ảnh thay thế',
  uploading: 'Đang tải ảnh thay thế lên',
  processing: 'Đang xử lý ảnh thay thế',
  loaded: 'Đã tải ảnh thay thế',
};

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

  return 'Vui lòng kiểm tra thông tin khu đất và thử lại.';
}

export function EditLandDialog({
  land,
  isOpen,
  onOpenChange,
  onSaved,
}: {
  land: LandTableRow;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaved?: (landId: string) => void;
}) {
  const formId = `edit-land-${land.id}`;
  const [form, setForm] = useState(() => createLandFormFromLand(land));
  const [retainedImages, setRetainedImages] = useState(() => land.images);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const updateLand = useUpdateLand();
  const uploadImage = useUploadImage();
  const isSubmitting = updateLand.isPending || uploadImage.isPending;
  const isFormValid = isCreateLandFormValid(form);
  const replacementLifecycle = getReplacementImageLifecycle({
    hasFile: imageFile != null,
    isUploading: uploadImage.isPending,
    isProcessing: updateLand.isPending,
  });
  const isReplacementThumbnailLoading =
    replacementLifecycle === 'uploading' || replacementLifecycle === 'processing';
  const hasRetainedImageChanges =
    retainedImages.length !== land.images.length ||
    retainedImages.some((image, index) => image.id !== land.images[index]?.id);

  const clearReplacementImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setForm(current => clearReplacementImageForm(current));
    setSubmitError(null);
  };

  const changeReplacementImage = (files: File | File[] | null) => {
    const nextFile = Array.isArray(files) ? files[0] ?? null : files;

    if (nextFile == null) {
      clearReplacementImage();
      return;
    }

    setImageFile(nextFile);
    setImagePreviewUrl(URL.createObjectURL(nextFile));
    setSubmitError(null);
  };
  const removeRetainedImage = (imageId: string) => {
    setRetainedImages(current => current.filter(image => image.id !== imageId));
    setSubmitError(null);
  };

  useEffect(() => {
    if (imagePreviewUrl != null) {
      return () => URL.revokeObjectURL(imagePreviewUrl);
    }
  }, [imagePreviewUrl]);

  const handleOpenChange = (open: boolean) => {
    if (!open && isSubmitting) {
      return;
    }

    if (!open) {
      setForm(createLandFormFromLand(land));
      setRetainedImages(land.images);
      setImageFile(null);
      setImagePreviewUrl(null);

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
      const uploadedImage =
        imageFile == null ? null : await uploadImage.mutateAsync(imageFile);
      const shouldPatchImages = imageFile != null || hasRetainedImageChanges;
      const response = await updateLand.mutateAsync({
        id: land.id,
        data: buildUpdateLandPayload(
          form,
          uploadedImage as Parameters<typeof buildUpdateLandPayload>[1],
          shouldPatchImages ? retainedImages : undefined,
        ),
      });
      const updatedLand = response.data;

      onSaved?.(updatedLand?.id ?? land.id);
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
            title="Chỉnh sửa khu đất"
            subtitle={land.name}
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent padding={4} label="Biểu mẫu chỉnh sửa khu đất">
            <form id={formId} onSubmit={handleSubmit}>
              <VStack gap={4}>
                {submitError != null && (
                  <Banner
                    status="error"
                    title="Không thể cập nhật khu đất"
                    description={submitError}
                    container="section"
                  />
                )}

                <EntitySinglePageForm
                  sections={[
                    {
                      label: 'Thông tin cơ bản',
                      content: (
                        <TextInput
                          label="Tên khu đất"
                          value={form.name}
                          onChange={name =>
                            setForm(current => ({...current, name}))
                          }
                          isRequired
                          hasAutoFocus
                          isDisabled={isSubmitting}
                          hasClear
                        />
                      ),
                    },
                    {
                      label: 'Vị trí và diện tích',
                      content: <>
                        <TextInput
                          label="Vị trí"
                          value={form.location}
                          onChange={location =>
                            setForm(current => ({...current, location}))
                          }
                          isDisabled={isSubmitting}
                          hasClear
                        />
                        <NumberInput
                          label="Diện tích"
                          value={form.areaSqm}
                          onChange={areaSqm =>
                            setForm(current => ({...current, areaSqm}))
                          }
                          min={0}
                          step={0.01}
                          units="m²"
                          hasClear
                          isWheelEnabled={false}
                          isDisabled={isSubmitting}
                        />
                      </>,
                    },
                    {
                      label: 'Mô tả và hình ảnh',
                      content: <>
                        <TextArea
                          label="Mô tả"
                          value={form.description}
                          onChange={description =>
                            setForm(current => ({...current, description}))
                          }
                          rows={3}
                          isDisabled={isSubmitting}
                        />
                        <FileInput
                          label="Ảnh mới"
                          value={imageFile}
                          onChange={changeReplacementImage}
                          accept="image/png,image/jpeg,image/webp"
                          description="Chọn tệp để thêm ảnh. Xóa ảnh thu nhỏ phía dưới để bỏ ảnh đã lưu."
                          maxSize={MAX_IMAGE_SIZE}
                          mode="input"
                          isLoading={uploadImage.isPending}
                          isDisabled={isSubmitting}
                        />
                        <GridSpan columns="full">
                          <LandImageGallery
                            images={retainedImages}
                            emptyLabel="Chưa có hình ảnh"
                            onRemoveImage={image => removeRetainedImage(image.id)}
                            showRemoveOn="always"
                          />
                        </GridSpan>
                        <Thumbnail
                          src={imagePreviewUrl ?? undefined}
                          alt={imageFile == null ? undefined : `Xem trước ảnh mới của ${land.name}`}
                          label={REPLACEMENT_IMAGE_LABELS[replacementLifecycle]}
                          isLoading={isReplacementThumbnailLoading}
                          onRemove={imageFile == null ? undefined : clearReplacementImage}
                          showRemoveOn="always"
                        />
                        {imageFile != null && (
                          <TextInput
                            label="Chú thích ảnh"
                            value={form.imageCaption}
                            onChange={imageCaption =>
                              setForm(current => ({...current, imageCaption}))
                            }
                            isDisabled={isSubmitting}
                            hasClear
                          />
                        )}
                      </>,
                    },
                  ]}
                />
              </VStack>
            </form>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider padding={4} label="Thao tác chỉnh sửa khu đất">
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
