"use client";
import { useCallback, useEffect, useState } from "react";
import type { DataPoint } from "@/types";
import { generateSampleData } from "@/lib/sample-data";

const STORAGE_KEY = "demandlens-data";

export function useDataStore() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DataPoint[];
        setData(parsed.map((d) => ({ ...d, date: new Date(d.date) })));
      } else {
        setData(generateSampleData(24));
      }
    } catch {
      setData(generateSampleData(24));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded && data.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, loaded]);

  const replace = useCallback((next: DataPoint[]) => setData(next), []);
  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(generateSampleData(24));
  }, []);

  return { data, setData: replace, reset, loaded };
}
