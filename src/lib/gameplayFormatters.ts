import {
  ActionRecommendationState,
  ConfidenceLevel,
  SeverityLevel,
  TrendDirection,
} from '@/types/gameplay';

export function formatMoney(value: number | null | undefined, digits = 2): string {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${safe.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} xgp`;
}

export function formatHours(value: number | null | undefined): string {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${safe.toFixed(1)}h`;
}

export function formatDelta(value: number | null | undefined, digits = 1): string {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  const sign = safe > 0 ? '+' : '';
  return `${sign}${safe.toFixed(digits)}`;
}

export function formatProgress(current: number | null | undefined, target: number | null | undefined): string {
  const safeCurrent = Number.isFinite(Number(current)) ? Number(current) : 0;
  const safeTarget = Number.isFinite(Number(target)) ? Math.max(1, Number(target)) : 1;
  return `${safeCurrent.toFixed(safeTarget <= 5 ? 0 : 1)}/${safeTarget.toFixed(safeTarget <= 5 ? 0 : 1)}`;
}

export function severityColor(level: SeverityLevel | null | undefined): string {
  switch (level) {
    case 'critical':
      return '#b91c1c';
    case 'high':
      return '#dc2626';
    case 'medium':
      return '#b45309';
    case 'low':
      return '#2563eb';
    case 'info':
    default:
      return '#475569';
  }
}

export function actionStatusColor(status: ActionRecommendationState): string {
  switch (status) {
    case 'recommended':
      return '#166534';
    case 'available':
      return '#1d4ed8';
    case 'blocked':
    default:
      return '#b91c1c';
  }
}

export function progressStatusColor(status: string | null | undefined): string {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed') return '#166534';
  if (normalized === 'in_progress') return '#1d4ed8';
  if (normalized === 'failed') return '#b91c1c';
  return '#475569';
}

export function urgencyColor(urgency: string | null | undefined): string {
  const normalized = String(urgency || '').toLowerCase();
  if (normalized === 'high') return '#b91c1c';
  if (normalized === 'medium') return '#b45309';
  return '#2563eb';
}

export function confidenceLabel(level: ConfidenceLevel | null | undefined): string {
  switch (level) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Moderate confidence';
    case 'low':
      return 'Low confidence';
    default:
      return 'Unknown confidence';
  }
}

export function trendLabel(direction: TrendDirection): string {
  switch (direction) {
    case 'up':
      return 'Likely gain';
    case 'down':
      return 'Likely loss';
    case 'flat':
      return 'Stable';
    case 'mixed':
    default:
      return 'Mixed impact';
  }
}

export function stressTone(stress: number | null | undefined): string {
  const value = Number(stress ?? 0);
  if (value >= 80) return '#b91c1c';
  if (value >= 65) return '#dc2626';
  if (value >= 45) return '#b45309';
  return '#166534';
}

export function healthTone(health: number | null | undefined): string {
  const value = Number(health ?? 0);
  if (value <= 30) return '#b91c1c';
  if (value <= 45) return '#dc2626';
  if (value <= 65) return '#b45309';
  return '#166534';
}

export function creditTone(score: number | null | undefined): string {
  const value = Number(score ?? 0);
  if (value < 580) return '#b91c1c';
  if (value < 670) return '#b45309';
  if (value < 740) return '#2563eb';
  return '#166534';
}
