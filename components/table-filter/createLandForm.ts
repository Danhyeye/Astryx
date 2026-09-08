import type {Images, UploadedImage} from '../../types/image';
import type {CreateLandPayload, UpdateLandPayload} from '../../types/land';
import type {LandTableRow} from '../../data';

export type CreateLandFormState = {
  name: string;
  location: string;
  areaSqm: number | null;
  description: string;
  imageCaption: string;
};

export type UploadedLandImage = Pick<UploadedImage, 'url'>;
export type RetainedLandImage = Pick<Images, 'url' | 'caption'>;
export type ReplacementImageLifecycle =
  | 'empty'
  | 'uploading'
  | 'processing'
  | 'loaded';

export function getReplacementImageLifecycle({
  hasFile,
  isUploading,
  isProcessing,
}: {
  hasFile: boolean;
  isUploading: boolean;
  isProcessing: boolean;
}): ReplacementImageLifecycle {
  if (!hasFile) {
    return 'empty';
  }

  if (isUploading) {
    return 'uploading';
  }

  if (isProcessing) {
    return 'processing';
  }

  return 'loaded';
}

export function createEmptyLandForm(): CreateLandFormState {
  return {
    name: '',
    location: '',
    areaSqm: null,
    description: '',
    imageCaption: '',
  };
}

export function createLandFormFromLand(land: LandTableRow): CreateLandFormState {
  return {
    name: land.name,
    location: land.location,
    areaSqm: land.areaSqm,
    description: land.description,
    imageCaption: '',
  };
}

export function clearReplacementImageForm(
  form: CreateLandFormState,
): CreateLandFormState {
  return {
    ...form,
    imageCaption: '',
  };
}

export function isCreateLandFormValid(form: CreateLandFormState): boolean {
  return isLandFormStepValid(form, 0) && isLandFormStepValid(form, 1);
}

export function isLandFormStepValid(
  form: CreateLandFormState,
  step: number,
): boolean {
  if (step === 0) {
    return form.name.trim().length > 0;
  }

  if (step === 1) {
    return form.areaSqm == null || form.areaSqm >= 0;
  }

  return true;
}

export function buildCreateLandPayload(
  form: CreateLandFormState,
  uploadedImages: UploadedLandImage | readonly UploadedLandImage[] | null,
): CreateLandPayload {
  const payload: CreateLandPayload = {
    name: form.name.trim(),
  };
  const location = form.location.trim();
  const description = form.description.trim();
  const imageCaption = form.imageCaption.trim();
  const images =
    uploadedImages == null
      ? []
      : Array.isArray(uploadedImages)
        ? uploadedImages
        : [uploadedImages];

  if (location !== '') {
    payload.location = location;
  }

  if (form.areaSqm != null) {
    payload.area_sqm = form.areaSqm;
  }

  if (description !== '') {
    payload.description = description;
  }

  if (images.length > 0) {
    payload.images = images.map(uploadedImage => ({
      url: uploadedImage.url,
      ...(imageCaption === '' ? {} : {caption: imageCaption}),
    }));
  }

  return payload;
}

export function buildUpdateLandPayload(
  form: CreateLandFormState,
  uploadedImage: UploadedLandImage | null = null,
  retainedImages?: readonly RetainedLandImage[],
): UpdateLandPayload {
  const location = form.location.trim();
  const description = form.description.trim();
  const imageCaption = form.imageCaption.trim();
  const payload: UpdateLandPayload = {
    name: form.name.trim(),
    location: location === '' ? null : location,
    area_sqm: form.areaSqm,
    description: description === '' ? null : description,
  };
  const images =
    retainedImages == null
      ? undefined
      : retainedImages.map(image => ({
          url: image.url,
          caption: image.caption || null,
        }));

  if (uploadedImage != null) {
    const uploadedPayload = {
      url: uploadedImage.url,
      caption: imageCaption === '' ? null : imageCaption,
    };

    payload.images =
      images == null ? [uploadedPayload] : [...images, uploadedPayload];
  } else if (images != null) {
    payload.images = images;
  }

  return payload;
}
