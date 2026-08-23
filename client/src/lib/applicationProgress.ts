export const TOTAL_REQUIRED_PROMPTS = 12;

export function remainingRequiredPrompts(values: Array<string | boolean | number>) {
  return TOTAL_REQUIRED_PROMPTS - values.filter(Boolean).length;
}
