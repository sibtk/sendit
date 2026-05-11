"use client";

import { useState, useEffect } from "react";
import { estimateShipping } from "@/lib/shipping";
import { ShippingEstimate } from "@/lib/types";
import { loadSettings } from "@/lib/settings";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// Grouped by region for cleaner dropdown
const YARD_REGIONS: { region: string; yards: { label: string; lat: number; lng: number }[] }[] = [
  {
    region: "Texas",
    yards: [
      { label: "Houston, TX", lat: 29.7604, lng: -95.3698 },
      { label: "Dallas, TX", lat: 32.5889, lng: -96.7242 },
      { label: "San Antonio, TX", lat: 29.4241, lng: -98.4936 },
      { label: "Fort Worth, TX", lat: 32.8624, lng: -97.3929 },
      { label: "Austin, TX", lat: 29.7053, lng: -98.1228 },
    ],
  },
  {
    region: "California",
    yards: [
      { label: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
      { label: "Sacramento, CA", lat: 38.5816, lng: -121.4944 },
      { label: "San Diego, CA", lat: 32.7157, lng: -117.1611 },
      { label: "Hayward, CA", lat: 37.6688, lng: -122.0808 },
    ],
  },
  {
    region: "Florida",
    yards: [
      { label: "Miami, FL", lat: 25.7617, lng: -80.1918 },
      { label: "Jacksonville, FL", lat: 30.3322, lng: -81.6557 },
      { label: "Orlando, FL", lat: 28.5383, lng: -81.3792 },
      { label: "Tampa, FL", lat: 27.9506, lng: -82.4572 },
    ],
  },
  {
    region: "Southeast",
    yards: [
      { label: "Atlanta, GA", lat: 33.749, lng: -84.388 },
      { label: "Charlotte, NC", lat: 35.2271, lng: -80.8431 },
      { label: "Nashville, TN", lat: 36.1627, lng: -86.7816 },
    ],
  },
  {
    region: "Northeast",
    yards: [
      { label: "Avenel, NJ", lat: 40.5801, lng: -74.2776 },
      { label: "Taunton, MA", lat: 41.9001, lng: -71.0898 },
      { label: "Philadelphia, PA", lat: 39.9526, lng: -75.1652 },
      { label: "Pittsburgh, PA", lat: 40.4406, lng: -79.9959 },
      { label: "Albany, NY", lat: 42.6526, lng: -73.7562 },
    ],
  },
  {
    region: "Midwest",
    yards: [
      { label: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
      { label: "Detroit, MI", lat: 42.3314, lng: -83.0458 },
      { label: "Minneapolis, MN", lat: 44.9778, lng: -93.265 },
      { label: "Indianapolis, IN", lat: 39.7684, lng: -86.1581 },
      { label: "Columbus, OH", lat: 39.9612, lng: -82.9988 },
    ],
  },
  {
    region: "West",
    yards: [
      { label: "Denver, CO", lat: 39.7392, lng: -104.9903 },
      { label: "Phoenix, AZ", lat: 33.4484, lng: -112.074 },
      { label: "Las Vegas, NV", lat: 36.1699, lng: -115.1398 },
      { label: "Salt Lake City, UT", lat: 40.7608, lng: -111.891 },
      { label: "Portland, OR", lat: 45.5152, lng: -122.6784 },
      { label: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
    ],
  },
];

const ALL_YARDS = YARD_REGIONS.flatMap((r) => r.yards);

export default function ShippingPage() {
  const [fromYard, setFromYard] = useState("");
  const [toZip, setToZip] = useState("");
  const [result, setResult] = useState<ShippingEstimate | null>(null);

  // Load user's zip from settings
  useEffect(() => {
    const s = loadSettings();
    setToZip(s.zip);
  }, []);

  // Auto-calculate
  useEffect(() => {
    const yard = ALL_YARDS.find((y) => y.label === fromYard);
    if (yard && toZip.match(/^\d{5}$/)) {
      setResult(estimateShipping({ lat: yard.lat, lng: yard.lng }, yard.label, toZip, ""));
    } else {
      setResult(null);
    }
  }, [fromYard, toZip]);

  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <h1 className="text-3xl font-bold text-white/90 mb-1" style={{ fontFamily: "var(--font-grotesk)" }}>
        Shipping Estimator
      </h1>
      <p className="text-[14px] text-white/30 mb-10">
        Know your transport cost before you bid.
      </p>

      {/* Inputs — side by side */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="mb-2 block text-[10px] font-medium text-white/25">From</label>
          <select
            value={fromYard}
            onChange={(e) => setFromYard(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-[13px] text-white/70 focus:border-[#7dd3fc]/30 focus:outline-none"
          >
            <option value="">Select yard...</option>
            {YARD_REGIONS.map((region) => (
              <optgroup key={region.region} label={region.region}>
                {region.yards.map((yard) => (
                  <option key={yard.label} value={yard.label}>{yard.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-medium text-white/25">To (your zip)</label>
          <input
            type="text"
            value={toZip}
            onChange={(e) => setToZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="77001"
            maxLength={5}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-[13px] mono text-white/70 placeholder-white/15 focus:border-[#7dd3fc]/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Results — appear inline */}
      <div className={`transition-all duration-300 ${result ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {result && (
          <>
            {/* Route line */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[13px] text-white/50 shrink-0">{result.from}</span>
              <div className="flex-1 relative">
                <div className="border-t border-dashed border-white/[0.1]" />
                <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-[#0a0a0b] px-2">
                  <span className="mono text-[11px] text-[#7dd3fc]">{fmt(result.distanceMiles)} mi</span>
                </div>
              </div>
              <span className="text-[13px] text-white/50 shrink-0">{result.to}</span>
            </div>

            {/* Transport options */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="text-[10px] text-white/25 uppercase tracking-widest mb-3">Open</div>
                <div className="mono text-2xl font-bold text-white/80 mb-1">
                  ${fmt(result.openTransport.low)}<span className="text-white/30 text-lg"> - ${fmt(result.openTransport.high)}</span>
                </div>
                <div className="text-[11px] text-white/20">Standard carrier</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="text-[10px] text-white/25 uppercase tracking-widest mb-3">Enclosed</div>
                <div className="mono text-2xl font-bold text-white/80 mb-1">
                  ${fmt(result.enclosedTransport.low)}<span className="text-white/30 text-lg"> - ${fmt(result.enclosedTransport.high)}</span>
                </div>
                <div className="text-[11px] text-white/20">Covered trailer</div>
              </div>
            </div>

            {/* Transit time */}
            <div className="flex items-center justify-between text-[12px] text-white/20">
              <span>Transit: {result.estimatedDays.low}-{result.estimatedDays.high} days</span>
              <span>Rates vary by season and carrier</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
