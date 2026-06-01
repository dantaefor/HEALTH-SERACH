/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Styled Korea Administrative map and organic cartogram viewer.
 * Inspired by professional regional analysis workbooks.
 */

import { useState, useMemo } from "react";
import { CaseRecord } from "../types";
import { MapPin, Info, Eye, Layers, Compass, BarChart4 } from "lucide-react";

interface KoreaMapProps {
  cases: CaseRecord[];
  selectedCase: CaseRecord | null;
  onSelectCase: (c: CaseRecord) => void;
}

// Map projection bounds
const MIN_LNG = 125.8;
const MAX_LNG = 129.8;
const MIN_LAT = 33.1;
const MAX_LAT = 38.6;

const REGION_NAMES: Record<string, string> = {
  Seoul: "서울특별시",
  Incheon: "인천광역시",
  Gyeonggi: "경기도",
  Gangwon: "강원특별자치도",
  Chungbuk: "충청북도",
  Chungnam: "충청남도",
  Sejong: "세종특별자치시",
  Daejeon: "대전광역시",
  Jeonbuk: "전라북도",
  Jeonnam: "전라남도",
  Gwangju: "광주광역시",
  Gyeongbuk: "경상북도",
  Gyeongnam: "경상남도",
  Daegu: "대구광역시",
  Ulsan: "울산광역시",
  Busan: "부산광역시",
  Jeju: "제주특별자치도",
};

// Region centroid and leader line coordinates on a 100 x 100 canvas
interface RegionLayout {
  cx: number; // Centroid X
  cy: number; // Centroid Y
  lx: number; // Label HTML absolute X (%)
  ly: number; // Label HTML absolute Y (%)
  align: "left" | "right";
  color: string;
}

const REGION_LAYOUTS: Record<string, RegionLayout> = {
  Seoul: { cx: 34, cy: 19, lx: 6, ly: 12, align: "left", color: "fill-[#9fc3ec] stroke-[#6e94c2]" },
  Incheon: { cx: 22, cy: 21, lx: 6, ly: 22, align: "left", color: "fill-[#b1ccf2] stroke-[#819ec4]" },
  Gyeonggi: { cx: 38, cy: 27, lx: 6, ly: 33, align: "left", color: "fill-[#bed3f3]/90 stroke-[#90aec9]" },
  Chungnam: { cx: 27, cy: 46, lx: 6, ly: 44, align: "left", color: "fill-[#b5cbea] stroke-[#8099be]" },
  Sejong: { cx: 38, cy: 41, lx: 6, ly: 54, align: "left", color: "fill-[#c4d8f5] stroke-[#90aad1]" },
  Daejeon: { cx: 41, cy: 48, lx: 6, ly: 64, align: "left", color: "fill-[#b8d1f2] stroke-[#829ec3]" },
  Jeonbuk: { cx: 33, cy: 62, lx: 6, ly: 74, align: "left", color: "fill-[#b2cbef] stroke-[#7ea3bf]" },
  Gwangju: { cx: 29, cy: 74, lx: 6, ly: 84, align: "left", color: "fill-[#a7ccfa] stroke-[#72a3dd]" },
  Jeonnam: { cx: 25, cy: 80, lx: 6, ly: 93, align: "left", color: "fill-[#c0d4f3]/90 stroke-[#8da6cc]" },

  Gangwon: { cx: 64, cy: 18, lx: 94, ly: 12, align: "right", color: "fill-[#d2dfef] stroke-[#9cb1c9]" },
  Chungbuk: { cx: 52, cy: 38, lx: 94, ly: 23, align: "right", color: "fill-[#a7bfdf] stroke-[#7793b8]" },
  Gyeongbuk: { cx: 70, cy: 49, lx: 94, ly: 34, align: "right", color: "fill-[#adc7eb] stroke-[#7b9ec9]" },
  Daegu: { cx: 65, cy: 60, lx: 94, ly: 45, align: "right", color: "fill-[#9bc1f1] stroke-[#6193cc]" },
  Ulsan: { cx: 77, cy: 66, lx: 94, ly: 56, align: "right", color: "fill-[#86adde] stroke-[#5381be]" },
  Busan: { cx: 73, cy: 74, lx: 94, ly: 67, align: "right", color: "fill-[#638fcd] stroke-[#2e5b94]" },
  Gyeongnam: { cx: 57, cy: 71, lx: 94, ly: 78, align: "right", color: "fill-[#779ecd]/90 stroke-[#4771a3]" },
  Jeju: { cx: 28, cy: 94, lx: 94, ly: 88, align: "right", color: "fill-[#adc8eb]/95 stroke-[#7ba2cf]" }
};

// Organic bubble coordinates matching South Korea's relative shape puzzle (사진 3)
interface CartoRegion {
  x: number; // Percent on map container
  y: number; // Percent on map container
  color: string;
  borderColor: string;
  textColor: string;
  label: string;
}

