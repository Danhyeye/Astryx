import {useState, type ReactNode} from 'react';
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
  canAdvance = false,
  isDisabled = false,
}: {
  activeStep: number;
  onStepChange: (step: number) => void;
  steps: readonly EntityFormStep[];
  canAdvance?: boolean;
  isDisabled?: boolean;
}) {
  const [furthestStep, setFurthestStep] = useState(activeStep);
  if (activeStep > furthestStep) setFurthestStep(activeStep);
  const reachableStep = Math.min(steps.length - 1, Math.max(furthestStep, activeStep + (canAdvance ? 1 : 0)));
  const currentStep = steps[activeStep];

  return (
    <VStack gap={5}>
      <Stepper
        activeStep={activeStep}
        density="compact"
        indicatorPosition="separated"
        label="Tiến trình biểu mẫu"
        onStepClick={step => {
          if (!isDisabled && step <= reachableStep && step !== activeStep) {
            onStepChange(step);
          }
        }}>
        {steps.map((step, index) => (
          <Step
            key={step.label}
            step={index}
            label={step.label}
            indicator="none"
            isDisabled={isDisabled || index > reachableStep}
          />
        ))}
      </Stepper>

      {currentStep != null && (
        <Grid columns={1} gap={4}>
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
  const guidanceId = `${formId}-guidance`;

  return (
    <VStack gap={3} className="w-full">
      {!isStepValid && (
        <Banner
          id={guidanceId}
          status="info"
          title={isFinalStep ? 'Hoàn tất thông tin trước khi lưu' : 'Hoàn tất thông tin để tiếp tục'}
          description={invalidMessage}
          container="card"
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
            aria-describedby={!isStepValid ? guidanceId : undefined}
          />
        ) : (
          <Button
            key="next"
            label="Tiếp tục"
            type="button"
            variant="primary"
            isDisabled={!isStepValid || isSubmitting}
            aria-describedby={!isStepValid ? guidanceId : undefined}
            onClick={onNext}
          />
        )}
      </HStack>
    </VStack>
  );
}
