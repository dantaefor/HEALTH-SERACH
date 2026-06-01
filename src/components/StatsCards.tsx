/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CaseRecord } from "../types";
import { Building2, TrendingUp, DollarSign, Activity, MapPin } from "lucide-react";

interface StatsProps {
  cases: CaseRecord[];
  mode?: "all" | "left" | "right";
}

export default function StatsCards({ cases, mode = "all" }: StatsProps) {
  const totalCount = cases.length;

  // Calculat averages safely
  const validCostCases = cases.filter(c => c.constructionCost > 0);
  const avgCost = validCostCases.length > 0
    ? validCostCases.reduce((sum, c) => sum + c.constructionCost, 0) / validCostCases.length
    : 0;

  const validPyungCostCases = cases.filter(c => c.perPyungCost > 0);
  const avgPyungCost = validPyungCostCases.length > 0
    ? validPyungCostCases.reduce((sum, c) => sum + c.perPyungCost, 0) / validPyungCostCases.length
    : 0;

  const totalBeds = cases.reduce((sum, c) => sum + (c.beds || 0), 0);
  const avgBeds = totalCount > 0 ? totalBeds / totalCount : 0;

  // Find region with most hospitals
  const regionCounts: Record<string, number> = {};
  cases.forEach(c => {
    const r = c.location.split(" ")[0] || "기타";
    regionCounts[r] = (regionCounts[r] || 0) + 1;
  });
  let topRegion = "-";
  let maxRegionCount = 0;
  Object.entries(regionCounts).forEach(([r, count]) => {
    if (count > maxRegionCount) {
      maxRegionCount = count;
      topRegion = r;
    }
  });

  const renders = {
    totalCases: (
      <div key="totalCases" className="bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-white border border-slate-200/70 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[140px] h-auto select-none">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-extrabold text-indigo-700 uppercase tracking-widest bg-indigo-50/80 border border-indigo-100 px-2.5 py-1 rounded-lg">TOTAL CASES</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Building2 strokeWidth={1.75} className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2 text-left">
          <p className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wider mb-0.5">총 수집 사례수</p>
          <p className="text-xl sm:text-2xl font-black font-sans text-slate-800 tracking-tight">{totalCount.toLocaleString()}<span className="text-xs font-bold text-slate-500 ml-1">건</span></p>
        </div>
      </div>
    ),
    avgBudget: (
      <div key="avgBudget" className="bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-white border border-slate-200/70 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[140px] h-auto select-none">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-extrabold text-[#9c2d00] uppercase tracking-widest bg-orange-50/80 border border-orange-100/50 px-2.5 py-1 rounded-lg">AVG BUDGET</span>
          <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <DollarSign strokeWidth={1.75} className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2 text-left">
          <p className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wider mb-0.5">평균 총 공사비</p>
          <p className="text-xl sm:text-2xl font-black font-sans text-slate-800 tracking-tight">
            {avgCost ? Math.round(avgCost).toLocaleString() : "0"}
            <span className="text-xs font-bold text-slate-500 ml-1 whitespace-nowrap">백만원</span>
          </p>
        </div>
      </div>
    ),
    unitCost: (
      <div key="unitCost" className="bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-white border border-slate-200/70 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[140px] h-auto select-none">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-extrabold text-[#064312] uppercase tracking-widest bg-emerald-50/80 border border-emerald-100/50 px-2.5 py-1 rounded-lg">UNIT COST</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp strokeWidth={1.75} className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2 text-left">
          <p className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wider mb-0.5">평균 평당공사비</p>
          <p className="text-xl sm:text-2xl font-black font-sans text-slate-800 tracking-tight">
            {avgPyungCost ? Math.round(avgPyungCost).toLocaleString() : "0"}
            <span className="text-xs font-bold text-slate-500 ml-1 whitespace-nowrap">만원/평</span>
          </p>
        </div>
      </div>
    ),
    bedCapacity: (
      <div key="bedCapacity" className="bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-white border border-slate-200/70 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[140px] h-auto select-none">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-extrabold text-blue-700 uppercase tracking-widest bg-blue-50/80 border border-blue-100/50 px-2.5 py-1 rounded-lg">BED CAPACITY</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Activity strokeWidth={1.75} className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2 text-left">
          <p className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wider mb-0.5">평균 객실 규모</p>
          <p className="text-xl sm:text-2xl font-black font-sans text-slate-800 tracking-tight">
            {avgBeds ? avgBeds.toFixed(0) : "0"}
            <span className="text-xs font-bold text-slate-500 ml-1">병상</span>
          </p>
        </div>
      </div>
    ),
    majorBasin: (
      <div key="majorBasin" className="bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-white border border-slate-200/70 rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[140px] h-auto select-none">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-extrabold text-slate-600 uppercase tracking-widest bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">MAJOR BASIN</span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <MapPin strokeWidth={1.75} className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2 text-left">
          <p className="text-xs font-bold text-slate-500 font-sans uppercase tracking-wider mb-0.5">최다 분포 지역</p>
          <p className="text-lg sm:text-xl font-black font-sans text-slate-800 truncate tracking-tight">
            {topRegion}
            <span className="text-xs font-semibold text-slate-500 ml-1">({maxRegionCount}건)</span>
          </p>
        </div>
      </div>
    )
  };

  if (mode === "left") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {renders.totalCases}
        {renders.avgBudget}
        {renders.unitCost}
      </div>
    );
  }

  if (mode === "right") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renders.bedCapacity}
        {renders.majorBasin}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {renders.totalCases}
      {renders.avgBudget}
      {renders.unitCost}
      {renders.bedCapacity}
      {renders.majorBasin}
    </div>
  );
}