const CARTOGRAM_LAYOUTS: Record<string, CartoRegion> = {
  Incheon: { x: 20, y: 15, color: "bg-sky-100/90", borderColor: "border-sky-300", textColor: "text-sky-850", label: "인천" },
  Seoul: { x: 42, y: 14, color: "bg-amber-100/90", borderColor: "border-amber-400", textColor: "text-amber-900 font-bold", label: "서울" },
  Gyeonggi: { x: 44, y: 28, color: "bg-amber-50/80", borderColor: "border-amber-300", textColor: "text-amber-800", label: "경기" },
  Gangwon: { x: 74, y: 18, color: "bg-emerald-100/90", borderColor: "border-emerald-350", textColor: "text-emerald-850", label: "강원" },
  Chungnam: { x: 23, y: 44, color: "bg-[#e5f4f4]", borderColor: "border-[#9cc9ca]", textColor: "text-[#0e5253]", label: "충남" },
  Chungbuk: { x: 55, y: 41, color: "bg-[#e5f4f4]", borderColor: "border-[#9cc9ca]", textColor: "text-[#0e5253]", label: "충북" },
  Sejong: { x: 38, y: 39, color: "bg-teal-50", borderColor: "border-teal-300", textColor: "text-teal-850", label: "세종" },
  Daejeon: { x: 43, y: 51, color: "bg-green-100", borderColor: "border-green-320", textColor: "text-green-850", label: "대전" },
  Jeonbuk: { x: 30, y: 64, color: "bg-orange-100/95", borderColor: "border-orange-300", textColor: "text-orange-900", label: "전북" },
  Jeonnam: { x: 21, y: 78, color: "bg-lime-50/85", borderColor: "border-lime-250", textColor: "text-lime-850", label: "전남" },
  Gwangju: { x: 34, y: 77, color: "bg-yellow-50", borderColor: "border-yellow-300", textColor: "text-yellow-850", label: "광주" },
  Gyeongbuk: { x: 78, y: 46, color: "bg-rose-100/90", borderColor: "border-rose-350", textColor: "text-rose-850", label: "경북" },
  Daegu: { x: 70, y: 58, color: "bg-rose-50", borderColor: "border-rose-300", textColor: "text-rose-850", label: "대구" },
  Ulsan: { x: 82, y: 62, color: "bg-indigo-100/90", borderColor: "border-indigo-350", textColor: "text-indigo-850", label: "울산" },
  Gyeongnam: { x: 55, y: 72, color: "bg-fuchsia-100/90", borderColor: "border-fuchsia-350", textColor: "text-fuchsia-850", label: "경남" },
  Busan: { x: 72, y: 73, color: "bg-purple-100/90", borderColor: "border-purple-350", textColor: "text-purple-850", label: "부산" },
  Jeju: { x: 32, y: 92, color: "bg-[#faf0df]", borderColor: "border-[#d8caa4]", textColor: "text-[#624e23]", label: "제주" }
};

const getRegionKey = (loc: string): string => {
  const norm = loc || "";
  if (norm.includes("서울")) return "Seoul";
  if (norm.includes("부산")) return "Busan";
  if (norm.includes("대구")) return "Daegu";
  if (norm.includes("인천")) return "Incheon";
  if (norm.includes("광주")) return "Gwangju";
  if (norm.includes("대전")) return "Daejeon";
  if (norm.includes("울산")) return "Ulsan";
  if (norm.includes("세종")) return "Sejong";
  if (norm.includes("경기")) return "Gyeonggi";
  if (norm.includes("강원")) return "Gangwon";
  if (norm.includes("충청북도") || norm.includes("충북")) return "Chungbuk";
  if (norm.includes("충청남도") || norm.includes("충남")) return "Chungnam";
  if (norm.includes("전라북도") || norm.includes("전북")) return "Jeonbuk";
  if (norm.includes("전라남도") || norm.includes("전남")) return "Jeonnam";
  if (norm.includes("경상북도") || norm.includes("경북")) return "Gyeongbuk";
  if (norm.includes("경상남도") || norm.includes("경남")) return "Gyeongnam";
  if (norm.includes("제주")) return "Jeju";
  return "Gyeonggi"; // default safety
};

