export const parsePlanMonths = (durationLabel) => {
  const parsed = parsePlanDuration(durationLabel);
  if (!parsed || parsed.unit !== "month") return null;
  return parsed.value;
};

export const parsePlanDuration = (durationLabel) => {
  if (!durationLabel || typeof durationLabel !== "string") return null;
  const normalized = durationLabel.trim();
  if (!normalized) return null;

  const monthMatch = normalized.match(/(\d+)\s*(month|months|mo)\b/i);
  if (monthMatch) {
    const months = Number(monthMatch[1]);
    if (!Number.isInteger(months) || months <= 0) return null;
    return { unit: "month", value: months };
  }

  const dayMatch = normalized.match(/(\d+)\s*(day|days|d)\b/i);
  if (dayMatch) {
    const days = Number(dayMatch[1]);
    if (!Number.isInteger(days) || days <= 0) return null;
    return { unit: "day", value: days };
  }

  return null;
};
