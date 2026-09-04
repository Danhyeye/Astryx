import {type FormEvent, useEffect, useMemo, useRef, useState} from 'react';
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
import {Selector} from '@astryxdesign/core/Selector';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Thumbnail} from '@astryxdesign/core/Thumbnail';

import {PLOT_STATUS_META} from '@/data';
import {useUploadImage} from '@/hooks/useImage';
import {useCreatePlot} from '@/hooks/usePlots';
import type {Land} from '@/types/land';
import type {Status as PlotStatus} from '@/types/plot';
import {
  buildPlotPayload,
  createEmptyPlotForm,
  isPlotFormValid,
} from './entityForms';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_FILES = 12;
const PLOT_STATUS_OPTIONS: PlotStatus[] = ['AVAILABLE', 'RENTED', 'SOLD'];

type SelectedPlotImage = {
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

  return 'Please check the plot details and try again.';
}

export function CreatePlotDialog({
  lands,
  isOpen,
  onOpenChange,
  onCreated,
}: {
  lands: readonly Land[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreated?: (plotId: string) => void;
}) {
  const formId = 'create-plot-form';
  const [form, setForm] = useState(() => ({
    ...createEmptyPlotForm(),
    landId: lands[0]?.id ?? '',
  }));
  const [selectedImages, setSelectedImages] = useState<SelectedPlotImage[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const selectedImagesRef = useRef<SelectedPlotImage[]>([]);
  const createPlot = useCreatePlot();
  const uploadImage = useUploadImage();
  const isSubmitting = createPlot.isPending || uploadImage.isPending;
  const isFormValid = isPlotFormValid(form);
  const imageFiles = selectedImages.map(image => image.file);
  const landOptions = useMemo(
    () =>
      lands.map(land => ({
        value: land.id,
        label: land.name,
        description: land.location || 'No location',
      })),
    [lands],
  );

  const clearSelectedImages = () => {
    selectedImagesRef.current.forEach(image =>
      URL.revokeObjectURL(image.previewUrl),
    );
    selectedImagesRef.current = [];
    setSelectedImages([]);
  };

  const resetDialogState = () => {
    setForm({
      ...createEmptyPlotForm(),
      landId: lands[0]?.id ?? '',
    });
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

      const response = await createPlot.mutateAsync(
        buildPlotPayload(form, uploadedImages),
      );
      const createdPlot = response.data;

      if (createdPlot?.id != null) {
        onCreated?.(createdPlot.id);
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
            title="Add new plot"
            subtitle="Create a plot record with optional images."
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent padding={4} label="Create plot form">
            <form id={formId} onSubmit={handleSubmit}>
              <VStack gap={4}>
                {submitError != null && (
                  <Banner
                    status="error"
                    title="Could not create plot"
                    description={submitError}
                    container="section"
                  />
                )}

                <FormLayout defaultOptionality="optional">
                  <FileInput
                    label="Plot images"
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

                  <Selector
                    label="Land"
                    value={form.landId}
                    options={landOptions}
                    onChange={landId =>
                      setForm(current => ({
                        ...current,
                        landId,
                      }))
                    }
                    placeholder="Choose land"
                    hasSearch
                    isRequired
                    isDisabled={isSubmitting}
                  />

                  <TextInput
                    label="Plot number"
                    value={form.plotNumber}
                    onChange={plotNumber =>
                      setForm(current => ({
                        ...current,
                        plotNumber,
                      }))
                    }
                    isRequired
                    hasAutoFocus
                    isDisabled={isSubmitting}
                    hasClear
                  />

                  <Selector
                    label="Status"
                    value={form.status}
                    options={PLOT_STATUS_OPTIONS.map(status => ({
                      value: status,
                      label: PLOT_STATUS_META[status].label,
                    }))}
                    onChange={status =>
                      setForm(current => ({
                        ...current,
                        status: status as PlotStatus,
                      }))
                    }
                    isDisabled={isSubmitting}
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
                label="Create plot"
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