export default function KoreaMap({ cases, selectedCase, onSelectCase }: KoreaMapProps) {
  // Configurable View Mode
  const [mapViewStyle, setMapViewStyle] = useState<"geo" | "carto">("geo");
  const [hoveredCase, setHoveredCase] = useState<CaseRecord | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const getPathStyle = (region: string) => {
    const isHovered = hoveredRegion === region;
    const isGyeonggiOrEtc = ["Gyeonggi", "Gangwon", "Chungnam", "Chungbuk", "Jeonbuk", "Jeonnam", "Gyeongbuk", "Gyeongnam"].includes(region);
    
    if (isHovered) {
      return { fill: "rgba(170, 45, 0, 0.28)", stroke: "#aa2d00", strokeWidth: "1.2" };
    }
    
    return { 
      fill: isGyeonggiOrEtc ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.18)", 
      stroke: "rgba(30, 41, 59, 0.45)", 
      strokeWidth: "0.6" 
    };
  };

  // Filter cases with valid coordinates
  const validMapCases = useMemo(() => {
    return cases.filter(c => c.lng > 120 && c.lat > 30);
  }, [cases]);

  const activeCase = hoveredCase || selectedCase;

  // Real-time grouping stats for geographic annotations (사진 1)
  const regionStats = useMemo(() => {
    const stats: Record<string, { count: number; totalCost: number; avgCost: number; isHighCost: boolean }> = {};
    
    // Initialize
    Object.keys(REGION_LAYOUTS).forEach(key => {
      stats[key] = { count: 0, totalCost: 0, avgCost: 0, isHighCost: false };
    });

    // Accumulate
    cases.forEach(c => {
      const key = getRegionKey(c.location);
      if (stats[key]) {
        stats[key].count += 1;
        stats[key].totalCost += c.constructionCost || 0;
      }
    });

    // Compute averages to set proportional scale colors (사진 1 red=positive/high-cost, blue=negative/public-interest/low-cost)
    let totalAvgMetric = 0;
    let activeRegionsCount = 0;
    Object.keys(stats).forEach(key => {
      const s = stats[key];
      if (s.count > 0) {
        s.avgCost = s.totalCost / s.count;
        totalAvgMetric += s.avgCost;
        activeRegionsCount += 1;
      }
    });

    const averageThreshold = activeRegionsCount > 0 ? (totalAvgMetric / activeRegionsCount) : 150;

    Object.keys(stats).forEach(key => {
      stats[key].isHighCost = stats[key].avgCost >= averageThreshold;
    });

    return stats;
  }, [cases]);

  // Coordinates projection
  const project = (lng: number, lat: number) => {
    const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 100;
    const y = (1 - (lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * 100;
    return {
      x: `${Math.max(4, Math.min(96, x))}%`,
      y: `${Math.max(4, Math.min(96, y))}%`
    };
  };

  const getGoogleMapsUrl = (c: CaseRecord) => {
    return `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`;
  };

  // Handle region click to filter/select the first case in that region
  const handleRegionClick = (regionKey: string) => {
    const matchedCases = cases.filter(c => getRegionKey(c.location) === regionKey);
    if (matchedCases.length > 0) {
      onSelectCase(matchedCases[0]);
    }
  };

  return (
    <div className="bg-white border border-slate-100 text-[#333840] rounded-3xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] relative flex flex-col min-h-[660px] justify-between shadow-sm select-none">
      
      {/* 🧭 Header with Dual View Controls */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#aa2d00] animate-spin-slow" />
            <div>
              <h3 className="text-sm font-bold text-[#181d26] tracking-tight">
                의료기관 입지 공간 탐색 GIS 분석기
              </h3>
              <p className="text-[10px] text-slate-600 mt-0.5 font-medium">
                실시간 갱신 데이터 기반 분석 프레임워크
              </p>
            </div>
          </div>
          
          <div className="bg-slate-150 border border-slate-300 p-0.5 rounded-lg flex self-start sm:self-auto shadow-3xs">
            <button
              onClick={() => setMapViewStyle("geo")}
              className={`py-1 px-3 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${mapViewStyle === "geo" ? "bg-white text-[#181d26] border border-slate-300 shadow-3xs" : "text-slate-600 hover:text-slate-800"}`}
              title="Geographic Administrative Regional Map with graduated proportional indicators (사진 1)"
            >
              <Layers className="w-3 h-3 text-[#aa2d00]" />
              지리적 분포도 (사진 1)
            </button>
            <button
              onClick={() => setMapViewStyle("carto")}
              className={`py-1 px-3 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${mapViewStyle === "carto" ? "bg-white text-[#181d26] border border-slate-300 shadow-3xs" : "text-slate-600 hover:text-slate-800"}`}
              title="Organic Bubbly Cartogram of Regional Case Weights (사진 3)"
            >
              <BarChart4 className="w-3 h-3 text-indigo-600" />
              지역별 카토그램 (사진 3)
            </button>
          </div>
        </div>
      </div>

      {/* 🗺️ Main Visualization Stage */}
      <div className="relative flex-1 min-h-[440px] bg-slate-50 border border-slate-300 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
        
        {/* Background Grids */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none opacity-20">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border-r border-b border-dashed border-slate-350"></div>
          ))}
        </div>

        {mapViewStyle === "geo" ? (
          /* ==================== VIEW 1: GEOGRAPHIC ANALYST MAP (사진 1) ==================== */
          <div className="absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-500">
            <div className="relative w-full h-full max-w-[420px] aspect-[4/5] flex items-center justify-center mx-auto select-none">
              
              {/* SVG Base Layers for South Korea Polygon contours */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Authentic South Korea Administrative Province map retrieved from Wikimedia Commons as requested */}
                <image 
                  href="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/South_Korea_adm_location_map.svg/1000px-South_Korea_adm_location_map.svg.png" 
                  x="5" 
                  y="2" 
                  width="90" 
                  height="96" 
                  preserveAspectRatio="xMidYMid meet"
                  className="opacity-80 pointer-events-none mix-blend-multiply"
                />
                
                <g className="opacity-95 transition-all">
                  {/* Seoul Polygon (Hitbox & hover highlight) */}
                  <path d="M 31,19 C 32,18 33.5,18 34,18.5 C 34.8,19 34.8,20 34,20.5 C 33.5,21 32,20.5 31,19.8 Z" {...getPathStyle("Seoul")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Seoul")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Seoul")} />
                  {/* Incheon Polygon (Hitbox & hover highlight) */}
                  <path d="M 23,20 C 24,19.5 25,20 25.5,20.8 C 26,21.5 25.5,22.5 24.5,23 C 23.5,23.5 22,23 21.5,22 C 21.5,21 22,20.5 23,20 Z" {...getPathStyle("Incheon")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Incheon")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Incheon")} />
                  {/* Gyeonggi Province Shape (Hitbox & hover highlight) */}
                  <path d="M 26,11 C 31,10 36,10 39,11 C 41,12 42.5,14 43,16 C 44,19 43,23 42,25 C 41,27 38.5,30 35,32 C 32,33.5 28.5,32 25,29 C 22,26.5 21,21.5 22.5,16 C 21.5,15 21,12.5 26,11 Z" {...getPathStyle("Gyeonggi")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Gyeonggi")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Gyeonggi")} />
                  {/* Gangwon Shape (Hitbox & hover highlight) */}
                  <path d="M 39,11 C 47,10 56,9.5 64,12 C 68,11.5 73,13.5 75,17 C 77.5,21.5 76,27 72,31 C 68,34.5 61,37 54,34 C 49,30 46,27.5 46,22 C 45,17 42,14 39,11 Z" {...getPathStyle("Gangwon")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Gangwon")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Gangwon")} />
                  {/* Chungnam Shape (Hitbox & hover highlight) */}
                  <path d="M 22.5,29 C 26.5,28 29.5,30 31,32 C 32.5,34 33,38.5 32,41 C 31,43.5 26.5,46 22,43 C 18,40 16,38 18,34 C 20,31 19.5,29.5 22.5,29 Z" {...getPathStyle("Chungnam")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Chungnam")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Chungnam")} />
                  {/* Chungbuk Shape (Hitbox & hover highlight) */}
                  <path d="M 40,30 C 44,28.5 46.5,26 46.5,29.5 C 46.5,33 49,34.5 45.5,38 C 42,41.5 38.5,41.5 36.5,38 C 35,34.5 36.5,32 40,30 Z" {...getPathStyle("Chungbuk")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Chungbuk")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Chungbuk")} />
                  {/* Jeonbuk Shape (Hitbox & hover highlight) */}
                  <path d="M 22,43 C 26,42 30,41 32,43 C 34.5,45 35,50.5 32.5,52 C 30,53.5 26.5,55 23,52.5 C 19,50 18.5,46.5 22,43 Z" {...getPathStyle("Jeonbuk")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Jeonbuk")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Jeonbuk")} />
                  {/* Jeonnam Province (Hitbox & hover highlight) */}
                  <path d="M 19.5,52.5 C 23.5,54 27.5,55 29,57.5 C 31,60 29.5,65 27.5,68.5 C 24,71.5 19.5,72.5 17,69 C 14.5,65.5 16,58.5 19.5,52.5 Z" {...getPathStyle("Jeonnam")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Jeonnam")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Jeonnam")} />
                  {/* Gyeongbuk Shape (Hitbox & hover highlight) */}
                  <path d="M 49,31 C 54,30.5 59,29 64,32 C 68.5,34 71.5,38 72,42.5 C 73.5,46.5 71,50 67.5,52.5 C 63,54.5 57,52 53.5,48.5 C 50.5,45 47,41 47,37.5 C 47,34 47.5,32 49,31 Z" {...getPathStyle("Gyeongbuk")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Gyeongbuk")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Gyeongbuk")} />
                  {/* Gyeongnam Shape (Hitbox & hover highlight) */}
                  <path d="M 41.5,49.5 C 45.5,48 51,49 56.5,51.5 C 59,54 60,57.5 57,61 C 54.5,64.5 49,66 43.5,63.5 C 39,61 38.5,56.5 41.5,49.5 Z" {...getPathStyle("Gyeongnam")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Gyeongnam")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Gyeongnam")} />
                  {/* Jeju island Shape (Hitbox & hover highlight) */}
                  <path d="M 22,86 C 24.5,84 29.5,84 32,86 C 33,87 31,89 27,89 C 23.5,89 21.5,88 22,86 Z" {...getPathStyle("Jeju")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Jeju")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Jeju")} />
                  {/* Sejong city Shape (Hitbox & hover highlight) */}
                  <path d="M 33.5,37 C 34.5,36.5 35,37 35,37.8 C 35,38.5 34.5,39 33.5,38.2 Z" {...getPathStyle("Sejong")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Sejong")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Sejong")} />
                  {/* Daejeon city Shape (Hitbox & hover highlight) */}
                  <path d="M 35.5,41 C 36.5,40.5 37,41 37,41.8 C 37,42.5 36.5,43 35.5,42.2 Z" {...getPathStyle("Daejeon")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Daejeon")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Daejeon")} />
                  {/* Gwangju city Shape (Hitbox & hover highlight) */}
                  <path d="M 23.5,64.5 C 24.5,64 25,64.5 25,65.3 C 25,66 24.5,66.5 23.5,65.7 Z" {...getPathStyle("Gwangju")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Gwangju")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Gwangju")} />
                  {/* Daegu city Shape (Hitbox & hover highlight) */}
                  <path d="M 55.5,45 C 56.5,44.5 57,45 57,45.8 C 57,46.5 56.5,47 55.5,46.2 Z" {...getPathStyle("Daegu")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Daegu")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Daegu")} />
                  {/* Ulsan city Shape (Hitbox & hover highlight) */}
                  <path d="M 65.5,51 C 66.5,50.5 67,51 67,51.8 C 67,52.5 66.5,53 65.5,52.2 Z" {...getPathStyle("Ulsan")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Ulsan")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Ulsan")} />
                  {/* Busan city Shape (Hitbox & hover highlight) */}
                  <path d="M 61.5,58 C 62.5,57.5 63,58 63,58.8 C 63,59.5 62.5,60 61.5,59.2 Z" {...getPathStyle("Busan")} className="transition-all cursor-pointer pointer-events-auto" onMouseEnter={() => setHoveredRegion("Busan")} onMouseLeave={() => setHoveredRegion(null)} onClick={() => handleRegionClick("Busan")} />
                </g>

              {/* 📐 Right-angled Editorial Leader Lines (L-shape pointer paths linking layout, 사진 1) */}
              {Object.entries(REGION_LAYOUTS).map(([key, item]) => {
                const isActive = hoveredRegion === key;
                const count = regionStats[key]?.count || 0;
                
                // Point calculation (L bend)
                const startX = item.lx;
                const startY = item.ly;
                const centroidX = item.cx;
                const centroidY = item.cy;
                
                const midX = item.align === "left" ? startX + 11 : startX - 11;
                const midY = startY;

                return (
                  <path
                    key={`line-${key}`}
                    d={`M ${startX} ${startY} L ${midX} ${midY} L ${centroidX} ${centroidY}`}
                    fill="none"
                    stroke={isActive ? "#aa2d00" : "#94a3b8"}
                    strokeWidth={isActive ? "0.75" : "0.3"}
                    strokeDasharray={count > 0 ? "none" : "1,1"}
                    className="transition-all duration-300"
                    opacity={count > 0 ? (isActive ? 1.0 : 0.65) : 0.2}
                  />
                );
              })}

              {/* Proportional Graduated Circles overlay at centroids (사진 1) */}
              {Object.entries(REGION_LAYOUTS).map(([key, item]) => {
                const count = regionStats[key]?.count || 0;
                if (count === 0) return null;

                const isHigh = regionStats[key]?.isHighCost;
                const isActive = hoveredRegion === key;

                // Radius scaling formula based on cases count in region
                const circleRadius = 1.6 + Math.min(count * 0.4, 7);

                return (
                  <g key={`graduated-${key}`} className="pointer-events-none">
                    {/* Concentric outer ring scale */}
                    <circle
                      cx={item.cx}
                      cy={item.cy}
                      r={circleRadius + 1.5}
                      fill="none"
                      stroke={isHigh ? "#f1a07e" : "#9cb2c9"}
                      strokeWidth="0.25"
                      strokeDasharray="1,1.5"
                      opacity={isActive ? 1.0 : 0.45}
                    />
                    {/* Centered proportional graduated circle */}
                    <circle
                      cx={item.cx}
                      cy={item.cy}
                      r={circleRadius}
                      fill={isHigh ? "rgba(226, 92, 86, 0.72)" : "rgba(66, 135, 245, 0.72)"}
                      stroke={isHigh ? "#e25c56" : "#4287f5"}
                      strokeWidth="0.35"
                      className="transition-transform duration-300 transform origin-center"
                      opacity={isActive ? 1.0 : 0.85}
                    />
                    {/* Concentric solid center core */}
                    <circle
                      cx={item.cx}
                      cy={item.cy}
                      r="0.5"
                      fill="#ffffff"
                    />
                  </g>
                );
              })}
            </svg>

            {/* 🏷️ Left Column Region Margin Card Pointers (Symmetrical stacking, 사진 1) */}
            <div className="absolute inset-y-0 left-0 w-[24%] flex flex-col justify-between py-3 z-10 pointer-events-none select-none">
              {Object.entries(REGION_LAYOUTS)
                .filter(([_, value]) => value.align === "left")
                .map(([key, value]) => {
                  const stats = regionStats[key];
                  const hasProjects = (stats?.count || 0) > 0;
                  const isHovered = hoveredRegion === key;
                  
                  return (
                    <div
                      key={key}
                      onMouseEnter={() => setHoveredRegion(key)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => hasProjects && handleRegionClick(key)}
                      style={{ top: `${value.ly}%` }}
                      className={`absolute left-2 -translate-y-1/2 flex items-center gap-1 xl:gap-2 px-1.5 py-1 rounded bg-white/90 border border-slate-200/50 shadow-3xs cursor-pointer transition-all pointer-events-auto h-7
                        ${isHovered ? "border-[#aa2d00] bg-rose-50/70 scale-105 z-20" : "hover:border-slate-300 hover:bg-slate-50"}
                        ${hasProjects ? "opacity-100" : "opacity-40"}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${hasProjects ? (stats.isHighCost ? "bg-[#e25c56]" : "bg-[#4287f5]") : "bg-slate-350"}`} />
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] font-bold text-slate-800 tracking-tight leading-3 truncate w-[55px] xl:w-[70px]">{REGION_NAMES[key].slice(0, 4)}</span>
                        <span className="text-[8px] font-mono font-medium text-slate-400 capitalize -mt-0.5 leading-2">
                          {hasProjects ? `${stats.count}건` : "0건"}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* 🏷️ Right Column Region Margin Card Pointers (Symmetrical stacking, 사진 1) */}
            <div className="absolute inset-y-0 right-0 w-[24%] flex flex-col justify-between py-3 z-10 pointer-events-none select-none">
              {Object.entries(REGION_LAYOUTS)
                .filter(([_, value]) => value.align === "right")
                .map(([key, value]) => {
                  const stats = regionStats[key];
                  const hasProjects = (stats?.count || 0) > 0;
                  const isHovered = hoveredRegion === key;

                  return (
                    <div
                      key={key}
                      onMouseEnter={() => setHoveredRegion(key)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => hasProjects && handleRegionClick(key)}
                      style={{ top: `${value.ly}%` }}
                      className={`absolute right-2 -translate-y-1/2 flex items-center gap-1 xl:gap-2 px-1.5 py-1 rounded bg-white/90 border border-slate-200/50 shadow-3xs cursor-pointer transition-all pointer-events-auto h-7
                        ${isHovered ? "border-[#aa2d00] bg-rose-50/70 scale-105 z-20" : "hover:border-slate-300 hover:bg-slate-50"}
                        ${hasProjects ? "opacity-100" : "opacity-40"}`}
                    >
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] font-bold text-slate-800 tracking-tight leading-3 truncate w-[55px] xl:w-[70px]">{REGION_NAMES[key].slice(0, 4)}</span>
                        <span className="text-[8px] font-mono font-medium text-slate-400 capitalize -mt-0.5 leading-2">
                          {hasProjects ? `${stats.count}건` : "0건"}
                        </span>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${hasProjects ? (stats.isHighCost ? "bg-[#e25c56]" : "bg-[#4287f5]") : "bg-slate-350"}`} />
                    </div>
                  );
                })}
            </div>

            {/* Scale / Proportional Legend Box in Geographic Map */}
            <div className="absolute bottom-2.5 left-2.5 bg-white/90 border border-slate-200 p-2 rounded-lg text-[8px] font-medium text-slate-500 max-w-[130px] shadow-3xs z-15 backdrop-blur-3xs text-left leading-relaxed">
              <span className="font-bold text-[#181d26] uppercase block mb-1">인구&사례 증감비중</span>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 border border-rose-600 inline-block" />
                <span>평당가 고단가 집중군 (Red)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500/80 border border-blue-600 inline-block" />
                <span>공공 & 대체 보조군 (Blue)</span>
              </div>
            </div>

            {/* Individual GPS Project Dots on Geographic style so they are still fully clickable! */}
            {validMapCases.map((c) => {
              const { x, y } = project(c.lng, c.lat);
              const isSelected = selectedCase?.id === c.id;
              const isHovered = hoveredCase?.id === c.id;
              
              let colorClass = "bg-slate-700 shadow-slate-700/30";
              if (c.category.includes("종합")) {
                colorClass = "bg-[#aa2d00] shadow-rose-900/30";
              } else if (c.category.includes("전문")) {
                colorClass = "bg-[#d9a441] shadow-amber-850/30";
              } else if (c.isPublic) {
                colorClass = "bg-[#0a2e0e] shadow-emerald-950/30";
              }

              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  onMouseEnter={() => setHoveredCase(c)}
                  onMouseLeave={() => setHoveredCase(null)}
                  style={{ left: x, top: y }}
                  id={`map-dot-${c.id}`}
                  className={`absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer z-10 
                    ${isSelected ? "ring-4 ring-[#181d26] ring-offset-1 w-3.5 h-3.5 scale-125 z-25" : "hover:scale-135 hover:z-20"}
                    ${colorClass} shadow-sm`}
                  title={c.projectName}
                >
                  {(isSelected || isHovered) && (
                    <span className="absolute -inset-1.5 block rounded-full bg-slate-400/20 animate-ping pointer-events-none" />
                  )}
                </button>
              );
            })}
            </div>
          </div>
        ) : (
          /* ==================== VIEW 2: ORGANIC BUBBLE CARTOGRAM (사진 3) ==================== */
          <div className="absolute inset-0 w-full h-full transition-all duration-500 p-6 flex items-center justify-center">
            <div className="relative w-full h-full max-w-[420px] max-h-[460px] mx-auto">
              {Object.entries(CARTOGRAM_LAYOUTS).map(([key, item]) => {
                const stats = regionStats[key] || { count: 0 };
                const count = stats.count;
                
                // Form organic scalable circular bubble size corresponding to project density (사진 3)
                // Base size: 50px up to 105px max
                const baseSize = 52;
                const incrementalRatio = 4.2;
                const bubbleDim = Math.min(105, baseSize + (count * incrementalRatio));
                
                const isHovered = hoveredRegion === key;

                return (
                  <button
                    key={`carto-${key}`}
                    onMouseEnter={() => setHoveredRegion(key)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => count > 0 && handleRegionClick(key)}
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      width: `${bubbleDim}px`,
                      height: `${bubbleDim}px`,
                    }}
                    className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-350 border shadow-xs flex flex-col items-center justify-center cursor-pointer overflow-hidden z-10 select-none
                      ${item.color} ${item.borderColor} ${item.textColor}
                      ${isHovered ? "scale-115 ring-3 ring-indigo-500/25 ring-offset-1 z-25 shadow-sm" : "hover:scale-105 hover:opacity-100"}
                      ${count === 0 ? "opacity-35 pointer-events-auto" : "opacity-95"}`}
                  >
                    <span className="text-[10px] xl:text-[11px] font-extrabold font-sans tracking-tight leading-3">
                      {item.label}
                    </span>
                    <span className="text-[8px] font-mono leading-none mt-0.5 opacity-80 min-w-0 max-w-full truncate px-0.5">
                      {count > 0 ? `${count}건` : "0건"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Organic Legend for Cartogram */}
            <div className="absolute bottom-2.5 right-2.5 bg-white/90 border border-slate-200 p-2.5 rounded-lg text-[8px] font-semibold text-slate-500 shadow-3xs text-left leading-relaxed">
              <span className="font-bold text-[#181d26] uppercase block mb-1">카토그램 비중 구분 (색상)</span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 select-none font-sans">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-100 border border-amber-300 inline-block" />
                  <span>서울/경기 (Peach)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-100 border border-emerald-300 inline-block" />
                  <span>강원 (Green)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-100 border border-sky-300 inline-block" />
                  <span>인천 (Blue)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#e5f4f4] border border-[#9cc9ca] inline-block" />
                  <span>충청 (Cyan)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-100 border border-orange-300 inline-block" />
                  <span>전라 (Orange/Lime)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-105 border border-rose-250 inline-block" />
                  <span>대구/경북 (Pink)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-100 border border-purple-300 inline-block" />
                  <span>경상/부산 (Indigo)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#faf0df] border border-[#d8caa4] inline-block" />
                  <span>제주 (Tan)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 💬 Real-time Interactive Tooltip inside Map */}
        {activeCase && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 border border-[#dddddd] rounded-lg p-3 shadow-md backdrop-blur-xs z-30 transition-all flex items-start justify-between gap-3 font-sans animate-fadeIn">
            <div className="flex gap-2 items-start flex-1 min-w-0">
              <div className="p-1.5 bg-[#f5e9d4] border border-[#ebdfca] rounded text-slate-705 mt-0.5 shrink-0">
                <Info className="w-3.5 h-3.5 text-[#aa2d00]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-[#181d26] truncate">
                  {activeCase.projectName}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{activeCase.location} | {activeCase.category}</p>
              </div>
            </div>
            
            <div className="flex gap-1.5 shrink-0 select-none">
              <a
                href={getGoogleMapsUrl(activeCase)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#181d26] hover:bg-black text-white text-[9px] font-bold py-1 px-2 rounded-sm flex items-center gap-1 transition-colors cursor-pointer"
                title="Google Maps"
              >
                <MapPin className="w-3 h-3 text-[#d9a441]" />
                구글맵
              </a>
              <a
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${activeCase.lat},${activeCase.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#aa2d00] hover:bg-[#8f2600] text-white text-[9px] font-bold py-1 px-2 rounded-sm flex items-center gap-1 transition-colors cursor-pointer"
                title="Google Street View"
              >
                <Eye className="w-3 h-3 text-white" />
                스트리트뷰
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 📊 Composite Specification Dashboard for Selected Hospital */}
      <div className="mt-4 pt-1.5 border-t border-slate-100">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 select-none flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-[#aa2d00] rounded-full inline-block animate-ping"></span>
          실시간 연동 세부 사양 매트릭스 (Selected Project Specs)
        </h4>

        {activeCase ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1) GFA (연면적) */}
            <div className="bg-slate-50 border border-slate-200/55 rounded-xl p-3 shadow-3xs hover:bg-slate-100/50 transition-colors text-left flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-wider">연면적 (GFA)</span>
                <p className="text-sm font-extrabold text-slate-800 tracking-tight mt-0.5 whitespace-nowrap">
                  {activeCase.gfa?.toLocaleString()} <span className="text-[10px] font-semibold text-slate-500">m²</span>
                </p>
              </div>
              <span className="text-[9px] text-indigo-700 font-mono block mt-1 border-t border-slate-100 pt-1 leading-none">
                약 {(activeCase.gfa / 3.3058).toLocaleString(undefined, { maximumFractionDigits: 0 })} 평 규모
              </span>
            </div>

            {/* 2) BEDS (병상수) */}
            <div className="bg-slate-50 border border-slate-200/55 rounded-xl p-3 shadow-3xs hover:bg-slate-100/50 transition-colors text-left flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-wider">인허가 규모</span>
                <p className="text-sm font-extrabold text-[#181d26] mt-0.5">
                  {activeCase.beds} <span className="text-[10px] font-semibold text-[#181d26]">병상</span>
                </p>
              </div>
              <span className="text-[9px] text-emerald-700 font-mono block mt-1 border-t border-slate-100 pt-1 leading-none truncate" title={activeCase.scale}>
                {activeCase.scale || "N/A规模"}
              </span>
            </div>

            {/* 3) Total Construction Cost (억원 / 백만원) */}
            <div className="bg-slate-50 border border-slate-200/55 rounded-xl p-3 shadow-3xs hover:bg-slate-100/50 transition-colors text-left flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-bold text-[#181d26] uppercase block tracking-wider">건설 총 공사비</span>
                <p className="text-sm font-extrabold text-[#aa2d00] mt-0.5">
                  {activeCase.constructionCost ? `${activeCase.constructionCost.toLocaleString()}` : "기밀/보류"}{" "}
                  <span className="text-[10px] font-semibold text-[#aa2d00]">억원</span>
                </p>
              </div>
              <span className="text-[9px] text-slate-450 block mt-1 border-t border-slate-100 pt-1 leading-none truncate">
                설계: {activeCase.designFee ? `${activeCase.designFee.toLocaleString()} 백만` : "미보고"}
              </span>
            </div>

            {/* 4) Per Pyung Unit Weight */}
            <div className="bg-slate-50 border border-slate-200/55 rounded-xl p-3 shadow-3xs hover:bg-slate-100/50 transition-colors text-left flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-bold text-emerald-800 uppercase block tracking-wider">보정 평당 공사비</span>
                <p className="text-sm font-extrabold text-emerald-650 mt-0.5">
                  {activeCase.perPyungCost ? `${Math.round(activeCase.perPyungCost).toLocaleString()}` : "N/A"}{" "}
                  <span className="text-[10px] font-semibold text-emerald-600">만원/평</span>
                </p>
              </div>
              <span className="text-[9px] text-slate-450 block mt-1 border-t border-slate-100 pt-1 leading-none truncate">
                상태: {activeCase.status || "완료"} 단계
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#fefaf2] border border-[#f3e3ca] rounded-xl p-4 text-center text-[11px] text-[#333840] leading-relaxed">
            <p className="font-bold text-[#181d26] mb-0.5">💡 상세 지능형 매트릭스가 대기 중입니다.</p>
            왼쪽 분석 추천 리스트 혹은 지도의 마커 및 지역 카드를 클릭하시면 <strong className="text-[#aa2d00]">연면적, 병상수, 건설비용, 평당단가</strong>가 즉각 매핑됩니다.
          </div>
        )}
      </div>

      {/* Base Legend */}
      <div className="grid grid-cols-4 gap-1.5 mt-4 p-2.5 bg-slate-50/50 rounded-lg border border-[#dddddd] text-[8px] font-semibold text-slate-550 justify-items-center select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#aa2d00]" />
          <span>종합병원 (Coral)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d9a441]" />
          <span>전문병원 (Mustard)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0a2e0e]" />
          <span>공공/보조 (Forest)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <span>기타기관 (Ink)</span>
        </div>
      </div>

    </div>
  );
}
