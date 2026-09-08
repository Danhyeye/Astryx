import type {ReactNode} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Grid} from '@astryxdesign/core/Grid';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Step, Stepper} from '@astryxdesign/core/Stepper';

export type EntityFormStep = {
  label: string;
  content: ReactNode;
};

export function EntityFormStepper({
  activeStep,
  onStepChange,
  steps,
}: {
  activeStep: number;
  onStepChange: (step: number) => void;
  steps: readonly EntityFormStep[];
}) {
  const currentStep = steps[activeStep];

  return (
    <VStack gap={5}>
      <Stepper
        activeStep={activeStep}
        density="compact"
        indicatorPosition="on-track"
        label="Tiến trình biểu mẫu"
        onStepClick={step => {
          if (step < activeStep) {
            onStepChange(step);
          }
        }}>
        {steps.map((step, index) => (
          <Step
            key={step.label}
            step={index}
            label={step.label}
            indicator="number"
            isDisabled={index > activeStep}
          />
        ))}
      </Stepper>

      {currentStep != null && (
        <Grid columns={{minWidth: 240, max: 2, repeat: 'fit'}} gap={4}>
          {currentStep.content}
        </Grid>
      )}
    </VStack>
  );
}

export function EntityFormActions({
  activeStep,
  formId,
  isStepValid,
  isSubmitting,
  onBack,
  onCancel,
  onNext,
  submitLabel,
  stepCount,
  invalidMessage = 'Vui lòng kiểm tra các trường trong bước này trước khi tiếp tục.',
}: {
  activeStep: number;
  formId: string;
  isStepValid: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onCancel: () => void;
  onNext: () => void;
  submitLabel: string;
  stepCount: number;
  invalidMessage?: string;
}) {
  const isFinalStep = activeStep === stepCount - 1;

  return (
    <>
      {!isStepValid && (
        <Banner
          status="error"
          title="Thông tin chưa hợp lệ"
          description={invalidMessage}
          container="section"
        />
      )}
      <HStack gap={2} hAlign="end" wrap="wrap">
        <Button
          label="Hủy"
          variant="secondary"
          isDisabled={isSubmitting}
          onClick={onCancel}
        />
        {activeStep > 0 && (
          <Button
            label="Quay lại"
            type="button"
            variant="secondary"
            isDisabled={isSubmitting}
            onClick={onBack}
          />
        )}
        {isFinalStep ? (
          <Button
            key="submit"
            label={submitLabel}
            type="submit"
            form={formId}
            variant="primary"
            isDisabled={!isStepValid || isSubmitting}
            isLoading={isSubmitting}
          />
        ) : (
          <Button
            key="next"
            label="Tiếp tục"
            type="button"
            variant="primary"
            isDisabled={!isStepValid || isSubmitting}
            onClick={onNext}
          />
        )}
      </HStack>
    </>
  );
}
