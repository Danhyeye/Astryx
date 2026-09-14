import {type FormEvent, useEffect, useMemo, useRef, useState} from 'react';
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
import {Selector} from '@astryxdesign/core/Selector';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Thumbnail} from '@astryxdesign/core/Thumbnail';

import {
  PLOT_STATUS_META,
  type PlotTableRow,
} from '@/data';
import {useUploadImage} from '@/hooks/useImage';
import {useUpdatePlot} from '@/hooks/usePlots';
import type {Land} from '@/types/land';
import type {Status as PlotStatus} from '@/types/plot';
import {
  buildPlotPayload,
  createPlotFormFromPlot,
  isPlotFormValid,
} from './entityForms';
import {LandImageGallery} from './LandImageGallery';
import {EntitySinglePageActions, EntitySinglePageForm} from './EntitySinglePageForm';

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

export function EditPlotDialog({
  plot,
  lands,
  isOpen,
  onOpenChange,
  onSaved,
}: {
  plot: PlotTableRow;
  lands: readonly Land[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaved?: (plotId: string) => void;
}) {
  const formId = `edit-plot-${plot.id}`;
  const [form, setForm] = useState(() => createPlotFormFromPlot(plot));
  const [retainedImages, setRetainedImages] = useState(() => plot.images);
  const [selectedImages, setSelectedImages] = useState<SelectedPlotImage[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const selectedImagesRef = useRef<SelectedPlotImage[]>([]);
  const updatePlot = useUpdatePlot();
  const uploadImage = useUploadImage();
  const isSubmitting = updatePlot.isPending || uploadImage.isPending;
  const isFormValid = isPlotFormValid(form);
  const imageFiles = selectedImages.map(image => image.file);
  const hasRetainedImageChanges =
    retainedImages.length !== plot.images.length ||
    retainedImages.some((image, index) => image.id !== plot.images[index]?.id);
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

  const removeRetainedImage = (imageId: string) => {
    setRetainedImages(current => current.filter(image => image.id !== imageId));
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
      setForm(createPlotFormFromPlot(plot));
      setRetainedImages(plot.images);
      clearSelectedImages();

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
      const uploadedImages = [];

      for (const selectedImage of selectedImages) {
        uploadedImages.push(await uploadImage.mutateAsync(selectedImage.file));
      }

      const shouldPatchImages =
        uploadedImages.length > 0 || hasRetainedImageChanges;
      const response = await updatePlot.mutateAsync({
        id: plot.id,
        data: buildPlotPayload(
          form,
          uploadedImages,
          shouldPatchImages ? retainedImages : undefined,
        ),
      });
      const updatedPlot = response.data;

      onSaved?.(updatedPlot?.id ?? plot.id);
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
            title="Chỉnh sửa lô đất"
            subtitle={plot.summary}
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent padding={4} label="Biểu mẫu chỉnh sửa lô đất">
            <form id={formId} onSubmit={handleSubmit}>
              <VStack gap={4}>
                {submitError != null && (
                  <Banner
                    status="error"
                    title="Không thể cập nhật lô đất"
                    description={submitError}
                    container="section"
                  />
                )}

                <EntitySinglePageForm
                  sections={[
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
                          label="Ảnh mới"
                          value={imageFiles}
                          onChange={changeSelectedImages}
                          accept="image/png,image/jpeg,image/webp"
                          description="Chọn tệp để thêm ảnh. Xóa ảnh thu nhỏ phía dưới để bỏ ảnh đã lưu."
                          maxSize={MAX_IMAGE_SIZE}
                          maxFiles={MAX_IMAGE_FILES}
                          mode="input"
                          isMultiple
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
              submitLabel="Lưu thay đổi"
            />
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
