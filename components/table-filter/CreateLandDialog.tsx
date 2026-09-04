import {type FormEvent, useEffect, useRef, useState} from 'react';
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
import {useCreateLand} from '@/hooks/useLands';
import {
  buildCreateLandPayload,
  createEmptyLandForm,
  isCreateLandFormValid,
} from './createLandForm';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_FILES = 12;

type SelectedLandImage = {
  id: string;
  file: File;
  previewUrl: string;
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

export function CreateLandDialog({
  isOpen,
  onOpenChange,
  onCreated,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreated?: (landId: string) => void;
}) {
  const formId = 'create-land-form';
  const [form, setForm] = useState(createEmptyLandForm);
  const [selectedImages, setSelectedImages] = useState<SelectedLandImage[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const selectedImagesRef = useRef<SelectedLandImage[]>([]);

  const createLand = useCreateLand();
  const uploadImage = useUploadImage();
  const isSubmitting = createLand.isPending || uploadImage.isPending;
  const isFormValid = isCreateLandFormValid(form);
  const imageFiles = selectedImages.map(image => image.file);

  const clearSelectedImages = () => {
    selectedImagesRef.current.forEach(image =>
      URL.revokeObjectURL(image.previewUrl),
    );
    selectedImagesRef.current = [];
    setSelectedImages([]);
  };

  const resetDialogState = () => {
    setForm(createEmptyLandForm());
    clearSelectedImages();
    setSubmitError(null);
  };

  const changeSelectedImages = (files: File | File[] | null) => {
    const nextFiles = Array.isArray(files) ? files : files == null ? [] : [files];

    if (nextFiles.length === 0) {
      clearSelectedImages();
      setSubmitError(null);
      return;
    }

    setSelectedImages(currentImages => {
      const existingFileKeys = new Set(
        currentImages.map(
          image =>
            `${image.file.name}:${image.file.size}:${image.file.lastModified}`,
        ),
      );
      const additions = nextFiles
        .filter(file => {
          const fileKey = `${file.name}:${file.size}:${file.lastModified}`;
          return !existingFileKeys.has(fileKey);
        })
        .map((file, index) => ({
          id: `${file.name}-${file.lastModified}-${file.size}-${index}`,
          file,
          previewUrl: URL.createObjectURL(file),
        }));
      const nextImages = [...currentImages, ...additions].slice(
        0,
        MAX_IMAGE_FILES,
      );

      selectedImagesRef.current = nextImages;
      return nextImages;
    });
    setSubmitError(null);
  };

  const removeSelectedImage = (imageId: string) => {
    setSelectedImages(currentImages => {
      const removedImage = currentImages.find(image => image.id === imageId);

      if (removedImage != null) {
        URL.revokeObjectURL(removedImage.previewUrl);
      }

      const nextImages = currentImages.filter(image => image.id !== imageId);
      selectedImagesRef.current = nextImages;
      return nextImages;
    });
    setSubmitError(null);
  };

  useEffect(
    () => () => {
      selectedImagesRef.current.forEach(image =>
        URL.revokeObjectURL(image.previewUrl),
      );
    },
    [],
  );

  const handleOpenChange = (open: boolean) => {
    if (!open && isSubmitting) {
      return;
    }

    if (!open) {
      resetDialogState();
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
      const uploadedImages = [];

      for (const selectedImage of selectedImages) {
        uploadedImages.push(await uploadImage.mutateAsync(selectedImage.file));
      }

      const response = await createLand.mutateAsync(
        buildCreateLandPayload(form, uploadedImages),
      );
      const createdLand = response.data;

      if (createdLand?.id != null) {
        onCreated?.(createdLand.id);
      }

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
            title="Add new land"
            subtitle="Create a land record with optional images."
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent padding={4} label="Create land form">
            <form id={formId} onSubmit={handleSubmit}>
              <VStack gap={4}>
                {submitError != null && (
                  <Banner
                    status="error"
                    title="Could not create land"
                    description={submitError}
                    container="section"
                  />
                )}

                <FormLayout defaultOptionality="optional">
                  <FileInput
                    label="Land images"
                    value={imageFiles}
                    onChange={changeSelectedImages}
                    accept="image/png,image/jpeg,image/webp"
                    description="PNG, JPG, or WEBP. Max 5 MB each."
                    maxSize={MAX_IMAGE_SIZE}
                    maxFiles={MAX_IMAGE_FILES}
                    mode="input"
                    isMultiple
                    isLoading={uploadImage.isPending}
                    isDisabled={isSubmitting}
                  />

                  {selectedImages.length > 0 && (
                    <HStack gap={2} wrap="wrap">
                      {selectedImages.map(image => (
                        <Thumbnail
                          key={image.id}
                          src={image.previewUrl}
                          alt={`Preview for ${image.file.name}`}
                          label={image.file.name}
                          isLoading={isSubmitting}
                          onRemove={event => {
                            event.preventDefault();
                            removeSelectedImage(image.id);
                          }}
                          showRemoveOn="always"
                        />
                      ))}
                    </HStack>
                  )}

                  {selectedImages.length > 0 && (
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
          <LayoutFooter hasDivider>
            <HStack gap={2} hAlign="end" wrap="wrap">
              <Button
                label="Cancel"
                variant="secondary"
                isDisabled={isSubmitting}
                onClick={() => handleOpenChange(false)}
              />
              <Button
                label="Create land"
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
