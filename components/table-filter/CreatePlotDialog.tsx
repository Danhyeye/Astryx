import {type FormEvent, useEffect, useMemo, useRef, useState} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
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
  isPlotFormStepValid,
} from './entityForms';
import {EntityFormActions, EntityFormStepper} from './EntityFormStepper';

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

  return 'Vui lòng kiểm tra thông tin lô đất và thử lại.';
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
  const [activeStep, setActiveStep] = useState(0);
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
        description: land.location || 'Chưa có vị trí',
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
    setActiveStep(0);
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

    if (activeStep !== 2 || !isFormValid || isSubmitting) {
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
            title="Thêm lô đất"
            subtitle="Thêm lô đất và hình ảnh nếu có."
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent padding={4} label="Biểu mẫu tạo lô đất">
            <form id={formId} onSubmit={handleSubmit}>
              <VStack gap={4}>
                {submitError != null && (
                  <Banner
                    status="error"
                    title="Không thể tạo lô đất"
                    description={submitError}
                    container="section"
                  />
                )}

                <EntityFormStepper
                  activeStep={activeStep}
                  onStepChange={setActiveStep}
                  steps={[
                    {
                      label: 'Khu đất và mã lô',
                      content: <>
                        <Selector
                    label="Khu đất"
                    value={form.landId}
                    options={landOptions}
                    onChange={landId =>
                      setForm(current => ({
                        ...current,
                        landId,
                      }))
                    }
                    placeholder="Chọn khu đất"
                    hasSearch
                    isRequired
                    isDisabled={isSubmitting}
                        />
                        <TextInput
                    label="Mã lô đất"
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
                      </>,
                    },
                    {
                      label: 'Trạng thái và diện tích',
                      content: <>
                        <Selector
                    label="Trạng thái"
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
                    label="Diện tích"
                    value={form.areaSqm}
                    onChange={areaSqm =>
                      setForm(current => ({
                        ...current,
                        areaSqm,
                      }))
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
                      setForm(current => ({
                        ...current,
                        description,
                      }))
                    }
                    rows={3}
                    isDisabled={isSubmitting}
                        />
                        <FileInput
                          label="Hình ảnh lô đất"
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
            <EntityFormActions
              activeStep={activeStep}
              formId={formId}
              isStepValid={isPlotFormStepValid(form, activeStep)}
              isSubmitting={isSubmitting}
              onBack={() => setActiveStep(step => Math.max(0, step - 1))}
              onCancel={() => handleOpenChange(false)}
              onNext={() =>
                setActiveStep(step =>
                  isPlotFormStepValid(form, step) ? step + 1 : step,
                )
              }
              submitLabel="Tạo lô đất"
              stepCount={3}
            />
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
