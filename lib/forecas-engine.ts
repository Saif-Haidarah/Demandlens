import type { DataPoint, ForecastPoint, ForecastMetrics, ForecastParams } from "@/types";

/**
 * Simple Moving Average
 */
function sma(values: number[], window: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      out.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) sum += values[j];
    out.push(sum / window);
  }
  return out;
}

/**
 * Weighted Moving Average
 */
function wma(values: number[], weights: number[]): number[] {
  const w = weights.length;
  const out: number[] = [];
  const weightSum = weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < values.length; i++) {
    if (i < w - 1) {
      out.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < w; j++) {
      sum += values[i - w + 1 + j] * weights[j];
    }
    out.push(sum / weightSum);
  }
  return out;
}

/**
 * Linear Trend (Ordinary Least Squares)
 */
function linearTrend(values: number[]): { fitted: number[]; slope: number; intercept: number } {
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const fitted = values.map((_, i) => intercept + slope * i);
  return { fitted, slope, intercept };
}

/**
 * Exponential Smoothing (Single)
 */
function exponential(values: number[], alpha: number): number[] {
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(alpha * values[i] + (1 - alpha) * out[i - 1]);
  }
  return out;
}

/**
 * Compute accuracy metrics between actuals and forecasts
 */
export function computeMetrics(actual: number[], forecast: number[]): ForecastMetrics {
  const pairs: { a: number; f: number }[] = [];
  for (let i = 0; i < actual.length; i++) {
    if (isFinite(forecast[i]) && isFinite(actual[i])) {
      pairs.push({ a: actual[i], f: forecast[i] });
    }
  }
  if (pairs.length === 0) {
    return { mape: 0, mad: 0, mse: 0, bias: 0, trackingSignal: 0, accuracy: 0 };
  }

  let absErrSum = 0;
  let sqErrSum = 0;
  let pctErrSum = 0;
  let biasSum = 0;
  let pctCount = 0;

  for (const { a, f } of pairs) {
    const err = a - f;
    const absErr = Math.abs(err);
    absErrSum += absErr;
    sqErrSum += err * err;
    biasSum += err;
    if (a !== 0) {
      pctErrSum += (absErr / Math.abs(a)) * 100;
      pctCount++;
    }
  }

  const n = pairs.length;
  const mad = absErrSum / n;
  const mse = sqErrSum / n;
  const mape = pctCount > 0 ? pctErrSum / pctCount : 0;
  const bias = biasSum / n;
  const trackingSignal = mad > 0 ? bias / mad : 0;
  const accuracy = Math.max(0, 100 - mape);

  return { mape, mad, mse, bias, trackingSignal, accuracy };
}

/**
 * Run a forecast on historical data
 */
export function runForecast(
  data: DataPoint[],
  params: ForecastParams
): { series: ForecastPoint[]; metrics: ForecastMetrics } {
  const values = data.map((d) => d.demand);
  let fitted: number[] = [];

  switch (params.method) {
    case "sma":
      fitted = sma(values, params.periods);
      break;
    case "wma":
      fitted = wma(values, params.weights || []);
      break;
    case "linear": {
      const { fitted: f } = linearTrend(values);
      fitted = f;
      break;
    }
    case "exponential":
      fitted = exponential(values, params.alpha ?? 0.3);
      break;
  }

  const series: ForecastPoint[] = data.map((d, i) => ({
    period: d.period,
    date: d.date,
    historical: d.demand,
    forecast: fitted[i],
    error: isFinite(fitted[i]) ? d.demand - fitted[i] : undefined,
  }));

  // Extend horizon with projected values
  const last = values[values.length - 1];
  const lastDate = data[data.length - 1].date;
  const { slope, intercept } = linearTrend(values);

  for (let h = 1; h <= params.horizon; h++) {
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + h);
    let forecastVal: number;

    if (params.method === "linear") {
      forecastVal = intercept + slope * (values.length + h - 1);
    } else if (params.method === "exponential") {
      // propagate exponential
      const prev = fitted[fitted.length - 1];
      forecastVal = (params.alpha ?? 0.3) * last + (1 - (params.alpha ?? 0.3)) * prev;
    } else {
      // SMA / WMA: use last fitted value as naive projection
      forecastVal = fitted[fitted.length - 1] ?? last;
    }

    const periodLabel = nextDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    series.push({
      period: periodLabel,
      date: nextDate,
      forecast: forecastVal,
    });
  }

  const actuals = data.map((d) => d.demand);
  const metrics = computeMetrics(actuals, fitted);

  return { series, metrics };
    }
