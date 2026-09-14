import {Grid} from '@astryxdesign/core/Grid';
import {VStack} from '@astryxdesign/core/Layout';
import {EntityFormActions, type EntityFormStep} from './EntityFormStepper';

export function EntitySinglePageForm({sections}: {sections: readonly EntityFormStep[]}) {
  return (
    <VStack gap={4}>
      {sections.map(section => (
        <Grid key={section.label} columns={{minWidth: 240, max: 2, repeat: 'fit'}} gap={4}>
          {section.content}
        </Grid>
      ))}
    </VStack>
  );
}

export function EntitySinglePageActions(props: {
  formId: string;
  isFormValid: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <EntityFormActions
      {...props}
      activeStep={0}
      stepCount={1}
      isStepValid={props.isFormValid}
      onBack={() => {}}
      onNext={() => {}}
      invalidMessage="Vui lòng kiểm tra các trường trong biểu mẫu trước khi lưu."
    />
  );
}
