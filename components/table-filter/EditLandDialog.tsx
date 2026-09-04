import {type FormEvent, useEffect, useState} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Divider} from '@astryxdesign/core/Divider';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {FileInput} from '@astryxdesign/core/FileInput';
import {FormLayout} from '@astryxdesign/core/FormLayout';
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from '@astryxdesign/core/Layout';
import {NumberInput} from '@astryxdesign/core/NumberInput';
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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const REPLACEMENT_IMAGE_LABELS: Record<ReplacementImageLifecycle, string> = {
  empty: 'No replacement image selected',
  uploading: 'Uploading replacement image',
  processing: 'Processing replacement image',
  loaded: 'Replacement image loaded',
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

  return 'Please check the land details and try again.';
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
            title="Edit land"
            subtitle={land.name}
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent padding={4} label="Edit land form">
            <form id={formId} onSubmit={handleSubmit}>
              <VStack gap={4}>
                {submitError != null && (
                  <Banner
                    status="error"
                    title="Could not update land"
                    description={submitError}
                    container="section"
                  />
                )}

                <LandImageGallery
                  images={retainedImages}
                  emptyLabel="No current images"
                  onRemoveImage={image => removeRetainedImage(image.id)}
                  showRemoveOn="always"
                />

                <FormLayout defaultOptionality="optional">
                  <FileInput
                    label="New image"
                    value={imageFile}
                    onChange={changeReplacementImage}
                    accept="image/png,image/jpeg,image/webp"
                    description="Choose a file to add it to the saved images. Remove current thumbnails above to delete them."
                    maxSize={MAX_IMAGE_SIZE}
                    mode="input"
                    isLoading={uploadImage.isPending}
                    isDisabled={isSubmitting}
                  />

                  <Thumbnail
                    src={imagePreviewUrl ?? undefined}
                    alt={
                      imageFile == null
                        ? undefined
                        : `New image preview for ${land.name}`
                    }
                    label={REPLACEMENT_IMAGE_LABELS[replacementLifecycle]}
                    isLoading={isReplacementThumbnailLoading}
                    onRemove={
                      imageFile == null ? undefined : clearReplacementImage
                    }
                    showRemoveOn="always"
                  />

                  {imageFile != null && (
                    <TextInput
                      label="Image caption"
                      value={form.imageCaption}
                      onChange={imageCaption =>
                        setForm(current => ({
                          ...current,
                          imageCaption,
                        }))
                      }
                      isDisabled={isSubmitting}
                      hasClear
                    />
                  )}

                  <Divider />

                  <TextInput
                    label="Land name"
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
                  />

                  <TextInput
                    label="Location"
                    value={form.location}
                    onChange={location =>
                      setForm(current => ({
                        ...current,
                        location,
                      }))
                    }
                    isDisabled={isSubmitting}
                    hasClear
                  />

                  <NumberInput
                    label="Area"
                    value={form.areaSqm}
                    onChange={areaSqm =>
                      setForm(current => ({
                        ...current,
                        areaSqm,
                      }))
                    }
                    min={0}
                    step={0.01}
                    units="sqm"
                    hasClear
                    isWheelEnabled={false}
                    isDisabled={isSubmitting}
                  />

                  <TextArea
                    label="Description"
                    value={form.description}
                    onChange={description =>
                      setForm(current => ({
                        ...current,
                        description,
                      }))
                    }
                    rows={3}
                    isDisabled={isSubmitting}
                  />
                </FormLayout>
              </VStack>
            </form>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider padding={4} label="Edit land form footer">
            <HStack gap={2} hAlign="end" wrap="wrap">
              <Button
                label="Cancel"
                variant="secondary"
                isDisabled={isSubmitting}
                onClick={() => handleOpenChange(false)}
              />
              <Button
                label="Save changes"
                type="submit"
                form={formId}
                variant="primary"
                isDisabled={!isFormValid || isSubmitting}
                isLoading={isSubmitting}
              />
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
