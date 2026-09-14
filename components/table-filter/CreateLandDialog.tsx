import {type FormEvent, useEffect, useRef, useState} from 'react';
import {EntityFormBanner as Banner} from './EntityFormBanner';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {FileInput} from '@astryxdesign/core/FileInput';
import {GridSpan} from '@astryxdesign/core/Grid';
import {
  HStack,
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
import {useCreateLand} from '@/hooks/useLands';
import {
  buildCreateLandPayload,
  createEmptyLandForm,
  isCreateLandFormValid,
} from './createLandForm';
import {EntitySinglePageActions, EntitySinglePageForm} from './EntitySinglePageForm';

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

  return 'Vui lòng kiểm tra thông tin khu đất và thử lại.';
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
            title="Thêm khu đất"
            subtitle="Thêm khu đất và hình ảnh nếu có."
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent padding={4} label="Biểu mẫu tạo khu đất">
            <form id={formId} onSubmit={handleSubmit}>
              <VStack gap={4}>
                {submitError != null && (
                  <Banner
                    status="error"
                    title="Không thể tạo khu đất"
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
                          label="Hình ảnh khu đất"
                          value={imageFiles}
                          onChange={changeSelectedImages}
                          accept="image/png,image/jpeg,image/webp"
                          description="PNG, JPG hoặc WEBP. Tối đa 5 MB mỗi ảnh."
                          maxSize={MAX_IMAGE_SIZE}
                          maxFiles={MAX_IMAGE_FILES}
                          mode="input"
                          isMultiple
                          isLoading={uploadImage.isPending}
                          isDisabled={isSubmitting}
                        />
                        {selectedImages.length > 0 && (
                          <GridSpan columns="full">
                            <HStack gap={2} wrap="wrap">
                              {selectedImages.map(image => (
                                <Thumbnail
                                  key={image.id}
                                  src={image.previewUrl}
                                  alt={`Xem trước ảnh ${image.file.name}`}
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
                          </GridSpan>
                        )}
                        {selectedImages.length > 0 && (
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
          <LayoutFooter hasDivider>
            <EntitySinglePageActions
              formId={formId}
              isFormValid={isFormValid}
              isSubmitting={isSubmitting}
              onCancel={() => handleOpenChange(false)}
              submitLabel="Tạo khu đất"
            />
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
