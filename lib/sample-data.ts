import type { DataPoint, SOPSlice, Alert, BullwhipNode } from "@/types";

/**
 * Deterministic pseudo-random generator for reproducible sample data
 */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateSampleData(months = 24): DataPoint[] {
  const rand = seeded(42);
  const data: DataPoint[] = [];
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  start.setDate(1);

  let base = 1200;
  for (let i = 0; i < months; i++) {
    const date = new Date(start);
    date.setMonth(start.getMonth() + i);
    const seasonal = Math.sin((i / 12) * Math.PI * 2) * 180;
    const trend = i * 15;
    const noise = (rand() - 0.5) * 240;
    const demand = Math.max(0, Math.round(base + seasonal + trend + noise));
    const planned = Math.round(demand * (0.95 + rand() * 0.1));
    const actual = demand;

    data.push({
      period: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      date,
      demand,
      planned,
      actual,
    });
  }
  return data;
}

export function generateSOPData(months = 12): SOPSlice[] {
  const rand = seeded(7);
  const out: SOPSlice[] = [];
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  start.setDate(1);
  for (let i = 0; i < months; i++) {
    const date = new Date(start);
    date.setMonth(start.getMonth() + i);
    const demand = 1500 + Math.round((rand() - 0.5) * 400);
    const capacity = 1700;
    const supply = Math.min(capacity, demand + Math.round((rand() - 0.3) * 300));
    const inventory = Math.max(0, Math.round(400 + (rand() - 0.5) * 200));
    const backorders = supply < demand ? demand - supply : 0;
    out.push({
      period: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      demand,
      supply,
      capacity,
      inventory,
      backorders,
    });
  }
  return out;
}

export function generateAlerts(): Alert[] {
  return [
    {
      id: "a1",
      severity: "critical",
      title: "Forecast deviation exceeded threshold",
      message: "SKU-2847 MAPE is 34%, above the 20% threshold.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "a2",
      severity: "warning",
      title: "Inventory approaching reorder point",
      message: "Warehouse B inventory is 12% above safety stock.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      id: "a3",
      severity: "info",
      title: "New data upload completed",
      message: "24 periods imported successfully.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    },
  ];
}

export function defaultBullwhipNodes(): BullwhipNode[] {
  return [
    { id: "customer", label: "Customer", role: "customer", demand: 100, order: 100, inventory: 20, amplification: 1 },
    { id: "retailer", label: "Retailer", role: "retailer", demand: 100, order: 110, inventory: 40, amplification: 1.1 },
    { id: "distributor", label: "Distributor", role: "distributor", demand: 110, order: 125, inventory: 60, amplification: 1.25 },
    { id: "manufacturer", label: "Manufacturer", role: "manufacturer", demand: 125, order: 150, inventory: 90, amplification: 1.5 },
    { id: "supplier", label: "Supplier", role: "supplier", demand: 150, order: 190, inventory: 140, amplification: 1.9 },
  ];
}
