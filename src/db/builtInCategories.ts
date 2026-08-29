/** Fixed id for the always-present Savings budget/expense category. */
export const BUILTIN_SAVINGS_CATEGORY_ID = 'cat_system_savings' as const;

export function isBuiltInSavingsCategory(id: string): boolean {
  return id === BUILTIN_SAVINGS_CATEGORY_ID;
}
