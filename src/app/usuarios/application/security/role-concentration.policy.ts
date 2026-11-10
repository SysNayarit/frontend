/**
 * Advertencia informativa de minimo privilegio.
 * No concede, deniega ni revoca autorizaciones.
 */
export const ROLE_CONCENTRATION_THRESHOLD = 60;

export function roleConcentrationPercentage(
  assignedCount: number,
  totalCount: number | null,
): number | null {
  if (
    totalCount === null ||
    !Number.isInteger(totalCount) ||
    totalCount <= 0 ||
    !Number.isInteger(assignedCount) ||
    assignedCount < 0 ||
    assignedCount > totalCount
  ) {
    return null;
  }

  return (assignedCount / totalCount) * 100;
}

export function exceedsRoleConcentrationThreshold(
  assignedCount: number,
  totalCount: number | null,
): boolean {
  // Evitar redondeos cerca del umbral.
  return (
    roleConcentrationPercentage(assignedCount, totalCount) !== null &&
    totalCount !== null &&
    assignedCount * 100 > ROLE_CONCENTRATION_THRESHOLD * totalCount
  );
}