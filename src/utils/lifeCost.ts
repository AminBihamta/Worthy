export function formatLifeCost(
  amountMinor: number,
  hourlyRateMinor: number | null,
  hoursPerDay: number,
): string | null {
  if (!hourlyRateMinor || hourlyRateMinor <= 0) {
    return null;
  }
  const safeHoursPerDay = hoursPerDay > 0 ? hoursPerDay : 8;
  const hours = amountMinor / hourlyRateMinor;
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(hours * 60));
    return `${minutes}m`;
  }
  const dayThreshold = safeHoursPerDay * 2;
  if (hours < dayThreshold) {
    let wholeHours = Math.floor(hours);
    let minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 60) {
      wholeHours += 1;
      minutes = 0;
    }
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
  }
  const days = hours / safeHoursPerDay;
  if (days < 365) {
    return `${days.toFixed(1)}d`;
  }
  const years = days / 365;
  return `${years.toFixed(1)}y`;
}
