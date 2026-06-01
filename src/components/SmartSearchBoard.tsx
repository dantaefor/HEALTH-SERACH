/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { CaseRecord, SimulationInput } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList
} from "recharts";
import {
  Sparkles,
  Search,
  Sliders,
  Award,
  ListFilter,
  LayoutGrid,
  TableProperties,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Building2,
  Maximize2,
  Calendar,
  Layers,
  MapPin,
  Coins,
  DollarSign,
  Activity,
  Briefcase,
  X,
  FileText,
  HelpCircle,
  RefreshCw,
  TrendingUp,
  SlidersHorizontal
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import StatsCards from "./StatsCards";

const LeftAlignedYAxisTick = (props: any) => {
  const { y, payload } = props;
  const rawText = payload?.value || "";
  
  // Truncation limit for high contrast and perfect display
  const maxLength = 8;
  const isTruncated = rawText.length > maxLength;
  const displayText = isTruncated ? `${rawText.substring(0, maxLength)}…` : rawText;

  return (
    <g>
      <text
        x={10}
        y={y}
        textAnchor="start"
        dy="4"
        style={{ fill: "#1e293b", fontSize: "11px", fontWeight: "700" }}
        className="cursor-help select-none hover:fill-indigo-600 transition-colors duration-150"
      >
        <title>{rawText}</title>
        {displayText}
      </text>
    </g>
  );
};

interface SmartSearchBoardProps {
  cases: CaseRecord[];
  onSelectCase: (c: CaseRecord) => void;
  selectedCase: CaseRecord | null;
  mapComponent?: React.ReactNode;
  searchMode: "matching" | "general" | "gis";
  onSearchModeChange: (mode: "matching" | "general" | "gis") => void;
}

export default function SmartSearchBoard({ 
  cases, 
  onSelectCase, 
  selectedCase, 
  mapComponent,
  searchMode,
  onSearchModeChange
}: SmartSearchBoardProps) {
  // State for search results
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeWeights, setActiveWeights] = useState<Record<string, number>>({});
  const [firstSearchDone, setFirstSearchDone] = useState(false);

  // Detail Modal selection
  const [detailModalCase, setDetailModalCase] = useState<any | null>(null);
  const [modalMapViewMode, setModalMapViewMode] = useState<"map" | "streetview">("map");

  // Layout View Mode (Table vs Card Panel) for Mode 2
  const [viewLayout, setViewLayout] = useState<"table" | "card">("card");

  // Pagination for Mode 2 (15 cases per page, 5 rows of 3 cards)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // AI advisory report state
  const [aiReport, setAiReport] = useState<string>("");
  const [generatingReport, setGeneratingReport] = useState(false);

  // 1. 공공 vs 민간 비중
  const m2PublicPrivateData = useMemo(() => {
    const base = firstSearchDone ? searchResults : cases;
    if (!base || base.length === 0) return [];
    const pCount = base.filter(c => c.isPublic).length;
    const mCount = base.filter(c => !c.isPublic).length;
    return [
      { name: "공공(보조)", value: pCount, color: "#3b82f6" },
      { name: "민간(자체)", value: mCount, color: "#93c5fd" }
    ];
  }, [firstSearchDone, searchResults, cases]);

  // 2. 주요 병원종류별 분기 분포
  const m2CategoryData = useMemo(() => {
    const base = firstSearchDone ? searchResults : cases;
    if (!base || base.length === 0) return [];
    const countMap: Record<string, number> = {};
    base.forEach(c => {
      const cat = c.category || "기타";
      countMap[cat] = (countMap[cat] || 0) + 1;
    });
    return Object.entries(countMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [firstSearchDone, searchResults, cases]);

  // 3. 외벽 주요 외장 마감재 톱 4 선호도
  const m2CladdingData = useMemo(() => {
    const base = firstSearchDone ? searchResults : cases;
    if (!base || base.length === 0) return [];
    const countMap: Record<string, number> = {};
    base.forEach(c => {
      const clad = c.cladding || "기타/미정";
      if (clad && clad !== "N/A" && clad !== "N/") {
        countMap[clad] = (countMap[clad] || 0) + 1;
      }
    });
    return Object.entries(countMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [firstSearchDone, searchResults, cases]);

  // Custom Weight Sliders Toggle (Mode 1)
  const [showSliders, setShowSliders] = useState(false);

  // --- Dynamic Option Extraction ---
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allProcurements, setAllProcurements] = useState<string[]>([]);
  const [allCladdings, setAllCladdings] = useState<string[]>([]);
  const [allStatuses, setAllStatuses] = useState<string[]>([]);
  const [allContractors, setAllContractors] = useState<string[]>([]);
  const [allDesigners, setAllDesigners] = useState<string[]>([]);

  useEffect(() => {
    if (cases && cases.length > 0) {
      setAllLocations(Array.from(new Set(cases.map(c => c.location.split(" ")[0]).filter(Boolean))).sort());
      setAllCategories(Array.from(new Set(cases.map(c => c.category).filter(Boolean))).sort());
      setAllProcurements(Array.from(new Set(cases.map(c => c.procurementMethod).filter(Boolean))).sort());
      setAllCladdings(Array.from(new Set(cases.map(c => c.cladding).filter(Boolean))).sort());
      setAllStatuses(Array.from(new Set(cases.map(c => c.status).filter(Boolean))).sort());
      setAllContractors(Array.from(new Set(cases.map(c => c.contractor).filter(Boolean))).sort());
      setAllDesigners(Array.from(new Set(cases.map(c => c.designer).filter(Boolean))).sort());
    }
  }, [cases]);

  // Reset map mode inside detailed modal to 'map' when opened
  useEffect(() => {
    if (detailModalCase) {
      setModalMapViewMode("map");
    }
  }, [detailModalCase]);

  // --- 1. MODE 1 (Matching Specs) States ---
  const [m1Gfa, setM1Gfa] = useState<number>(45000);
  const [m1Beds, setM1Beds] = useState<number>(300);
  const [m1Cost, setM1Cost] = useState<number>(120000); // 백만원
  const [m1DesignFee, setM1DesignFee] = useState<number>(5400); // 백만원
  const [m1ScaleB, setM1ScaleB] = useState<number>(2); // 지하층
  const [m1ScaleF, setM1ScaleF] = useState<number>(12); // 지상층
  const [m1Cladding, setM1Cladding] = useState<string>("유닛커튼월");
  const [m1Location, setM1Location] = useState<string>("경기도");
  const [m1IsPublic, setM1IsPublic] = useState<boolean>(true);
  const [m1Procurement, setM1Procurement] = useState<string>("현상설계");
  const [m1Category, setM1Category] = useState<string>("종합병원");
  const [m1Status, setM1Status] = useState<string>("진행중");
  const [m1Contractor, setM1Contractor] = useState<string>("N/A");

  // --- 2. MODE 2 (General Filter Ranges) States ---
  const [m2YearMin, setM2YearMin] = useState<string>("");
  const [m2YearMax, setM2YearMax] = useState<string>("");
  const [m2GfaMin, setM2GfaMin] = useState<string>("");
  const [m2GfaMax, setM2GfaMax] = useState<string>("");
  const [m2BedsMin, setM2BedsMin] = useState<string>("");
  const [m2BedsMax, setM2BedsMax] = useState<string>("");
  const [m2CostMin, setM2CostMin] = useState<string>("");
  const [m2CostMax, setM2CostMax] = useState<string>("");
  const [m2FeeMin, setM2FeeMin] = useState<string>("");
  const [m2FeeMax, setM2FeeMax] = useState<string>("");
  const [m2ScaleBMin, setM2ScaleBMin] = useState<string>("");
  const [m2ScaleBMax, setM2ScaleBMax] = useState<string>("");
  const [m2ScaleFMin, setM2ScaleFMin] = useState<string>("");
  const [m2ScaleFMax, setM2ScaleFMax] = useState<string>("");

  const [m2Cladding, setM2Cladding] = useState<string>("");
  const [m2Location, setM2Location] = useState<string>("전체");
  const [m2IsPublicCheck, setM2IsPublicCheck] = useState<"전체" | "공공" | "민간">("전체");
  const [m2Procurement, setM2Procurement] = useState<string>("전체");
  const [m2Category, setM2Category] = useState<string>("전체");
  const [m2Status, setM2Status] = useState<string>("전체");
  const [m2Contractor, setM2Contractor] = useState<string>("전체");
  const [m2OpeningYearCheck, setM2OpeningYearCheck] = useState<"전체" | "준공" | "예정">("전체");
  const [m2Designer, setM2Designer] = useState<string>("전체");

  // Custom weights slider values (defaults as specified)
  const [gWeights, setGWeights] = useState<Record<string, number>>({
    gfa: 0.2,
    beds: 0.2,
    constructionCost: 0.15,
    designFee: 0.05,
    category: 0.1,
    isPublic: 0.07,
    location: 0.08,
    procurementMethod: 0.05,
    status: 0.03,
    openingYear: 0.02,
    designYear: 0.02,
    designer: 0.015,
    contractor: 0.015,
    cladding: 0.01,
    scale: 0.01
  });

  // Calculate similarity trigger
  const triggerSearch = async (mode: "matching" | "general") => {
    setLoading(true);
    setCurrentPage(1);

    const inputs: Record<string, any> = {};

    if (mode === "matching") {
      inputs.gfaM2 = m1Gfa;
      inputs.beds = m1Beds;
      inputs.constructionCost = m1Cost;
      inputs.designFee = m1DesignFee;
      inputs.scaleB = m1ScaleB;
      inputs.scaleF = m1ScaleF;
      inputs.cladding = m1Cladding;
      inputs.location = m1Location;
      inputs.isPublic = m1IsPublic;
      inputs.procurementMethod = m1Procurement;
      inputs.category = m1Category;
      inputs.status = m1Status;
      inputs.contractor = m1Contractor;
    } else {
      inputs.designYearMin = m2YearMin ? parseInt(m2YearMin) : undefined;
      inputs.designYearMax = m2YearMax ? parseInt(m2YearMax) : undefined;
      inputs.gfaMin = m2GfaMin ? parseFloat(m2GfaMin) : undefined;
      inputs.gfaMax = m2GfaMax ? parseFloat(m2GfaMax) : undefined;
      inputs.bedsMin = m2BedsMin ? parseInt(m2BedsMin) : undefined;
      inputs.bedsMax = m2BedsMax ? parseInt(m2BedsMax) : undefined;
      inputs.constructionCostMin = m2CostMin ? parseInt(m2CostMin) : undefined;
      inputs.constructionCostMax = m2CostMax ? parseInt(m2CostMax) : undefined;
      inputs.designFeeMin = m2FeeMin ? parseInt(m2FeeMin) : undefined;
      inputs.designFeeMax = m2FeeMax ? parseInt(m2FeeMax) : undefined;
      inputs.scaleBMin = m2ScaleBMin ? parseInt(m2ScaleBMin) : undefined;
      inputs.scaleBMax = m2ScaleBMax ? parseInt(m2ScaleBMax) : undefined;
      inputs.scaleFMin = m2ScaleFMin ? parseInt(m2ScaleFMin) : undefined;
      inputs.scaleFMax = m2ScaleFMax ? parseInt(m2ScaleFMax) : undefined;
      inputs.claddingQuery = m2Cladding;
      inputs.locationQuery = m2Location;
      inputs.isPublicCheck = m2IsPublicCheck;
      inputs.procurementQuery = m2Procurement;
      inputs.categoryQuery = m2Category;
      inputs.statusQuery = m2Status;
      inputs.contractorQuery = m2Contractor;
      inputs.openingYearCheck = m2OpeningYearCheck;
      inputs.designerQuery = m2Designer;
    }

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          inputs,
          customWeights: gWeights
        })
      });
      const result = await response.json();
      if (result.success) {
        setSearchResults(result.data);
        setActiveWeights(result.activeWeightsUsed);
        setFirstSearchDone(true);
      } else {
        console.error("Similarity Calculation Failed:", result.error);
      }
    } catch (err) {
      console.error("Failed to fetch similarity search:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run automatically when inputs or weights change
  useEffect(() => {
    if (cases && cases.length > 0) {
      if (searchMode === "matching" || searchMode === "general") {
        triggerSearch(searchMode);
      }
    }
  }, [
    searchMode, cases, gWeights,
    // Mode 1 triggers
    m1Gfa, m1Beds, m1Cost, m1DesignFee, m1ScaleB, m1ScaleF, m1Cladding, m1Location, m1IsPublic, m1Procurement, m1Category, m1Status, m1Contractor,
    // Mode 2 triggers
    m2YearMin, m2YearMax, m2GfaMin, m2GfaMax, m2BedsMin, m2BedsMax, m2CostMin, m2CostMax, m2FeeMin, m2FeeMax, m2ScaleBMin, m2ScaleBMax, m2ScaleFMin, m2ScaleFMax,
    m2Cladding, m2Location, m2IsPublicCheck, m2Procurement, m2Category, m2Status, m2Contractor, m2OpeningYearCheck, m2Designer
  ]);

  // Request Gemini Advisor Consultation on the Top recommended match
  const runAiAdvisor = async (targetCase: any) => {
    setGeneratingReport(true);
    setAiReport("");
    try {
      const response = await fetch("/api/chat-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: {
            category: targetCase.category,
            beds: targetCase.beds,
            gfaM2: targetCase.gfa,
            gfaPyung: Math.round(targetCase.gfa / 3.3058),
            location: targetCase.location,
            isPublic: targetCase.isPublic,
            procurementMethod: targetCase.procurementMethod,
            cladding: targetCase.cladding
          },
          similarCases: searchResults.slice(0, 5)
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiReport(data.report);
      } else {
        setAiReport(`⚠️ AI 보고서 생성 중 장애가 발생했습니다: ${data.error}`);
      }
    } catch (e: any) {
      setAiReport(`⚠️ API 통신 중 서버 장애가 발생했습니다: ${e.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Helper conversion pyung
  const formatPyung = (m2: number) => {
    return (m2 / 3.3058).toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const handleSliderChange = (field: string, val: number) => {
    setGWeights(prev => ({ ...prev, [field]: val }));
  };

  const handlePublicPrivateClick = (name: string) => {
    const isPublicSelected = name.includes("공공");
    if (isPublicSelected) {
      setM2IsPublicCheck(prev => prev === "공공" ? "전체" : "공공");
    } else {
      setM2IsPublicCheck(prev => prev === "민간" ? "전체" : "민간");
    }
  };

  const handleCategoryClick = (data: any) => {
    if (!data || !data.name) return;
    setM2Category(prev => prev === data.name ? "전체" : data.name);
  };

  const handleCladdingClick = (data: any) => {
    if (!data || !data.name) return;
    setM2Cladding(prev => prev === data.name ? "" : data.name);
  };

  // Reset custom weights
  const handleResetWeights = () => {
    setGWeights({
      gfa: 0.2,
      beds: 0.2,
      constructionCost: 0.15,
      designFee: 0.05,
      category: 0.1,
      isPublic: 0.07,
      location: 0.08,
      procurementMethod: 0.05,
      status: 0.03,
      openingYear: 0.02,
      designYear: 0.02,
      designer: 0.015,
      contractor: 0.015,
      cladding: 0.01,
      scale: 0.01
    });
  };

  // Mode 2 Pagination results
  const totalItems = searchResults.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedResults = searchResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Rankings and differences variables for Mode 1
  const top1Value = searchResults[0];
  const top2Value = searchResults[1];
  const top3Value = searchResults[2];

  return (
    <div className="space-y-6">
      {/* Search Dashboard Top Navigation */}
      <div className="bg-white rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-5 select-none">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">INTELLIGENT AI MULTIPLEX ENGINE</span>
            <h2 className="text-base font-medium text-[#181d26] mt-0.5">병원 매칭 및 데이터 지능형 다중 검색보드</h2>
          </div>
          
          <div className="bg-slate-50 border border-[#dddddd] p-0.5 rounded-lg flex flex-wrap w-full sm:w-auto">
            <button
              id="tab-matching"
              onClick={() => {
                onSearchModeChange("matching");
                triggerSearch("matching");
              }}
              className={`flex-1 sm:flex-initial py-2 px-4 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${searchMode === "matching" ? "bg-white text-indigo-700 border-none shadow-sm shadow-indigo-100" : "text-slate-500 hover:text-slate-800"}`}
            >
              <Award className="w-3.5 h-3.5 text-[#aa2d00]" />
              1. 신규 기획 매칭 (TOP 3 추천)
            </button>
            <button
              id="tab-general"
              onClick={() => {
                onSearchModeChange("general");
                triggerSearch("general");
              }}
              className={`flex-1 sm:flex-initial py-2 px-4 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${searchMode === "general" ? "bg-white text-indigo-700 border-none shadow-sm shadow-indigo-100" : "text-slate-500 hover:text-slate-800"}`}
            >
              <ListFilter className="w-3.5 h-3.5 text-[#181d26]" />
              2. 다조건 정밀 유사도 검색
            </button>
          </div>
        </div>
      </div>

      {/* Unified Formatting KPI Blocks for all modes and pages */}
      <StatsCards cases={cases} mode="all" />

      {searchMode === "matching" ? (
        /* ----------------- MODE 1: SEARCH SPEC MATCH RES ----------------- */
        <div className="flex flex-col lg:flex-row gap-6 items-start animate-fadeIn">
          
          {/* LEFT SIDEBAR: SEARCH CRITERIA INPUT PANEL (12 Specifications) */}
          <div className="w-full lg:w-[260px] xl:w-[300px] shrink-0 bg-white rounded-3xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-2rem)] overflow-y-auto hidden-scrollbar">
            
            <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" fill="currentColor" strokeWidth={1} />
                <h3 className="text-[13px] font-bold text-slate-800">12가지 핵심 사양 기입</h3>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-3">
              <button
                onClick={() => setShowSliders(!showSliders)}
                className={`text-[11px] font-semibold rounded-xl px-3 py-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all ${showSliders ? "bg-[#f5e9d4] text-[#aa2d00]" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
              >
                <Sliders className="w-4 h-4" fill="currentColor" strokeWidth={0} />
                가중치 조절 {showSliders ? "닫기" : "열기"}
              </button>
              
              {showSliders && (
                <div className="bg-orange-50 rounded-2xl p-4 space-y-3.5 animate-fadeIn mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black text-orange-800 uppercase">수동 튜닝</span>
                    <button
                      onClick={handleResetWeights}
                      className="text-[9px] font-bold text-orange-600 underline hover:text-orange-800 cursor-pointer"
                    >
                      초기화
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-y-3 text-xs pr-1">
                    {Object.entries(gWeights).map(([field, weight]) => {
                      const labelMap: Record<string, string> = {
                        gfa: "연면적", beds: "병상수", constructionCost: "공사비", designFee: "설계비",
                        category: "용도분류", isPublic: "민간/공공", location: "예정지역", procurementMethod: "발주방식",
                        status: "진행단계", openingYear: "준공년도", designYear: "설계연도", designer: "설계사",
                        contractor: "시공사", cladding: "입면마감", scale: "규모층수"
                      };
                      return (
                        <div key={field} className="space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-800">{labelMap[field] || field}</span>
                            <span className="font-mono text-orange-700">{(weight * 100).toFixed(0)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.005"
                            max="0.4"
                            step="0.005"
                            value={weight}
                            onChange={(e) => handleSliderChange(field, parseFloat(e.target.value))}
                            className="w-full h-1 bg-white rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-600">
              
              {/* 1. 연면적 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">1) 계획 연면적 (m²)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={m1Gfa || ""}
                    onChange={(e) => setM1Gfa(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium pl-3 pr-10 py-2 text-slate-800 focus:outline-none"
                    placeholder="입력"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">m²</span>
                </div>
              </div>

              {/* 2. 병상수 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">2) 계획 병상수 (beds)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={m1Beds || ""}
                    onChange={(e) => setM1Beds(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium pl-3 pr-10 py-2 text-slate-800 focus:outline-none"
                    placeholder="입력"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">병상</span>
                </div>
              </div>

              {/* 3. 공사비 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">3) 계획 공사비</label>
                <div className="relative">
                  <input
                    type="number"
                    value={m1Cost || ""}
                    onChange={(e) => setM1Cost(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium pl-3 pr-14 py-2 text-slate-800 focus:outline-none"
                    placeholder="입력"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">백만원</span>
                </div>
              </div>

              {/* 4. 설계비 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">4) 계획 설계비</label>
                <div className="relative">
                  <input
                    type="number"
                    value={m1DesignFee || ""}
                    onChange={(e) => setM1DesignFee(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium pl-3 pr-14 py-2 text-slate-800 focus:outline-none"
                    placeholder="입력"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">백만원</span>
                </div>
              </div>

              {/* 5. 규모 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">5) 건물 층수 규모</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="지하"
                      value={m1ScaleB || ""}
                      onChange={(e) => setM1ScaleB(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium pl-3 pr-6 py-2 text-slate-800 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">B</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="지상"
                      value={m1ScaleF || ""}
                      onChange={(e) => setM1ScaleF(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium pl-3 pr-6 py-2 text-slate-800 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">F</span>
                  </div>
                </div>
              </div>

              {/* 6. 입면 마감 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">6) 입면 주요 마감재</label>
                <select
                  value={m1Cladding}
                  onChange={(e) => setM1Cladding(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium px-3 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="N/A">선택안함 (전체)</option>
                  {allCladdings.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* 7. 위치 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">7) 예정 건립 지역</label>
                <select
                  value={m1Location}
                  onChange={(e) => setM1Location(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium px-3 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="">선택안함 (전체)</option>
                  {allLocations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* 8. 공공/민간 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">8) 공공 / 민간 구분</label>
                <div className="bg-slate-50 p-1 rounded-xl flex gap-1">
                  <button
                    onClick={() => setM1IsPublic(true)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${m1IsPublic ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    공공 (보조)
                  </button>
                  <button
                    onClick={() => setM1IsPublic(false)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${!m1IsPublic ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    민간 (자체)
                  </button>
                </div>
              </div>

              {/* 9. 방식 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">9) 추진 발주 방식</label>
                <select
                  value={m1Procurement}
                  onChange={(e) => setM1Procurement(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium px-3 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="N/A">선택안함 (전체)</option>
                  {allProcurements.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* 10. 분류 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">10) 의료용도 분류</label>
                <select
                  value={m1Category}
                  onChange={(e) => setM1Category(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium px-3 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="">선택안함 (전체)</option>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* 11. 상태 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">11) 기획 진행단계</label>
                <select
                  value={m1Status}
                  onChange={(e) => setM1Status(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium px-3 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="N/A">선택안함 (전체)</option>
                  {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* 12. 시공사 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">12) 수주 예정 시공사</label>
                <select
                  value={m1Contractor}
                  onChange={(e) => setM1Contractor(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-shadow font-medium px-3 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="N/A">선택안함 (전체)</option>
                  {allContractors.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

            </div>
          </div>

          {/* RIGHT MAIN CONTENT: Recommendations Board */}
          <div className="flex-1 space-y-6 min-w-0">
            
            {/* Header info for right section */}
            <div className="bg-gradient-to-r from-indigo-50 to-white rounded-3xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center justify-center p-1.5 bg-indigo-100 rounded-lg">
                    <Sparkles className="w-4 h-4 text-indigo-600" fill="currentColor" strokeWidth={1} />
                  </div>
                  <h4 className="text-[13px] font-bold text-slate-900">지능형 최적 추천 모델 제안 (TOP 1 ~ 3)</h4>
                </div>
                <p className="text-xs text-slate-600 font-medium">기입된 12개 실시간 변인값에 부가 결합 가중치를 매칭하여 최우수 유사 건립 사례를 추천합니다.</p>
              </div>
            </div>

            {loading ? (
              <div className="bg-white p-20 text-center text-slate-400 rounded-3xl flex flex-col items-center gap-3 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-sm font-bold text-slate-600">고속 비연계 가중치 재정규화 유사도 도출 중...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-6">
                
                {/* TOP 1 - REFINED LIGHT BLUE/INDIGO GRADIENT DESIGN WITH ARCHITECTURAL PREVIEW */}
                {top1Value && (
                  <div
                    onClick={() => {
                      setDetailModalCase(top1Value);
                      onSelectCase(top1Value);
                    }}
                    className={`relative rounded-[24px] border transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md ${
                      (top1Value.status === "취소" || top1Value.status === "용역중지")
                        ? "border-rose-200 hover:border-rose-300"
                        : "border-slate-200 hover:border-indigo-300"
                    }`}
                    style={{ backgroundColor: "#dcf1ff", padding: "24px" }}
                  >
                    {/* Precise Two-Column Layout */}
                    <div className="flex flex-col lg:flex-row lg:items-stretch gap-6">
                      
                      {/* Left Column (Text Section) - Fixed Width on Desktop */}
                      <div className="w-full lg:w-[480px] lg:shrink-0 flex flex-col items-start text-left text-wrap leading-[1.5]">
                        {/* Header info (Badge and Chips only, neat left alignment) */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <div className={`font-black text-[10px] px-2.5 py-1 rounded flex items-center gap-1 border uppercase tracking-wider ${
                            (top1Value.status === "취소" || top1Value.status === "용역중지")
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-500 text-amber-950 border-amber-400"
                          }`}>
                            <Award className="w-3 h-3" fill="currentColor" stroke="none" />
                            추천 1순위 (GOLD)
                          </div>
                          
                          {/* Categorization Chip (연한 회색, 작은 크기) */}
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded inline-flex items-center gap-1">
                            {top1Value.category}
                          </span>

                          {/* Similarity Chip (강조 색상 유지) */}
                          <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-black px-2 py-1 rounded inline-flex items-center gap-1">
                            유사도 {(top1Value.similarityScore * 100).toFixed(0)}%
                          </span>

                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {top1Value.location}
                          </span>
                        </div>

                        {/* Project Name (가장 크게 강조) */}
                        <h3 
                          className="text-2xl font-black leading-snug tracking-tight transition-colors"
                          style={{ color: "#2f00e0" }}
                        >
                          {top1Value.projectName}
                        </h3>

                        {/* SCORE & Summary Sentence (SCORE는 두 번째로 강조, 불필요한 여백 제어) */}
                        <div className="mt-2.5 mb-4 pb-3.5 border-b border-slate-150 flex flex-col gap-2 w-full text-left">
                          <div className="inline-flex items-baseline gap-1">
                            <span className="text-xs font-bold text-slate-400">유사성 스코어:</span>
                            <strong className="text-xl font-mono font-black text-indigo-600">{(top1Value.similarityScore * 100).toFixed(0)}</strong>
                            <span className="text-sm font-bold text-slate-500">/ 100</span>
                          </div>
                          {/* 간단한 요약 문장 추가 */}
                          <p className="text-xs font-semibold text-slate-500 leading-normal">
                            본 추천안은 실시간 12개 가중치 변인을 분석하여 <span className="text-indigo-600 font-bold">{top1Value.qualitativeDescription}</span> 성능(일치율 {(top1Value.similarityScore * 100).toFixed(0)}%)을 만족하는 최적 후보지 정보입니다.
                          </p>
                        </div>

                        {/* Metadata (설명 텍스트는 회색으로 처리) */}
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 text-xs w-full text-left">
                          <div className="text-slate-500 font-medium">
                            <span className="text-slate-400 font-bold mr-1.5">설계년도</span>
                            <span className="text-slate-700 font-bold">{top1Value.designYear}년 설계</span>
                          </div>
                          <div className="text-slate-500 font-medium">
                            <span className="text-slate-400 font-bold mr-1.5">설계기관</span>
                            <span className="text-slate-700 font-bold">{top1Value.designer}</span>
                          </div>
                          <div className="text-slate-500 font-medium">
                            <span className="text-slate-400 font-bold mr-1.5">발주기관</span>
                            <span className="text-slate-705 font-bold">{top1Value.client || "기밀/협회"}</span>
                          </div>
                          <div className="text-slate-500 font-medium">
                            <span className="text-slate-400 font-bold mr-1.5">현재상황</span>
                            <span className="text-indigo-650 font-bold">{top1Value.status}</span>
                          </div>
                        </div>

                        {/* 주요 일치 기여 요인 (유사도 칩 구조 유지) */}
                        <div className="mb-4 w-full text-left">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">주요 일치 기여 요인</p>
                          <div className="flex flex-wrap gap-1.5">
                            {top1Value.topContributions?.map((cont: string, i: number) => (
                              <span key={i} className="text-[10px] font-black bg-indigo-50/70 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded shadow-3xs">
                                {cont}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Matching reasons AND differences (줄간격 1.4~1.6 적용) */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-0 space-y-2.5 text-xs w-full text-left">
                          {top1Value.matchingReasons?.map((reason: string, rIdx: number) => (
                            <p key={rIdx} className="text-slate-600 flex items-start gap-2 leading-relaxed">
                              <span className="text-emerald-500 font-black mt-0.5">✓</span>
                              <span className="font-semibold">{reason}</span>
                            </p>
                          ))}
                          {top1Value.keyDifferences && top1Value.keyDifferences.length > 0 && (
                            <div className="border-t border-slate-200/60 pt-2.5 mt-2">
                              {top1Value.keyDifferences.map((diff: string, dIdx: number) => (
                                <p key={dIdx} className="text-slate-500 flex items-start gap-2 leading-relaxed">
                                  <span className="text-amber-500 mt-0.5">⚠️</span>
                                  <span className="font-medium">{diff}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column (Image Section) - Stretch Sizing on Desktop to fill height with no empty space */}
                      <div className="w-full lg:w-[320px] lg:shrink-0 lg:ml-auto min-w-0 flex flex-col justify-stretch">
                        <div 
                          className="w-full h-full min-h-[220px] rounded-[10px] border border-[#E5E7EB] bg-[#F5F7FA] flex items-center justify-center overflow-hidden animate-fadeIn"
                        >
                          <span className="text-[14px] text-[#9CA3AF] font-bold">이미지</span>
                        </div>
                      </div>

                    </div>

                    {/* Numeric dashboard comparison cards (숫자는 강조, 단위는 축소) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                      <div className="bg-white rounded-xl p-3 border border-slate-200/60 shadow-2xs">
                        <p className="text-[10px] font-bold text-slate-400">연면적 (GFA)</p>
                        <p className="mt-1 flex items-baseline leading-none">
                          <strong className="font-mono text-lg font-black text-slate-800">{top1Value.gfa?.toLocaleString()}</strong>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">m²</span>
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-slate-200/60 shadow-2xs">
                        <p className="text-[10px] font-bold text-slate-400">병상 (Beds)</p>
                        <p className="mt-1 flex items-baseline leading-none">
                          <strong className="font-mono text-lg font-black text-slate-800">{top1Value.beds}</strong>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">B</span>
                        </p>
                      </div>

                      <div className="rounded-xl p-3 border border-indigo-100/50 shadow-2xs" style={{ backgroundColor: "#ffffff" }}>
                        <p className="text-[10px] font-bold text-indigo-700">총 공사비</p>
                        <p className="mt-1 flex items-baseline leading-none">
                          <strong className="font-mono text-lg font-black text-indigo-700">{top1Value.constructionCost ? top1Value.constructionCost.toLocaleString() : "미정"}</strong>
                          <span className="text-[10px] text-indigo-500 font-bold ml-1">백만</span>
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-slate-200/60 shadow-2xs">
                        <p className="text-[10px] font-bold text-slate-400">평당 단가</p>
                        <p className="mt-1 flex items-baseline leading-none">
                          <strong className="font-mono text-lg font-black text-emerald-600">{top1Value.perPyungCost ? Math.round(top1Value.perPyungCost).toLocaleString() : "N/A"}</strong>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">만원/평</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SIBLING SUITE (TOP 2 & TOP 3) SIDE-BY-SIDE - REFINED GRADIENT CARDS WITH THUMBNAILS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* TOP 2 */}
                  {top2Value && (
                    <div
                      onClick={() => {
                        setDetailModalCase(top2Value);
                        onSelectCase(top2Value);
                      }}
                      className="relative rounded-[20px] p-5 border border-slate-200 hover:border-indigo-200 transition-all duration-300 cursor-pointer group flex flex-col justify-between shadow-xs select-none"
                      style={{ backgroundColor: "#f0f8ff" }}
                    >
                      {/* Upper section - horizontal layout with text on left and image on right (Stretched and Enlarged) */}
                      <div className="w-full flex flex-row items-stretch gap-4 sm:gap-5 min-w-0">
                        {/* Text part: Left side */}
                        <div className="flex-1 min-w-0 text-left">
                          {/* Tags and Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                            <div className="bg-slate-200 text-slate-800 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                              <Award className="w-3 h-3" fill="currentColor" stroke="none" />
                              2순위 (SILVER)
                            </div>

                            {/* Category chip (연한 회색) */}
                            <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                              {top2Value.category}
                            </span>

                            {/* Similarity chip (강조색) */}
                            <span className="text-[9px] font-black bg-indigo-50 text-indigo-650 px-1.5 py-0.5 rounded">
                              유사도 {(top2Value.similarityScore * 100).toFixed(0)}%
                            </span>
                          </div>

                          {/* Project Name (가장 크게 강조) */}
                          <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {top2Value.projectName}
                          </h4>

                          {/* Score integrated & Description (Split structurally into separate lines) */}
                          <div className="mt-1.5 mb-3 text-xs text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-400">유사성 스코어:</span>
                              <strong className="text-sm font-mono font-black text-indigo-600">{(top2Value.similarityScore * 100).toFixed(0)}점</strong>
                            </div>
                            <div className="mt-1 text-slate-500 font-medium">
                              {top2Value.location.split(" ")[0]} ∙ {top2Value.designYear}년
                            </div>
                          </div>

                          {/* Top contributions (유사도 칩) */}
                          <div className="flex flex-wrap gap-1 mb-3.5">
                            {top2Value.topContributions?.slice(0, 2).map((cont: string, i: number) => (
                              <span key={i} className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100/40">
                                {cont}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Image part: Right side - Expanded leftwards and downwards */}
                        <div className="w-[150px] sm:w-[180px] shrink-0 min-w-0 flex flex-col justify-stretch">
                          <div 
                            className="w-full h-full min-h-[140px] rounded-[10px] border border-[#E5E7EB] bg-[#F5F7FA] flex items-center justify-center overflow-hidden animate-fadeIn"
                          >
                            <span className="text-[14px] text-[#9CA3AF] font-bold">이미지</span>
                          </div>
                        </div>
                      </div>

                      {/* Lower metrics segment (숫자 강조, 단위 축소) */}
                      <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-slate-100">
                        <div className="rounded-lg p-2 text-left" style={{ backgroundColor: "#f9f9f9" }}>
                          <p className="text-[9px] text-slate-400 font-bold mb-0.5">병상 규모</p>
                          <p className="leading-none mt-1">
                            <strong className="font-mono font-extrabold text-slate-800 text-sm">{top2Value.beds}</strong>
                            <span className="text-[9px] text-slate-450 ml-0.5 font-bold">B</span>
                          </p>
                        </div>
                        <div className="rounded-lg p-2 text-left" style={{ backgroundColor: "#f9f9f9" }}>
                          <p className="text-[9px] font-bold text-indigo-500 mb-0.5">총 공사비</p>
                          <p className="leading-none mt-1">
                            <strong className="font-mono font-black text-indigo-700 text-sm">{top2Value.constructionCost ? top2Value.constructionCost.toLocaleString() : "미정"}</strong>
                            <span className="text-[9px] text-indigo-500 ml-0.5 font-bold">백만</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TOP 3 */}
                  {top3Value && (
                    <div
                      onClick={() => {
                        setDetailModalCase(top3Value);
                        onSelectCase(top3Value);
                      }}
                      className="relative rounded-[20px] p-5 border border-slate-200 hover:border-amber-200 transition-all duration-300 cursor-pointer group flex flex-col justify-between shadow-xs select-none"
                      style={{ backgroundColor: "#f7feff" }}
                    >
                      {/* Upper section - horizontal layout with text on left and image on right (Stretched and Enlarged) */}
                      <div className="w-full flex flex-row items-stretch gap-4 sm:gap-5 min-w-0">
                        {/* Text part: Left side */}
                        <div className="flex-1 min-w-0 text-left">
                          {/* Tags and Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                            <div className="bg-orange-100 text-amber-900 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                              <Award className="w-3 h-3" fill="currentColor" stroke="none" />
                              3순위 (BRONZE)
                            </div>

                            {/* Category chip (연한 회색) */}
                            <span className="text-[9px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                              {top3Value.category}
                            </span>

                            {/* Similarity chip (강조색) */}
                            <span className="text-[9px] font-black bg-indigo-50 text-indigo-650 px-1.5 py-0.5 rounded">
                              유사도 {(top3Value.similarityScore * 100).toFixed(0)}%
                            </span>
                          </div>

                          {/* Project Name (가장 크게 강조) */}
                          <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {top3Value.projectName}
                          </h4>

                          {/* Score integrated & Description (Split structurally into separate lines) */}
                          <div className="mt-1.5 mb-3 text-xs text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-400">유사성 스코어:</span>
                              <strong className="text-sm font-mono font-black text-indigo-600">{(top3Value.similarityScore * 100).toFixed(0)}점</strong>
                            </div>
                            <div className="mt-1 text-slate-500 font-medium">
                              {top3Value.location.split(" ")[0]} ∙ {top3Value.designYear}년
                            </div>
                          </div>

                          {/* Top contributions (유사도 칩) */}
                          <div className="flex flex-wrap gap-1 mb-3.5">
                            {top3Value.topContributions?.slice(0, 2).map((cont: string, i: number) => (
                              <span key={i} className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100/40">
                                {cont}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Image part: Right side - Expanded leftwards and downwards */}
                        <div className="w-[150px] sm:w-[180px] shrink-0 min-w-0 flex flex-col justify-stretch">
                          <div 
                            className="w-full h-full min-h-[140px] rounded-[10px] border border-[#E5E7EB] bg-[#F5F7FA] flex items-center justify-center overflow-hidden animate-fadeIn"
                          >
                            <span className="text-[14px] text-[#9CA3AF] font-bold">이미지</span>
                          </div>
                        </div>
                      </div>

                      {/* Lower metrics segment (숫자 강조, 단위 축소) */}
                      <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-slate-100">
                        <div className="rounded-lg p-2 text-left" style={{ backgroundColor: "#f9f9f9" }}>
                          <p className="text-[9px] text-slate-400 font-bold mb-0.5">병상 규모</p>
                          <p className="leading-none mt-1">
                            <strong className="font-mono font-extrabold text-slate-800 text-sm">{top3Value.beds}</strong>
                            <span className="text-[9px] text-slate-450 ml-0.5 font-bold">B</span>
                          </p>
                        </div>
                        <div className="rounded-lg p-2 text-left" style={{ backgroundColor: "#f9f9f9" }}>
                          <p className="text-[9px] font-bold text-indigo-550 mb-0.5">총 공사비</p>
                          <p className="leading-none mt-1">
                            <strong className="font-mono font-black text-indigo-700 text-sm">{top3Value.constructionCost ? top3Value.constructionCost.toLocaleString() : "미정"}</strong>
                            <span className="text-[9px] text-indigo-500 ml-0.5 font-bold">백만</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Optional General results checklist overview underneath */}
                <div className="bg-white rounded-3xl p-5 flex items-center justify-between text-xs shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] mt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <HelpCircle className="w-4 h-4 text-slate-500" fill="currentColor" stroke="none" />
                    </div>
                    <span className="text-slate-600 font-bold text-[13px]">기타 전체 유사 사례들을 10위까지 도출하고 싶으신가요?</span>
                  </div>
                  <button
                    onClick={() => {
                      onSearchModeChange("general");
                    }}
                    className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer bg-indigo-50 px-4 py-2.5 rounded-xl transition-colors"
                  >
                    일반 다조건 검색에서 나열하기 <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-white text-center p-20 text-slate-400 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col items-center gap-3">
                <Sparkles className="w-8 h-8 text-slate-200" fill="currentColor" strokeWidth={1} />
                <p className="font-bold text-[13px] text-slate-500">12가지 핵심 사양을 기입하면<br/>최우수 유사 1~3순위 결과가 실시간 갱신됩니다.</p>
              </div>
            )}
          </div>
        </div>
      ) : searchMode === "general" ? (
        /* ----------------- MODE 2: GENERAL RANGE MULTI-FILTERS ----------------- */
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* LEFT SIDEBAR: SEARCH CRITERIA INPUT PANEL (15 Advanced Input Boxes) */}
          <div className="w-full lg:w-[260px] xl:w-[300px] shrink-0 bg-white rounded-3xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-2rem)] overflow-y-auto hidden-scrollbar">
            <div className="flex items-center gap-2 border-b border-indigo-50 pb-3">
              <ListFilter className="w-5 h-5 text-indigo-500" fill="currentColor" strokeWidth={0} />
              <h3 className="text-[13px] font-bold text-slate-800">15가지 조건 상세 검색</h3>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-600">
              
              {/* 1) 설계연도 범위 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">1) 설계연도 범위</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="최소"
                    value={m2YearMin}
                    onChange={(e) => setM2YearMin(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                  <span className="text-slate-300">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={m2YearMax}
                    onChange={(e) => setM2YearMax(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* 2) 연면적 범위 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">2) 연면적 범위 (m²)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="최소 m²"
                    value={m2GfaMin}
                    onChange={(e) => setM2GfaMin(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                  <span className="text-slate-300">~</span>
                  <input
                    type="number"
                    placeholder="최대 m²"
                    value={m2GfaMax}
                    onChange={(e) => setM2GfaMax(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* 3) 병상수 범위 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">3) 인허가 병상 범위</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="최소 병상"
                    value={m2BedsMin}
                    onChange={(e) => setM2BedsMin(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                  <span className="text-slate-300">~</span>
                  <input
                    type="number"
                    placeholder="최대 병상"
                    value={m2BedsMax}
                    onChange={(e) => setM2BedsMax(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* 4) 공사비 범위 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">4) 공사비 (백만원)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="최소"
                    value={m2CostMin}
                    onChange={(e) => setM2CostMin(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                  <span className="text-slate-300">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={m2CostMax}
                    onChange={(e) => setM2CostMax(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* 5) 설계비 범위 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">5) 설계비 (백만원)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="최소"
                    value={m2FeeMin}
                    onChange={(e) => setM2FeeMin(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                  <span className="text-slate-300">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={m2FeeMax}
                    onChange={(e) => setM2FeeMax(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* 6) 지하 규모 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">6-A) 지하 규모</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="최소"
                    value={m2ScaleBMin}
                    onChange={(e) => setM2ScaleBMin(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                  <span className="text-slate-300">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={m2ScaleBMax}
                    onChange={(e) => setM2ScaleBMax(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* 6) 지상 규모 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">6-B) 지상 규모</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="최소"
                    value={m2ScaleFMin}
                    onChange={(e) => setM2ScaleFMin(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                  <span className="text-slate-300">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={m2ScaleFMax}
                    onChange={(e) => setM2ScaleFMax(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* 7) 입면주요마감 (텍스트) */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">7) 입면 마감재</label>
                <input
                  type="text"
                  placeholder="예: 석재, 커튼월 등"
                  value={m2Cladding}
                  onChange={(e) => setM2Cladding(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow placeholder-slate-400 font-medium"
                />
              </div>

              {/* 8) 위치 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">8) 건립 예정지 (지역)</label>
                <select
                  value={m2Location}
                  onChange={(e) => setM2Location(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow cursor-pointer font-medium"
                >
                  <option value="전체">전체 지역</option>
                  {allLocations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* 9) 공공/민간 (클릭) */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">9) 공공 / 민간</label>
                <div className="bg-slate-50 p-1 rounded-xl flex gap-1">
                  {(["전체", "공공", "민간"] as const).map(op => (
                    <button
                      key={op}
                      onClick={() => setM2IsPublicCheck(op)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${m2IsPublicCheck === op ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              {/* 10) 발주방식 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">10) 발주방식</label>
                <select
                  value={m2Procurement}
                  onChange={(e) => setM2Procurement(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow cursor-pointer font-medium"
                >
                  <option value="전체">전체 방식</option>
                  {allProcurements.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* 11) 분류 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">11) 병원 기능 분류</label>
                <select
                  value={m2Category}
                  onChange={(e) => setM2Category(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow cursor-pointer font-medium"
                >
                  <option value="전체">전체 분류</option>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* 12) 진행단계 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">12) 진행단계</label>
                <select
                  value={m2Status}
                  onChange={(e) => setM2Status(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow cursor-pointer font-medium"
                >
                  <option value="전체">전체 단계</option>
                  {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* 13) 시공사 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">13) 시공사</label>
                <select
                  value={m2Contractor}
                  onChange={(e) => setM2Contractor(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow cursor-pointer font-medium"
                >
                  <option value="전체">전체 시공사</option>
                  {allContractors.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* 14) 개원/준공연도 (준공/예정 클릭형) */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">14) 준공 / 예정</label>
                <div className="bg-slate-50 p-1 rounded-xl flex gap-1">
                  {(["전체", "준공", "예정"] as const).map(op => (
                    <button
                      key={op}
                      onClick={() => setM2OpeningYearCheck(op)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${m2OpeningYearCheck === op ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              {/* 15) 설계사 */}
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">15) 건축 설계사</label>
                <select
                  value={m2Designer}
                  onChange={(e) => setM2Designer(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow cursor-pointer font-medium"
                >
                  <option value="전체">전체 설계사</option>
                  {allDesigners.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

            </div>
          </div>

          {/* RIGHT MAIN CONTENT: Charts & Results */}
          <div className="flex-1 space-y-6 min-w-0">
            
            {/* 3 Real Insights Charts for Mode 2 Top */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Chart 1: Public-Private Ratio */}
              <div className="bg-white rounded-3xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">공공 vs 민간 비중</span>
                  {m2IsPublicCheck !== "전체" && (
                    <button 
                      onClick={() => setM2IsPublicCheck("전체")}
                      className="text-[10px] text-slate-450 hover:text-slate-650 cursor-pointer font-bold"
                    >
                      필터 해제
                    </button>
                  )}
                </div>
                <div className="h-36 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={m2PublicPrivateData}
                        cx="50%" cy="50%"
                        innerRadius={32} outerRadius={48}
                        paddingAngle={3}
                        dataKey="value"
                        className="cursor-pointer"
                        onClick={(data) => {
                          if (data && data.name) handlePublicPrivateClick(data.name);
                        }}
                      >
                        {m2PublicPrivateData.map((entry, index) => {
                          const isSelected = entry.name.includes("공공") ? m2IsPublicCheck === "공공" : m2IsPublicCheck === "민간";
                          const fillOpacity = (m2IsPublicCheck !== "전체") ? (isSelected ? 1.0 : 0.35) : 1.0;
                          const fill = entry.name.includes("공공") ? "#4f46e5" : "#0ea5e9";
                          return <Cell key={`cell-${index}`} fill={fill} fillOpacity={fillOpacity} stroke="none" />;
                        })}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#fff", border: "none", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-around items-center border-t border-slate-105 pt-2 text-[11px] font-bold text-slate-700">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80" onClick={() => handlePublicPrivateClick("공공")}>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]" />
                    <span>공공: {m2PublicPrivateData[0]?.value || 0}건</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80" onClick={() => handlePublicPrivateClick("민간")}>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
                    <span>민간: {m2PublicPrivateData[1]?.value || 0}건</span>
                  </div>
                </div>
              </div>

              {/* Chart 2: Category volume */}
              <div className="bg-white rounded-3xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">의료시설 주요 용도</span>
                  {m2Category !== "전체" && (
                    <button 
                      onClick={() => setM2Category("전체")}
                      className="text-[10px] text-slate-450 hover:text-slate-650 cursor-pointer font-bold"
                    >
                      필터 해제
                    </button>
                  )}
                </div>
                <div className="h-36 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={m2CategoryData} layout="vertical" margin={{ top: 5, right: 35, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#475569", fontWeight: "600" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={<LeftAlignedYAxisTick />} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} width={115} />
                      <Tooltip contentStyle={{ background: "#fff", border: "none", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16} className="cursor-pointer">
                        {m2CategoryData.map((entry, index) => {
                          const isSelected = m2Category === entry.name;
                          const isMax = index === 0;
                          let fill = isMax ? "#4f46e5" : "#64748b";
                          const opacity = (m2Category !== "전체") ? (isSelected ? 1.0 : 0.35) : 1.0;
                          return <Cell key={`cell-cat-${index}`} fill={fill} fillOpacity={opacity} onClick={() => handleCategoryClick(entry)} />;
                        })}
                        <LabelList dataKey="value" position="right" style={{ fill: "#1e293b", fontSize: "11px", fontWeight: "bold" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Cladding Materials */}
              <div className="bg-white rounded-3xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">외장 마감 선호도</span>
                  {m2Cladding !== "" && (
                    <button 
                      onClick={() => setM2Cladding("")}
                      className="text-[10px] text-slate-450 hover:text-slate-650 cursor-pointer font-bold"
                    >
                      필터 해제
                    </button>
                  )}
                </div>
                <div className="h-36 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={m2CladdingData} layout="vertical" margin={{ top: 5, right: 35, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#475569", fontWeight: "600" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={<LeftAlignedYAxisTick />} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} width={115} />
                      <Tooltip contentStyle={{ background: "#fff", border: "none", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16} className="cursor-pointer">
                        {m2CladdingData.map((entry, index) => {
                          const isSelected = m2Cladding === entry.name;
                          const isMax = index === 0;
                          let fill = isMax ? "#4f46e5" : "#64748b";
                          const opacity = (m2Cladding !== "") ? (isSelected ? 1.0 : 0.35) : 1.0;
                          return <Cell key={`cell-clad-${index}`} fill={fill} fillOpacity={opacity} onClick={() => handleCladdingClick(entry)} />;
                        })}
                        <LabelList dataKey="value" position="right" style={{ fill: "#1e293b", fontSize: "11px", fontWeight: "bold" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* RESULTS GRID / TABLE CONTROLLER HEADER */}
            <div className="bg-white rounded-[20px] p-4 flex items-center justify-between gap-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
              <p className="text-[13px] font-bold text-slate-800">
                조회된 사례 <span className="text-indigo-600 font-black">{searchResults.length}</span>건
              </p>
              
              <div className="bg-slate-50 p-1 rounded-xl flex items-center select-none">
                <button
                  onClick={() => setViewLayout("card")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewLayout === "card" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  title="패널 카드 뷰"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewLayout("table")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewLayout === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  title="상세 테이블 뷰"
                >
                  <TableProperties className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* VIEW RENDERER (15 PER PAGE PAGINATE) */}
            {loading ? (
              <div className="bg-white p-20 text-center text-slate-400 rounded-[20px] flex flex-col items-center gap-2 shadow-sm">
                <RefreshCw className="w-7 h-7 animate-spin text-indigo-500" />
                <span className="text-sm font-bold text-slate-600">조건 연산 중...</span>
              </div>
            ) : paginatedResults.length > 0 ? (
              viewLayout === "card" ? (
                /* CARD GRID VIEW: 15 CARDS */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
                  {paginatedResults.map((c: any) => {
                    const isCancelledOrSuspended = c.status === "취소" || c.status === "용역중지";
                    const outlineClass = selectedCase?.id === c.id 
                      ? "ring-2 ring-indigo-500 border-transparent" 
                      : "border-slate-100";
                    const bgClass = isCancelledOrSuspended 
                      ? "bg-rose-50/50 text-rose-950 hover:bg-rose-50" 
                      : (selectedCase?.id === c.id ? "bg-indigo-50/30" : "bg-white hover:shadow-md");

                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setDetailModalCase(c);
                          onSelectCase(c);
                        }}
                        className={`border rounded-[20px] p-5 transition-all cursor-pointer group flex flex-col justify-between ${outlineClass} ${bgClass}`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${isCancelledOrSuspended ? "bg-rose-100 text-rose-700" : "text-indigo-700 bg-indigo-50"}`}>
                              {c.category}
                            </span>
                            
                            {/* Similarity badge tag */}
                            <div className="flex items-center gap-1.5">
                              {isCancelledOrSuspended && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2.5 py-1 rounded-full">
                                  {c.status}
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                          <h4 className="text-[13px] font-bold text-slate-900 mt-2 line-clamp-1 group-hover:text-indigo-700 transition-colors">
                            {c.projectName}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-1">설계: {c.designer} | 준공: {c.openingYear || "N/A"}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 text-[11px] text-slate-700 font-medium border-t border-slate-100 pt-3">
                          <div>
                            <dt className="text-[10px] text-slate-400">계획예정지</dt>
                            <dd className="mt-0.5 text-slate-800 font-semibold">{c.location}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] text-slate-400">병상수</dt>
                            <dd className="mt-0.5 text-slate-800 font-semibold">{c.beds} 병상</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] text-slate-400">연면적</dt>
                            <dd className="mt-0.5 text-slate-800 font-semibold">{c.gfa?.toLocaleString()} m²</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] text-slate-400">발주방식</dt>
                            <dd className="mt-0.5 text-slate-800 font-semibold">{c.procurementMethod}</dd>
                          </div>
                        </div>

                        {/* Financial info block */}
                        <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-center text-xs mt-3 select-none">
                          <div>
                            <p className="text-[10px] text-slate-500">총 설계공사비</p>
                            <p className="font-semibold text-slate-800 mt-0.5">{c.constructionCost ? `${c.constructionCost.toLocaleString()} 백만원` : "공개안함"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500">평당 단가</p>
                            <p className="font-semibold text-emerald-600 mt-0.5">{c.perPyungCost ? `${Math.round(c.perPyungCost).toLocaleString()} 백만원` : "N/A"}</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  ); })}
                </div>
              ) : (
                /* TABLE VIEW - Bolder borders and higher text size */
                <div className="bg-white border text-sm border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] rounded-[20px] overflow-hidden overflow-x-auto select-none">
                  <table className="w-full text-left border-collapse min-w-[950px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                        <th className="px-5 py-3.5">사업명</th>
                        <th className="px-4 py-3.5">설계사</th>
                        <th className="px-4 py-3.5">진행단계</th>
                        <th className="px-4 py-3.5">지역</th>
                        <th className="px-4 py-3.5 text-center">병상수</th>
                        <th className="px-4 py-3.5 text-center">연면적(m²)</th>
                        <th className="px-4 py-3.5 text-right">공사비</th>
                        <th className="px-4 py-3.5 text-right">평당공사비</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[13px] font-medium text-slate-800 bg-white">
                      {paginatedResults.map((c: any) => {
                        const isCancelledOrSuspended = c.status === "취소" || c.status === "용역중지";
                        const hoverBg = isCancelledOrSuspended ? "hover:bg-rose-50/50" : "hover:bg-slate-50/80";
                        const activeBg = selectedCase?.id === c.id 
                          ? (isCancelledOrSuspended ? "bg-rose-50 border-l-2 border-l-rose-500" : "bg-indigo-50/50 border-l-2 border-l-indigo-500")
                          : (isCancelledOrSuspended ? "bg-rose-50/30" : "");

                        return (
                          <tr
                            key={c.id}
                            onClick={() => {
                              setDetailModalCase(c);
                              onSelectCase(c);
                            }}
                            className={`${hoverBg} ${activeBg} transition-colors cursor-pointer`}
                          >
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-slate-900 line-clamp-1">{c.projectName}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{c.category} | {c.procurementMethod}</p>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">{c.designer}</td>
                            <td className={`px-4 py-3.5 font-medium ${isCancelledOrSuspended ? "text-rose-500" : "text-slate-600"}`}>{c.status}</td>
                          <td className="px-4 py-3.5 text-slate-600">{c.location}</td>
                          <td className="px-4 py-3.5 text-center text-slate-800">{c.beds}</td>
                          <td className="px-4 py-3.5 text-center">
                            {c.gfa?.toLocaleString()}
                            <span className="text-[10px] text-slate-400 block">({formatPyung(c.gfa)}평)</span>
                          </td>
                          <td className="px-4 py-3.5 text-right text-slate-800">
                            {c.constructionCost ? `${c.constructionCost.toLocaleString()} 백만원` : "-"}
                          </td>
                          <td className="px-4 py-3.5 text-right text-emerald-600">
                            {c.perPyungCost ? `${Math.round(c.perPyungCost).toLocaleString()} 백만원` : "-"}
                          </td>
                        </tr>
                      ); })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="bg-white border border-slate-100 text-center p-16 text-slate-500 font-medium rounded-[20px] shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                조건에 맞는 병원 사례가 존재하지 않습니다. 범위를 완화해주세요.
              </div>
            )}

            {/* DYNAMIC PAGINATION FOOTER */}
            {totalPages > 1 && !loading && (
              <div className="bg-white border border-slate-100 rounded-[20px] px-5 py-3.5 flex items-center justify-between text-xs text-slate-500 font-medium select-none shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <p>총 {totalItems}개 레퍼런스 중 {(currentPage - 1) * itemsPerPage + 1}~{Math.min(currentPage * itemsPerPage, totalItems)}개 데이터 표시</p>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2]" />
                  </button>
                  <div className="flex items-center px-3 font-medium text-slate-700 bg-white border border-slate-100 rounded-lg">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
    ) : (
      /* ----------------- MODE 3: INTEGRATED DYNAMIC GIS MAP (FULL EXPANDED) ----------------- */
      <div className="space-y-6 animate-fadeIn">
        {/* Main expanded Map section */}
        <div className="bg-white rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-5 shadow-xs flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-200 pb-4 mb-4 select-none">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-700 stroke-[2.5]" />
                의료기관 건립 프로젝트 지능형 GIS 공간 입지 분포 및 입착 타당성 분석 보드 (전체지도)
              </h3>
              <p className="text-xs text-slate-700 font-medium mt-1">
                116개 의료 보조시설 및 공공병원 사례가 위치 정보(GPS 위도, 경도)에 기반하여 100% 확대 매핑되어 있습니다.
              </p>
            </div>
            <span className="text-xs font-mono font-black text-rose-800 bg-rose-50 px-2.5 py-1.5 rounded-lg border-2 border-rose-200">
              ACTIVE MULTIPLEX GIS LAYER
            </span>
          </div>

          {/* Render the full-screen / expanded map component here directly! */}
          <div className="w-full relative transition-all duration-300">
            {mapComponent}
          </div>
        </div>
      </div>
    )}

      {/* RENDER DETAILED DATA POP-UP / MODAL (Covers all 21 columns specified) */}
      {detailModalCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header bar */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between select-none">
              <div>
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">{detailModalCase.category}</span>
                <h3 className="text-base font-black tracking-tight mt-1">{detailModalCase.projectName}</h3>
              </div>
              <button
                onClick={() => {
                  setDetailModalCase(null);
                  setAiReport("");
                }}
                className="text-slate-400 hover:text-white bg-white/10 p-2 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Top Quick Status Metric Segment */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                  <Maximize2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-450 font-bold">연면적 규모</p>
                    <p className="text-xs font-black text-slate-850 mt-0.5">{detailModalCase.gfa?.toLocaleString()} m²</p>
                    <p className="text-[9px] text-slate-400">({formatPyung(detailModalCase.gfa)} 평형)</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                  <Activity className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-450 font-bold">인허가 병상수</p>
                    <p className="text-xs font-black text-slate-850 mt-0.5">{detailModalCase.beds} 병상</p>
                    <p className="text-[9px] text-slate-400">기획규모 부합</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 bg-indigo-50/20 border-indigo-50">
                  <Coins className="w-5 h-5 text-indigo-650 shrink-0" />
                  <div>
                    <p className="text-[10px] text-indigo-700 font-bold">건설공사비</p>
                    <p className="text-xs font-black text-indigo-750 mt-0.5">{detailModalCase.constructionCost ? `${detailModalCase.constructionCost.toLocaleString()} 백만원` : "지정 보류"}</p>
                    <p className="text-[9px] text-slate-400">실시간 매칭 단가</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-450 font-bold">기획 설계비</p>
                    <p className="text-xs font-black text-slate-850 mt-0.5">{detailModalCase.designFee ? `${detailModalCase.designFee.toLocaleString()} 백만원` : "공개 보류"}</p>
                    <p className="text-[9px] text-slate-400">용역비 기준</p>
                  </div>
                </div>
              </div>

              {/* Splits into Left Side: 21 Items Construction Profile & Right Side: Google Map Pinning */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left Side: 21 Columns Detailed Profile Card - Compact width for Map expansion as annotated */}
                <div className="lg:col-span-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="text-xs font-extrabold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
                      <TableProperties className="w-4 h-4 text-indigo-600" />
                      21대 항목 상세 건축 프로필
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-[11px] text-slate-650 flex-1">
                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">1. 설계사</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block">{detailModalCase.designer || "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">2. 설계연도</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block font-mono">{detailModalCase.designYear ? `${detailModalCase.designYear} 년` : "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">3. 사업명</span>
                      <span className="font-semibold text-xs text-indigo-750 mt-0.5 block">{detailModalCase.projectName || "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">4. 위치 (지하/지상)</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block">{detailModalCase.location || "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">5. 발주처</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block">{detailModalCase.client || "기밀/정보없음"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">6. 공공 / 민간 조달</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block">
                        {detailModalCase.isPublic ? "🟢 공공부조 조달" : "🔵 민간투자 유치"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">7. 계약/발주공사 방식</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block">{detailModalCase.procurementMethod || "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">8. 입면주요마감 (외벽)</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block">{detailModalCase.cladding || "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">9. 용도 및 의료분류</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block">{detailModalCase.category || "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">10. 병상수</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block font-mono">{detailModalCase.beds ? `${detailModalCase.beds.toLocaleString()} Bed` : "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">11. 건축 규모 (층수)</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block font-mono bg-slate-100 py-0.5 px-2 rounded w-fit">{detailModalCase.scale || "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">12. 계획 연면적</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block font-mono">{detailModalCase.gfa?.toLocaleString()} m²</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">13. 기획 진행단계</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block">{detailModalCase.status || "미정/완료"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">14. 입면 시공사</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block">{detailModalCase.contractor || "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">15. 개원 / 준공예정연도</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block">{detailModalCase.openingYear || "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">16. 기획 설계비</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block font-mono">
                        {detailModalCase.designFee ? `${detailModalCase.designFee.toLocaleString()} 백만원` : "공개 제한"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">17. 총 도급 공사비</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block font-mono">
                        {detailModalCase.constructionCost ? `${detailModalCase.constructionCost.toLocaleString()} 백만원` : "공개 제한"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">18. 보정 평당공사비</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block font-mono">
                        {detailModalCase.perPyungCost ? `${Math.round(detailModalCase.perPyungCost).toLocaleString()} 백만원/평` : "산출 불가"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">19. 위도 좌표 (Lat)</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block font-mono">{detailModalCase.lat || "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-550 block font-semibold text-[11px]">20. 경도 좌표 (Lng)</span>
                      <span className="font-semibold text-xs text-slate-800 mt-0.5 block font-mono">{detailModalCase.lng || "-"}</span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-slate-550 block font-semibold text-[11px]">21. 사업 비고</span>
                      <span className="font-medium text-slate-700 mt-1 block text-xs leading-relaxed italic bg-indigo-50/20 p-2.5 rounded-lg border border-indigo-50">
                        {detailModalCase.remarks || "기타 추가 비고 기입 사항 부재"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Interactive Real Google Map mapping Case Location - Expanded width as annotated */}
                <div className="lg:col-span-7 flex flex-col min-h-[350px] lg:min-h-0">
                  <div className="bg-white border border-slate-200 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-sm">
                    {/* Map Navigation Info bar with dynamic view toggles */}
                    <div className="bg-slate-50 border-b border-slate-150 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#aa2d00] animate-pulse" />
                        <span className="text-xs font-bold text-slate-850">지리적 현장 입지 분석</span>
                      </div>
                      
                      {/* Integrated Interactive Tab Controls */}
                      <div className="flex items-center gap-1 bg-slate-200/65 p-0.5 rounded-md text-[10px]">
                        <button
                          type="button"
                          onClick={() => setModalMapViewMode("map")}
                          className={`px-2.5 py-1 rounded font-bold transition-all ${modalMapViewMode === "map" ? "bg-white text-[#181d26] shadow-3xs" : "text-slate-500 hover:text-[#181d26]"}`}
                        >
                          일반지도
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalMapViewMode("streetview")}
                          className={`px-2.5 py-1 rounded font-bold transition-all ${modalMapViewMode === "streetview" ? "bg-[#aa2d00] text-white shadow-3xs" : "text-slate-500 hover:text-[#181d26]"}`}
                        >
                          로드/스트리트뷰
                        </button>
                      </div>
                    </div>

                    {/* Interactive Google Map/StreetView embed component */}
                    <div className="flex-1 bg-slate-100 relative min-h-[250px]">
                      {detailModalCase.lat > 0 && detailModalCase.lng > 0 && (
                        <div className="absolute top-3 left-3 z-10 animate-fadeIn">
                          <a
                            href={modalMapViewMode === "map"
                              ? `https://www.google.com/maps/search/?api=1&query=${detailModalCase.lat},${detailModalCase.lng}`
                              : `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${detailModalCase.lat},${detailModalCase.lng}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-[#181d26] text-[10px] sm:text-xs font-bold py-1.5 px-3 rounded-md shadow-md flex items-center gap-1.5 transition-all select-none hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <span>지도에서 열기</span>
                            <span className="text-[10px] text-slate-400">↗</span>
                          </a>
                        </div>
                      )}
                      {detailModalCase.lat > 0 && detailModalCase.lng > 0 ? (
                        modalMapViewMode === "map" ? (
                          <iframe
                            title={`지도 위치: ${detailModalCase.projectName}`}
                            src={`https://maps.google.com/maps?q=${detailModalCase.lat},${detailModalCase.lng}&hl=ko&z=15&output=embed`}
                            className="absolute inset-0 w-full h-full border-0 animate-fadeIn"
                            allowFullScreen
                            loading="lazy"
                          ></iframe>
                        ) : (
                          <iframe
                            title={`스트리트뷰 위치: ${detailModalCase.projectName}`}
                            src={`https://maps.google.com/maps?layer=c&cbll=${detailModalCase.lat},${detailModalCase.lng}&cbp=12,20.09,,0,5&output=svembed&hl=ko`}
                            className="absolute inset-0 w-full h-full border-0 animate-fadeIn"
                            allowFullScreen
                            loading="lazy"
                          ></iframe>
                        )
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center">
                          <MapPin className="w-10 h-10 text-slate-300 animate-bounce mb-2" />
                          <p className="font-semibold text-slate-700">좌표 비가용 사유</p>
                          <p className="text-[10px] text-slate-400 mt-1">이 설계 사례는 위도, 경도 좌표 정보가 유효하지 않아 지도를 생성할 수 없습니다.</p>
                        </div>
                      )}
                    </div>

                    {/* Local Land Info Banner with External Map Portals */}
                    <div className="bg-slate-900 text-slate-300 p-3 border-t border-slate-850 text-xs font-sans flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-white truncate text-[11px]">{detailModalCase.projectName}</p>
                        <p className="text-slate-400 text-[10px] truncate mt-0.5">현지 행정구역: {detailModalCase.location || "행정구역 미지정"}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${detailModalCase.lat},${detailModalCase.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-800 hover:bg-black border border-slate-700 text-white text-[10px] py-1 px-2.5 rounded font-bold transition-all text-center select-none"
                        >
                          구글맵 연동
                        </a>
                        <a
                          href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${detailModalCase.lat},${detailModalCase.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#aa2d00] hover:bg-[#8f2600] text-white text-[10px] py-1 px-2.5 rounded font-bold transition-all text-center select-none"
                        >
                          로드뷰 연동
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* AI Consulting Advisor integration triggering */}
              <div className="border border-indigo-150 rounded-2xl p-5 bg-indigo-50/40 text-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-extrabold">
                      <Sparkles className="w-4 h-4 text-indigo-650" />
                      Gemini 3.5 기반 건축 기획 AI 타당성 검토
                    </div>
                    <p className="text-slate-500 font-medium">본 사례를 레퍼런스로 해당 조건에서의 자문 시뮬레이션 보고서를 원격 구동합니다.</p>
                  </div>
                  <button
                    onClick={() => runAiAdvisor(detailModalCase)}
                    disabled={generatingReport}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2 rounded-lg cursor-pointer transition-colors disabled:bg-indigo-300 w-full sm:w-auto text-center font-sans shadow-xs"
                  >
                    {generatingReport ? "자문단 소집 보고서 작성 중..." : "AI 타당성 보고서 생성"}
                  </button>
                </div>

                {generatingReport && (
                  <div className="mt-4 p-4 text-center bg-white border rounded-xl flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span className="text-slate-500 font-semibold animate-pulse">원격 Google Gemini AI 모델 자문 자격 검증 및 리포트 기입 중...</span>
                  </div>
                )}

                {aiReport && (
                  <div className="mt-4 p-5 bg-indigo-950 text-slate-100 rounded-xl max-h-[300px] overflow-y-auto prose prose-invert font-sans leading-relaxed border border-indigo-900 shadow-inner">
                    <ReactMarkdown>{aiReport}</ReactMarkdown>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between gap-3 text-xs select-none">
              <button
                onClick={() => {
                  onSelectCase(detailModalCase);
                  setDetailModalCase(null);
                  setAiReport("");
                }}
                className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-extrabold px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <MapPin className="w-4 h-4" />
                GIS 지도 상에서 위치 초점 잡기
              </button>
              
              <button
                onClick={() => {
                  setDetailModalCase(null);
                  setAiReport("");
                }}
                className="bg-white border border-slate-300 text-slate-650 font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
