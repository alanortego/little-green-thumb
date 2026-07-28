/**
 * T074: turns the backend's raw FR-016 `missingFields` codes (e.g.
 * `image_path`, `step_2_image_path`) into short, human-readable
 * labels for the admin publish-validation error message.
 */
export function formatMissingField(field: string): string {
  const stepMatch = /^step_(\d+)_(.+)$/.exec(field);
  if (stepMatch) {
    return `Step ${stepMatch[1]} ${formatFieldName(stepMatch[2])}`;
  }
  return formatFieldName(field);
}

function formatFieldName(field: string): string {
  switch (field) {
    case 'image_path':
      return 'picture';
    case 'benefit_text':
      return 'benefit text';
    case 'steps':
      return 'at least one step';
    default:
      return field.replace(/_/g, ' ');
  }
}
