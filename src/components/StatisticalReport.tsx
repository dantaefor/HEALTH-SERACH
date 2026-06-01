/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from "react";
import { CaseRecord } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ComposedChart,
  ReferenceLine
} from "recharts";
import { 
  TrendingUp, 
  Building2, 
  Layers, 
  MapPin, 
  Paintbrush, 
  DollarSign, 
  CheckCircle2, 
  Info, 
  Activity, 
  PieChartIcon, 
  BarChart3Icon, 
  Percent 
} from "lucide-react";

interface StatisticalReportProps {
  cases: CaseRecord[];
}

// Chart color definitions for pristine editorial aesthetics
const COLOR_PALETTE = {
  primary: "#aa2d00",    // Coral Red
  secondary: "#181d26",  // Deep Charcoal
  accent: "#d9a441",     // Mustard Gold
  success: "#0a2e0e",    // Forest Green
  info: "#3b82f6",       // Ocean Blue
  slate400: "#94a3b8",
  slate100: "#f1f5f9",
  orangeLight: "#faede1",
  sageLight: "#edf2eb",
  pieColors: ["#aa2d00", "#181d26", "#d9a441", "#0a2e0e", "#5a6e7f", "#9cb2c9"]
};

import { useFilters } from "../context/FilterContext";

export default function StatisticalReport({ cases }: StatisticalReportProps) {
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);
  const { selectedCompany, setSelectedCompany, clearFilters } = useFilters();

  // Local Interactive Filters State
  const [localFilters, setLocalFilters] = useState<{
    designYear: number | null;   // e.g. 2020
    category: string | null;     // e.g. "종합병원"
    region: string | null;       // e.g. "서울"
    cladding: string | null;     // e.g. "유닛커튼월"
  }>({
    designYear: null,
    category: null,
    region: null,
    cladding: null,
  });

  // Construct combined filters to avoid editing all downstream references in this file
  const filters = useMemo(() => ({
    designer: selectedCompany,
    designYear: localFilters.designYear,
    category: localFilters.category,
    region: localFilters.region,
    cladding: localFilters.cladding,
  }), [selectedCompany, localFilters]);

  // Cross-filtering matching functions
  const matchesCategory = (c: CaseRecord, filterCat: string) => {
    const cat = c.category || "";
    if (filterCat === "종합병원") return cat.includes("종합");
    if (filterCat === "전문병원") return cat.includes("전문");
    if (filterCat === "의료원") return cat.includes("의료원");
    if (filterCat === "감염병 전문병원") return cat.includes("감염") || cat.includes("코로나");
    if (filterCat === "리모델링") return cat.includes("리모델링") || cat.includes("증축");
    if (filterCat === "일반병원") {
      return !cat.includes("종합") && !cat.includes("전문") && !cat.includes("의료원") && !(cat.includes("감염") || cat.includes("코로나")) && !(cat.includes("리모델링") || cat.includes("증축"));
    }
    return false;
  };

  const getRegion = (location: string) => {
    let r = "기타";
    if (location.includes("서울")) r = "서울";
    else if (location.includes("경기")) r = "경기도";
    else if (location.includes("부산")) r = "부산";
    else if (location.includes("인천")) r = "인천";
    else if (location.includes("대구")) r = "대구";
    else if (location.includes("대전")) r = "대전";
    else if (location.includes("울산")) r = "울산";
    else if (location.includes("광주")) r = "광주";
    else if (location.includes("제주")) r = "제주";
    else if (location.includes("충남") || location.includes("충청남도")) r = "충남";
    else if (location.includes("충북") || location.includes("충청북도")) r = "충북";
    else if (location.includes("경남") || location.includes("경상남도")) r = "경남";
    else if (location.includes("경북") || location.includes("경상북도")) r = "경북";
    else if (location.includes("전남") || location.includes("전라남도")) r = "전남";
    else if (location.includes("전북") || location.includes("전라북도")) r = "전북";
    else if (location.includes("강원")) r = "강원도";
    return r;
  };

  const getCladdingGroup = (cladding: string) => {
    const clad = cladding || "";
    if (clad.includes("커튼월") || clad.includes("유닛")) return "유닛커튼월";
    if (clad.includes("석재") || clad.includes("돌") || clad.includes("천연")) return "천연석재";
    if (clad.includes("테라코타")) return "테라코타패널";
    if (clad.includes("금속") || clad.includes("복합") || clad.includes("AL") || clad.includes("알루미늄")) return "금속패널(AL복합)";
    if (clad.includes("드라이") || clad.includes("스타코") || clad.includes("미장")) return "드라이비트";
    return "";
  };

  // Centralized filter resolver that supports "excludeKey" for independent cross-filtering on active charts
  const getFilteredCases = (excludeKey: string | null = null) => {
    return cases.filter(c => {
      // 1. designer
      if (excludeKey !== "designer" && selectedCompany) {
        const cleanFilter = selectedCompany.replace(/사$/, "").trim().toUpperCase();
        if ((c.designer || "").trim().toUpperCase() !== cleanFilter) return false;
      }
      // 2. designYear
      if (excludeKey !== "designYear" && localFilters.designYear) {
        if (c.designYear !== localFilters.designYear) return false;
      }
      // 3. category
      if (excludeKey !== "category" && localFilters.category) {
        if (!matchesCategory(c, localFilters.category)) return false;
      }
      // 4. region
      if (excludeKey !== "region" && localFilters.region) {
        if (getRegion(c.location) !== localFilters.region) return false;
      }
      // 5. cladding
      if (excludeKey !== "cladding" && localFilters.cladding) {
        if (getCladdingGroup(c.cladding) !== localFilters.cladding) return false;
      }
      return true;
    });
  };

  // Fully filtered cases matching ALL filters
  const fullyFilteredCases = useMemo(() => {
    return getFilteredCases(null);
  }, [cases, selectedCompany, localFilters]);

  // Check if any filters are active
  const hasActiveFilters = selectedCompany !== null || Object.values(localFilters).some(v => v !== null);

  // Click handler definitions
  const handleDesignerClick = (data: any) => {
    if (!data) return;
    const key = data.designerKey || (data.activePayload && data.activePayload[0]?.payload?.designerKey);
    if (!key) return;
    const cleanKey = key.replace(/사$/, "").trim().toUpperCase();
    setSelectedCompany(selectedCompany === cleanKey ? null : cleanKey);
  };

  const handleTimelineClick = (data: any) => {
    if (!data) return;
    const year = data.YearNum || (data.activePayload && data.activePayload[0]?.payload?.YearNum);
    if (!year) return;
    setLocalFilters(prev => ({
      ...prev,
      designYear: prev.designYear === year ? null : year
    }));
  };

  const handleCategoryClick = (data: any) => {
    if (!data) return;
    const name = data.name || (data.activePayload && data.activePayload[0]?.payload?.name);
    if (!name) return;
    setLocalFilters(prev => ({
      ...prev,
      category: prev.category === name ? null : name
    }));
  };

  const handleRegionClick = (data: any) => {
    if (!data) return;
    const region = data.region || (data.activePayload && data.activePayload[0]?.payload?.region);
    if (!region) return;
    setLocalFilters(prev => ({
      ...prev,
      region: prev.region === region ? null : region
    }));
  };

  const handleCladdingClick = (data: any) => {
    if (!data) return;
    const material = data.material || (data.activePayload && data.activePayload[0]?.payload?.material);
    if (!material) return;
    setLocalFilters(prev => ({
      ...prev,
      cladding: prev.cladding === material ? null : material
    }));
  };

  // 1. Data Prep: 설계사별 프로젝트 수 (공공/민간 적층형)
  const designerChartData = useMemo(() => {
    const counts: Record<string, { publicCount: number; privateCount: number; total: number }> = {};
    
    // Initialize standard A~K
    "ABCDEFGHIJK".split("").forEach(char => {
      counts[char] = { publicCount: 0, privateCount: 0, total: 0 };
    });

    const activeCases = getFilteredCases("designer");
    activeCases.forEach(c => {
      const d = (c.designer || "").trim().toUpperCase();
      if (counts[d]) {
        if (c.isPublic) {
          counts[d].publicCount += 1;
        } else {
          counts[d].privateCount += 1;
        }
        counts[d].total += 1;
      }
    });

    return Object.entries(counts)
      .map(([designer, info]) => {
        const total = info.total || 1;
        const pubPct = Math.round((info.publicCount / total) * 100);
        const priPct = 100 - pubPct;
        return {
          designer: `${designer}사`,
          designerKey: designer,
          공공: info.publicCount,
          민간: info.privateCount,
          합계: info.total,
          pubPct,
          priPct,
          ratioText: `${pubPct}:${priPct}`
        };
      })
      .sort((a, b) => b.합계 - a.합계);
  }, [cases, selectedCompany, localFilters]);

  // 2. Data Prep: 연도별 프로젝트 추이 (2014~2026)
  const trendChartData = useMemo(() => {
    const yearsGroup: Record<number, number> = {};
    
    // Pre-populate years 2014 to 2026 to ensure smooth continuity
    for (let y = 2014; y <= 2026; y++) {
      yearsGroup[y] = 0;
    }

    const activeCases = getFilteredCases("designYear");
    activeCases.forEach(c => {
      if (c.designYear >= 2014 && c.designYear <= 2026) {
        yearsGroup[c.designYear] += 1;
      }
    });

    return Object.entries(yearsGroup)
      .map(([year, count]) => ({
        year: `${year}년`,
        YearNum: parseInt(year),
        프로젝트수: count
      }))
      .sort((a, b) => a.YearNum - b.YearNum);
  }, [cases, selectedCompany, localFilters]);

  // 3. Data Prep: 병원유형별 파이 차트
  const categoryPieData = useMemo(() => {
    const counts: Record<string, number> = {
      "종합병원": 0,
      "전문병원": 0,
      "의료원": 0,
      "감염병 전문병원": 0,
      "일반병원": 0,
      "리모델링": 0
    };

    const activeCases = getFilteredCases("category");
    activeCases.forEach(c => {
      const cat = c.category || "";
      if (cat.includes("종합")) counts["종합병원"] += 1;
      else if (cat.includes("전문")) counts["전문병원"] += 1;
      else if (cat.includes("의료원")) counts["의료원"] += 1;
      else if (cat.includes("감염") || cat.includes("코로나")) counts["감염병 전문병원"] += 1;
      else if (cat.includes("리모델링") || cat.includes("증축")) counts["리모델링"] += 1;
      else counts["일반병원"] += 1;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        value: count,
        percent: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0
      }))
      .filter(item => item.value > 0);
  }, [cases, selectedCompany, localFilters]);

  // 4. Data Prep: 연면적 vs 공사비 산점도 (공사비 단위 백만 원 변환)
  const scatterPlotData = useMemo(() => {
    return fullyFilteredCases
      .filter(c => c.gfa > 0 && c.constructionCost > 0)
      .map(c => {
        let normalizedCategory = "일반병원";
        if (c.category.includes("종합")) normalizedCategory = "종합병원";
        else if (c.category.includes("전문")) normalizedCategory = "전문병원";
        else if (c.category.includes("의료원")) normalizedCategory = "의료원";
        else if (c.category.includes("감염")) normalizedCategory = "감염병 전문병원";
        else if (c.category.includes("리모델링")) normalizedCategory = "리모델링";

        return {
          name: c.projectName,
          gfa: Math.round(c.gfa),
          costMillion: Math.round(c.constructionCost * 100),
          category: normalizedCategory
        };
      });
  }, [fullyFilteredCases]);

  // Grouped scatter data for charting colored layers
  const groupedScatterData = useMemo(() => {
    const groups: Record<string, any[]> = {};
    scatterPlotData.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [scatterPlotData]);

  // 5. Data Prep: 지역별 프로젝트 분포
  const regionalDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    const activeCases = getFilteredCases("region");
    activeCases.forEach(c => {
      const r = getRegion(c.location);
      counts[r] = (counts[r] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([region, count]) => ({ region, 프로젝트수: count }))
      .sort((a, b) => b.프로젝트수 - a.프로젝트수);
  }, [cases, selectedCompany, localFilters]);

  // 6. Data Prep: 평당공사비 vs 입면마감재 Boxplot 분포
  const claddingCostData = useMemo(() => {
    const groups: Record<string, number[]> = {
      "유닛커튼월": [],
      "천연석재": [],
      "테라코타패널": [],
      "금속패널(AL복합)": [],
      "드라이비트": []
    };

    const activeCases = getFilteredCases("cladding");
    activeCases.forEach(c => {
      const clad = c.cladding || "";
      let targetGroup = "";
      
      if (clad.includes("커튼월") || clad.includes("유닛")) targetGroup = "유닛커튼월";
      else if (clad.includes("석재") || clad.includes("돌") || clad.includes("천연")) targetGroup = "천연석재";
      else if (clad.includes("테라코타")) targetGroup = "테라코타패널";
      else if (clad.includes("금속") || clad.includes("복합") || clad.includes("AL") || clad.includes("알루미늄")) targetGroup = "금속패널(AL복합)";
      else if (clad.includes("드라이") || clad.includes("스타코") || clad.includes("미장")) targetGroup = "드라이비트";

      if (targetGroup && c.perPyungCost > 0) {
        groups[targetGroup].push(c.perPyungCost);
      }
    });

    return Object.entries(groups).map(([material, costs]) => {
      if (costs.length === 0) {
        return {
          material,
          min: 0,
          max: 0,
          avg: 0,
          boxSpread: [0, 0],
          whiskerSpread: [0, 0]
        };
      }
      
      costs.sort((a, b) => a - b);
      const min = parseFloat(costs[0].toFixed(2));
      const max = parseFloat(costs[costs.length - 1].toFixed(2));
      const total = costs.reduce((sum, val) => sum + val, 0);
      const avg = parseFloat((total / costs.length).toFixed(2));
      
      const q1Index = Math.floor(costs.length * 0.25);
      const q3Index = Math.min(costs.length - 1, Math.floor(costs.length * 0.75));
      const q1 = costs[q1Index];
      const q3 = costs[q3Index];

      return {
        material,
        min,
        max,
        avg,
        boxSpread: [parseFloat(q1.toFixed(2)), parseFloat(q3.toFixed(2))],
        whiskerSpread: [min, max]
      };
    });
  }, [cases, selectedCompany, localFilters]);

  // Overall database KPIs computed on-the-fly based on completely filtered subset
  const kpiStats = useMemo(() => {
    const totalCount = fullyFilteredCases.length;
    const publicCount = fullyFilteredCases.filter(c => c.isPublic).length;
    const privateCount = totalCount - publicCount;
    
    let sumCost = 0;
    let sumGFA = 0;
    let validCostCount = 0;
    let validGFACount = 0;

    fullyFilteredCases.forEach(c => {
      if (c.constructionCost > 0) {
        sumCost += c.constructionCost;
        validCostCount += 1;
      }
      if (c.gfa > 0) {
        sumGFA += c.gfa;
        validGFACount += 1;
      }
    });

    const avgCost = validCostCount > 0 ? sumCost / validCostCount : 0;
    const avgGFA = validGFACount > 0 ? sumGFA / validGFACount : 0;

    const validPyungCostCases = fullyFilteredCases.filter(c => c.perPyungCost > 0);
    const avgPyungCost = validPyungCostCases.length > 0
      ? validPyungCostCases.reduce((sum, c) => sum + c.perPyungCost, 0) / validPyungCostCases.length
      : 0;

    return {
      totalCount,
      publicCount,
      privateCount,
      avgCostMillion: Math.round(avgCost * 100),
      avgCost100Million: Math.round(avgCost),
      avgPyungCost,
      avgGFAPyung: Math.round(avgGFA / 3.3058)
    };
  }, [fullyFilteredCases]);

  // Dynamic localization stats for KPI cards
  const dynamicLocationStats = useMemo(() => {
    if (fullyFilteredCases.length === 0) {
      return { text: "데이터 매칭 없음", secondText: "검색 결과를 초기화하세요" };
    }
    const counts: Record<string, number> = {};
    fullyFilteredCases.forEach(c => {
      const r = getRegion(c.location);
      counts[r] = (counts[r] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [topRegion, count] = sorted[0];
    const pct = Math.round((count / fullyFilteredCases.length) * 100);
    const secondText = sorted.length > 1 
      ? `${sorted[0][0]} ${sorted[0][1]}건 & ${sorted[1][0]} ${sorted[1][1]}건 순` 
      : `${sorted[0][0]} ${sorted[0][1]}건 단독`;
    return {
      text: `${topRegion} 집중 (${pct}%)`,
      secondText
    };
  }, [fullyFilteredCases]);

  // Table row dynamic insights
  const dynamicDesignerInsight = useMemo(() => {
    if (fullyFilteredCases.length === 0) {
      return { rangeText: "-", percentText: "-", description: "활성 필터 매칭 없음" };
    }
    const counts: Record<string, number> = {};
    fullyFilteredCases.forEach(c => {
      const d = (c.designer || "").trim().toUpperCase();
      if (d) counts[d] = (counts[d] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxDesigner = sorted[0];
    const minDesigner = sorted[sorted.length - 1];
    
    const rangeText = sorted.length > 1 
      ? `${maxDesigner[0]}사(${maxDesigner[1]}건) ~ ${minDesigner[0]}사(${minDesigner[1]}건)` 
      : `${maxDesigner[0]}사(${maxDesigner[1]}건) 단독`;
    const sharePct = ((maxDesigner[1] / fullyFilteredCases.length) * 100).toFixed(1);
    const percentText = `${maxDesigner[0]}사 ${sharePct}% 점유`;
    return { rangeText, percentText, description: `현재 필터 범위 내 참여 건축사는 총 ${sorted.length}개사 입니다.` };
  }, [fullyFilteredCases]);

  const dynamicTimelineInsight = useMemo(() => {
    if (fullyFilteredCases.length === 0) {
      return { rangeText: "-", text: "-" };
    }
    const years = fullyFilteredCases.map(c => c.designYear).filter(Boolean);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const yearsGroup: Record<number, number> = {};
    fullyFilteredCases.forEach(c => {
      yearsGroup[c.designYear] = (yearsGroup[c.designYear] || 0) + 1;
    });
    const sortedYearsByCount = Object.entries(yearsGroup).sort((a, b) => b[1] - a[1]);
    const peakYear = sortedYearsByCount[0]?.[0];
    return {
      rangeText: minYear === maxYear ? `${minYear}년` : `${minYear} ~ ${maxYear}년`,
      text: peakYear ? `${peakYear}년 피크기` : "해당 없음"
    };
  }, [fullyFilteredCases]);

  const dynamicCategoryInsight = useMemo(() => {
    if (fullyFilteredCases.length === 0) {
      return { rangeText: "-", text: "-" };
    }
    const counts: Record<string, number> = {};
    fullyFilteredCases.forEach(c => {
      let catName = "일반병원";
      if (c.category.includes("종합")) catName = "종합병원";
      else if (c.category.includes("전문")) catName = "전문병원";
      else if (c.category.includes("의료원")) catName = "의료원";
      else if (c.category.includes("감염") || c.category.includes("코로나")) catName = "감염병병원";
      else if (c.category.includes("리모델링") || c.category.includes("증축")) catName = "리모델링";
      counts[catName] = (counts[catName] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxCat = sorted[0];
    const sharePct = ((maxCat[1] / fullyFilteredCases.length) * 100).toFixed(1);
    const rangeText = sorted.map(([name, val]) => `${name}(${val})`).slice(0, 3).join(", ");
    return {
      rangeText,
      text: `${maxCat[0]} ${sharePct}%`
    };
  }, [fullyFilteredCases]);

  const dynamicRegionInsight = useMemo(() => {
    if (fullyFilteredCases.length === 0) {
      return { rangeText: "-", text: "-" };
    }
    const counts: Record<string, number> = {};
    fullyFilteredCases.forEach(c => {
      const r = getRegion(c.location);
      counts[r] = (counts[r] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const rangeText = sorted.map(([name, val]) => `${name}(${val})`).slice(0, 2).join(", ");
    const pct = ((sorted[0][1] / fullyFilteredCases.length) * 100).toFixed(1);
    return {
      rangeText,
      text: `${sorted[0][0]}권역 약 ${pct}%`
    };
  }, [fullyFilteredCases]);

  const dynamicCladdingInsight = useMemo(() => {
    if (fullyFilteredCases.length === 0) {
      return { rangeText: "-", text: "-" };
    }
    const counts: Record<string, number> = {};
    fullyFilteredCases.forEach(c => {
      const cl = getCladdingGroup(c.cladding) || "기타";
      counts[cl] = (counts[cl] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const rangeText = sorted.map(([name, val]) => `${name}(${val})`).slice(0, 3).join(", ");
    const pct = ((sorted[0][1] / fullyFilteredCases.length) * 100).toFixed(1);
    return {
      rangeText,
      text: `${sorted[0][0]} ${pct}% 주류`
    };
  }, [fullyFilteredCases]);

  return (
    <div className="space-y-8 animate-fadeIn text-[#333840] font-sans">
      
      {/* 📋 Executive Insight Summary Panel */}
      <div className="bg-[#fafbfc] border border-[#dddddd] rounded-xl p-6 shadow-3xs select-none">
        
        {/* Header and Reset Filters block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#aa2d00]" />
            <h3 className="text-sm font-bold text-[#181d26] tracking-tight uppercase">
              실적 인사이트 분석보고서 데이터 매트릭스
            </h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedCompany(null);
                setLocalFilters({ designYear: null, category: null, region: null, cladding: null });
              }}
              className="text-xs self-start sm:self-center font-bold px-3 py-1.5 rounded-lg border border-[#aa2d00] text-[#aa2d00] hover:bg-[#aa2d00] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>필터 전체 초기화</span>
              <span>↺</span>
            </button>
          )}
        </div>

        {/* Global Filter Pills Display */}
        {hasActiveFilters && (
          <div className="mb-5 bg-[#faede1]/60 border border-[#aa2d00]/15 rounded-xl p-3 flex flex-wrap items-center gap-2 animate-fadeIn transition-all duration-300">
            <span className="text-[10px] font-bold text-[#aa2d00] uppercase tracking-wider flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              적용 필터:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {filters.designer && (
                <span className="bg-white border text-[11px] font-semibold text-slate-800 px-2.5 py-1 rounded-full flex items-center gap-1 hover:border-red-400 cursor-pointer shadow-4xs" onClick={() => setSelectedCompany(null)}>
                  {filters.designer}사 <span className="text-slate-400 font-bold hover:text-red-500 font-mono text-[9px] ml-1">✕</span>
                </span>
              )}
              {filters.designYear && (
                <span className="bg-white border text-[11px] font-semibold text-slate-800 px-2.5 py-1 rounded-full flex items-center gap-1 hover:border-red-400 cursor-pointer shadow-4xs" onClick={() => setLocalFilters(prev => ({ ...prev, designYear: null }))}>
                  {filters.designYear}년 <span className="text-slate-400 font-bold hover:text-red-500 font-mono text-[9px] ml-1">✕</span>
                </span>
              )}
              {filters.category && (
                <span className="bg-white border text-[11px] font-semibold text-slate-800 px-2.5 py-1 rounded-full flex items-center gap-1 hover:border-red-400 cursor-pointer shadow-4xs" onClick={() => setLocalFilters(prev => ({ ...prev, category: null }))}>
                  {filters.category} <span className="text-slate-400 font-bold hover:text-red-500 font-mono text-[9px] ml-1">✕</span>
                </span>
              )}
              {filters.region && (
                <span className="bg-white border text-[11px] font-semibold text-slate-800 px-2.5 py-1 rounded-full flex items-center gap-1 hover:border-red-400 cursor-pointer shadow-4xs" onClick={() => setLocalFilters(prev => ({ ...prev, region: null }))}>
                  {filters.region} <span className="text-slate-400 font-bold hover:text-red-500 font-mono text-[9px] ml-1">✕</span>
                </span>
              )}
              {filters.cladding && (
                <span className="bg-white border text-[11px] font-semibold text-slate-800 px-2.5 py-1 rounded-full flex items-center gap-1 hover:border-red-400 cursor-pointer shadow-4xs" onClick={() => setLocalFilters(prev => ({ ...prev, cladding: null }))}>
                  {filters.cladding} <span className="text-slate-400 font-bold hover:text-red-500 font-mono text-[9px] ml-1">✕</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Responsive KPI Blocks */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-4xs text-left">
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">총 수집 사례 데이터</span>
            <p className="text-2xl font-black text-[#181d26] mt-1">
              {kpiStats.totalCount} <span className="text-xs font-semibold text-slate-500">건</span>
            </p>
            <div className="mt-1.5 flex gap-2 text-[10px] font-medium text-slate-450 border-t border-slate-50 pt-1.5 justify-between">
              <span>공공: <strong className="text-[#aa2d00]">{kpiStats.publicCount}건</strong></span>
              <span>민간: <strong className="text-slate-700">{kpiStats.privateCount}건</strong></span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-4xs text-left">
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">평균 평당 공사비</span>
            <p className="text-2xl font-black text-[#aa2d00] mt-1">
              {kpiStats.avgPyungCost ? kpiStats.avgPyungCost.toFixed(2) : "0.00"} <span className="text-xs font-semibold text-[#aa2d00]">백만원</span>
            </p>
            <span className="text-[10px] text-slate-400 block mt-1.5 border-t border-slate-50 pt-1.5 font-sans leading-normal select-none">
              평단가 = 공사비(백만원)/연면적*3.3048
            </span>
          </div>

          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-4xs text-left">
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">평균 건립 연면적</span>
            <p className="text-2xl font-black text-indigo-750 mt-1">
              {kpiStats.avgGFAPyung.toLocaleString()} <span className="text-xs font-semibold text-slate-500">평</span>
            </p>
            <span className="text-[10px] text-slate-400 block mt-1.5 border-t border-slate-50 pt-1.5">
              실제면적 {(kpiStats.avgGFAPyung * 3.3).toLocaleString(undefined, { maximumFractionDigits:0 })}m² 에 해당
            </span>
          </div>

          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-4xs text-left">
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">최적 성향 분포처</span>
            <p className="text-[15px] font-black text-emerald-800 mt-1.5 truncate">
              {dynamicLocationStats.text}
            </p>
            <span className="text-[10px] text-slate-400 block mt-1.5 border-t border-slate-100 pt-1 truncate">
              {dynamicLocationStats.secondText}
            </span>
          </div>
        </div>

        {/* 📊 Structured Insight Table according to image guidelines */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs">
          <table className="min-w-full text-xs text-left text-slate-700 leading-normal">
            <thead className="bg-[#181d26] text-white text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="px-5 py-3">구분 항목 (Hospital KPI)</th>
                <th scope="col" className="px-5 py-3">데이터 분석 내용 (Summary Description)</th>
                <th scope="col" className="px-5 py-3 text-center">건수/범위 (Value Metric)</th>
                <th scope="col" className="px-5 py-3 text-right">점유 분포 비중 (Status Track)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-bold text-[#181d26] flex items-center gap-1.5 select-none align-top pt-4 shrink-0 w-[180px]">
                  <Building2 className="w-3.5 h-3.5 text-[#aa2d00]" />
                  <span>설계사 실적 집중도</span>
                </td>
                <td className="px-5 py-3 space-y-3">
                  <p className="text-slate-500">{dynamicDesignerInsight.description} (조건에 따라 자동 연동됩니다)</p>
                  
                  {/* Symmetrical grid for designers with public:private ratio EX 35:65 */}
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex flex-col gap-3 select-none">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">각 설계사별 실적 분포 및 공공:민간 분배 비율</span>
                      <div className="flex items-center gap-3 pb-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                          <span className="text-[10px] font-bold text-indigo-950 font-sans">공공 (Public)</span>
                        </span>
                        <span className="text-slate-300 text-[9px] font-mono">|</span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"></span>
                          <span className="text-[10px] font-bold text-cyan-950 font-sans">민간 (Private)</span>
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {designerChartData.map(item => {
                        const isSelected = selectedCompany === item.designerKey;
                        return (
                          <div 
                            key={item.designer} 
                            onClick={() => setSelectedCompany(isSelected ? null : item.designerKey)}
                            className={`py-2 px-2.5 rounded-xl flex flex-col items-center cursor-pointer transition-all border text-center
                              ${isSelected 
                                ? "bg-indigo-50/70 border-indigo-600 shadow-sm font-extrabold scale-[1.03] ring-1 ring-indigo-500/20" 
                                : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/55"
                              }`}
                          >
                            <span className="text-[10px] font-bold text-slate-800 leading-none">{item.designer}</span>
                            <span className="text-[9px] text-slate-400 font-semibold mt-0.5 mb-1.5 font-sans leading-none">({item.합계}건)</span>
                            <div className="font-mono text-[10px] font-black tracking-tight mt-auto flex items-center justify-center gap-0.5 leading-none">
                              <span className="text-indigo-600">{item.pubPct}</span>
                              <span className="text-slate-200 font-medium">:</span>
                              <span className="text-cyan-500">{item.priPct}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 font-semibold text-center text-slate-900 align-top pt-4">
                  {dynamicDesignerInsight.rangeText}
                </td>
                <td className="px-5 py-3 text-right align-top pt-4">
                  <span className="bg-rose-50 text-[#aa2d00] font-bold px-2 py-0.5 rounded text-[10px]">
                    {dynamicDesignerInsight.percentText}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  연도별 설계 추이
                </td>
                <td className="px-5 py-3 text-slate-500">2014년 기점으로 건립 프로젝트가 등락하였으며 코로나 시기 급증</td>
                <td className="px-5 py-3 font-semibold text-center text-slate-900">{dynamicTimelineInsight.rangeText}</td>
                <td className="px-5 py-3 text-right">
                  <span className="bg-slate-100 text-[#181d26] font-bold px-2 py-0.5 rounded text-[10px]">{dynamicTimelineInsight.text}</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  주요 병원유형 분포
                </td>
                <td className="px-5 py-3 text-slate-500">종합병원이 주도적인 비중을 차지하며, 감염방지 등 특수시설 지속 확충</td>
                <td className="px-5 py-3 font-semibold text-center text-slate-900 truncate max-w-[200px]">{dynamicCategoryInsight.rangeText}</td>
                <td className="px-5 py-3 text-right">
                  <span className="bg-[#fefaf2] text-[#d9a441] font-bold px-2 py-0.5 rounded text-[10px]">{dynamicCategoryInsight.text}</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  광역 지역별 세부입지
                </td>
                <td className="px-5 py-3 text-slate-500">인구 밀집도가 높은 수도권 지역에 압도적인 빈도로 수렴</td>
                <td className="px-5 py-3 font-semibold text-center text-slate-900">{dynamicRegionInsight.rangeText}</td>
                <td className="px-5 py-3 text-right">
                  <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">{dynamicRegionInsight.text}</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-bold text-slate-800 flex items-center gap-1.5">
                  <Paintbrush className="w-3.5 h-3.5 text-teal-650" />
                  입면 외벽 마감선호
                </td>
                <td className="px-5 py-3 text-slate-500">마감의 품격 및 단열을 위해 유닛커튼월 및 천연석재가 압도적 강세</td>
                <td className="px-5 py-3 font-semibold text-center text-slate-900 truncate max-w-[200px]">{dynamicCladdingInsight.rangeText}</td>
                <td className="px-5 py-3 text-right">
                  <span className="bg-teal-50 text-teal-850 font-bold px-2 py-0.5 rounded text-[10px]">{dynamicCladdingInsight.text}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 📊 3x2 Grid layout for the 6 requested advanced infographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none font-sans">
        
        {/* Graph 1: 설계사별 프로젝트 수 (공공/민간 비율 적층형) */}
        <div 
          onMouseEnter={() => setHoveredChart("designer")}
          onMouseLeave={() => setHoveredChart(null)}
          className={`bg-white border rounded-xl p-5 shadow-xs transition-all duration-300 flex flex-col justify-between h-[360px]
            ${hoveredChart === "designer" || filters.designer ? "border-[#aa2d00] shadow-sm scale-[1.01]" : "border-[#dddddd]"}`}
        >
          <div className="mb-3">
            <h4 className="text-xs font-extrabold text-[#181d26] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="bg-rose-50 text-[#aa2d00] p-1 rounded-md"><Building2 className="w-3.5 h-3.5" /></span>
                1. 설계사별 프로젝트 실적 수 및 공공/민간 비율
              </span>
              {filters.designer && <span className="text-[10px] bg-red-100 text-[#aa2d00] font-black px-1.5 py-0.5 rounded">필터링 적용: {filters.designer}사</span>}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              {filters.designer ? "선택한 설계사의 실적이 강조되었습니다. 다른 막대를 클릭하여 변경하거나 빈 곳을 클릭하여 초기화하세요." : "각 설계사 막대를 클릭하면 대시보드 전체가 해당 설계사의 포트폴리오로 교차 필터링됩니다."}
            </p>
          </div>
          
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={designerChartData} 
                margin={{ top: 10, right: 10, bottom: 5, left: -20 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    handleDesignerClick(state.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="designer" stroke={COLOR_PALETTE.slate400} fontSize={9} tickLine={false} />
                <YAxis stroke={COLOR_PALETTE.slate400} fontSize={9} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 9 }} />
                
                <Bar dataKey="공공" name="공공(Public)" stackId="a" radius={[0, 0, 0, 0]}>
                  {designerChartData.map((entry, index) => {
                    const isSelected = filters.designer === entry.designerKey;
                    const isAnotherSelected = filters.designer !== null && !isSelected;
                    return (
                      <Cell 
                        key={`cell-pub-${index}`} 
                        fill={isSelected ? "#b91c1c" : COLOR_PALETTE.primary} 
                        fillOpacity={isAnotherSelected ? 0.25 : 1.0}
                        stroke={isSelected ? "#181d26" : "none"}
                        strokeWidth={isSelected ? 1.5 : 0}
                        cursor="pointer"
                        onClick={() => handleDesignerClick(entry)}
                      />
                    );
                  })}
                </Bar>
                <Bar dataKey="민간" name="민간(Private)" stackId="a" radius={[3, 3, 0, 0]}>
                  {designerChartData.map((entry, index) => {
                    const isSelected = filters.designer === entry.designerKey;
                    const isAnotherSelected = filters.designer !== null && !isSelected;
                    return (
                      <Cell 
                        key={`cell-pri-${index}`} 
                        fill={isSelected ? "#0f172a" : COLOR_PALETTE.secondary} 
                        fillOpacity={isAnotherSelected ? 0.25 : 1.0}
                        stroke={isSelected ? "#181d26" : "none"}
                        strokeWidth={isSelected ? 1.5 : 0}
                        cursor="pointer"
                        onClick={() => handleDesignerClick(entry)}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: 연도별 프로젝트 추이 라인 차트 */}
        <div 
          onMouseEnter={() => setHoveredChart("timeline")}
          onMouseLeave={() => setHoveredChart(null)}
          className={`bg-white border rounded-xl p-5 shadow-xs transition-all duration-300 flex flex-col justify-between h-[360px]
            ${hoveredChart === "timeline" || filters.designYear ? "border-indigo-650 shadow-sm scale-[1.01]" : "border-[#dddddd]"}`}
        >
          <div className="mb-3">
            <h4 className="text-xs font-extrabold text-[#181d26] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-650 p-1 rounded-md"><TrendingUp className="w-3.5 h-3.5" /></span>
                2. 연도별 설계 프로젝트 수 추이 변화
              </span>
              {filters.designYear && <span className="text-[10px] bg-indigo-100 text-indigo-705 font-black px-1.5 py-0.5 rounded">필터링 적용: {filters.designYear}년</span>}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              특정 연도의 노드 점을 클릭하면 대시보드가 해당 단일 설계 연도의 실적으로 정밀 크로스-필터링됩니다.
            </p>
          </div>
          
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={trendChartData} 
                margin={{ top: 10, right: 15, bottom: 5, left: -20 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    handleTimelineClick(state.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" stroke={COLOR_PALETTE.slate400} fontSize={9} tickLine={false} />
                <YAxis stroke={COLOR_PALETTE.slate400} fontSize={9} tickLine={false} />
                <Tooltip />
                {filters.designYear && (
                  <ReferenceLine 
                    x={`${filters.designYear}년`} 
                    stroke="#aa2d00" 
                    strokeWidth={2}
                    strokeDasharray="4 4" 
                    label={{ value: "선택연도", fill: "#aa2d00", fontSize: 10, position: "top", fontWeight: "bold" }} 
                  />
                )}
                <Line 
                  type="monotone" 
                  dataKey="프로젝트수" 
                  stroke={COLOR_PALETTE.primary} 
                  strokeWidth={3.5} 
                  activeDot={{ r: 7, stroke: "#181d26", strokeWidth: 1.5 }} 
                  name="건립 건수" 
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const isSelected = filters.designYear === payload.YearNum;
                    return (
                      <circle 
                        key={`dot-${payload.YearNum}`}
                        cx={cx} 
                        cy={cy} 
                        r={isSelected ? 6 : 4} 
                        fill={isSelected ? "#aa2d00" : "#ffffff"} 
                        stroke={isSelected ? "#181d26" : COLOR_PALETTE.primary} 
                        strokeWidth={isSelected ? 2.5 : 2} 
                        style={{ cursor: "pointer" }}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 3: 병원유형별 파이 차트 */}
        <div 
          onMouseEnter={() => setHoveredChart("categoryPie")}
          onMouseLeave={() => setHoveredChart(null)}
          className={`bg-white border rounded-xl p-5 shadow-xs transition-all duration-300 flex flex-col justify-between h-[360px]
            ${hoveredChart === "categoryPie" || filters.category ? "border-[#d9a441] shadow-sm scale-[1.01]" : "border-[#dddddd]"}`}
        >
          <div className="mb-3">
            <h4 className="text-xs font-extrabold text-[#181d26] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="bg-amber-50 text-amber-600 p-1 rounded-md"><PieChartIcon className="w-3.5 h-3.5" /></span>
                3. 의료 병원유형 및 성격 분류 비중
              </span>
              {filters.category && <span className="text-[10px] bg-amber-100 text-amber-801 font-black px-1.5 py-0.5 rounded">필터링 적용: {filters.category}</span>}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              파이 조각을 직접 클릭하면 대시보드 전체가 종합병원, 의료원 등 해당 성격으로 통합 동기화됩니다.
            </p>
          </div>
          
          <div className="flex-1 min-h-0 relative flex items-center justify-center">
            <div className="w-3/5 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(data) => handleCategoryClick(data)}
                  >
                    {categoryPieData.map((entry, index) => {
                      const isSelected = filters.category === entry.name;
                      const isAnotherSelected = filters.category !== null && !isSelected;
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLOR_PALETTE.pieColors[index % COLOR_PALETTE.pieColors.length]} 
                          fillOpacity={isAnotherSelected ? 0.25 : 1.0}
                          stroke={isSelected ? "#aa2d00" : "#ffffff"}
                          strokeWidth={isSelected ? 3 : 1}
                          style={{ outline: "none" }}
                          cursor="pointer"
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value}건 (${props.payload.percent}%)`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Elegant Side Legends */}
            <div className="w-2/5 flex flex-col justify-center gap-1.5 text-[9px] font-bold text-slate-600">
              {categoryPieData.map((item, index) => {
                const isSelected = filters.category === item.name;
                return (
                  <div 
                    key={item.name} 
                    onClick={() => handleCategoryClick(item)}
                    className={`flex items-center gap-1.5 truncate p-1 rounded hover:bg-slate-50 cursor-pointer transition-all
                      ${isSelected ? "bg-amber-50/80 text-[#aa2d00] border-l-2 border-[#aa2d00] pl-1.5" : "opacity-80"}`}
                  >
                    <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: COLOR_PALETTE.pieColors[index % COLOR_PALETTE.pieColors.length] }} />
                    <span className="truncate w-full">{item.name} ({item.value}건, {item.percent}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Graph 4: 연면적 vs 공사비 산점도 (공사비 단위 백만 원 변환) */}
        <div 
          onMouseEnter={() => setHoveredChart("gfaScatter")}
          onMouseLeave={() => setHoveredChart(null)}
          className={`bg-white border rounded-xl p-5 shadow-xs transition-all duration-300 flex flex-col justify-between h-[360px]
            ${hoveredChart === "gfaScatter" ? "border-emerald-600 shadow-sm scale-[1.01]" : "border-[#dddddd]"}`}
        >
          <div className="mb-3">
            <h4 className="text-xs font-extrabold text-[#181d26] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-800 p-1 rounded-md"><Activity className="w-3.5 h-3.5" /></span>
                4. 기획 연면적(㎡) 대비 총 공사비(백만원) 상관 산점도
              </span>
              {hasActiveFilters && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">필터 조건 활성 ({scatterPlotData.length}개 표시)</span>}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              활성화된 필터 조건에 부합하는 수집 사례들이 연면적 스케일 대 공사비 가로축에 연동하여 출력됩니다.
            </p>
          </div>
          
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  dataKey="gfa" 
                  name="연면적" 
                  unit="㎡" 
                  stroke={COLOR_PALETTE.slate400} 
                  fontSize={8} 
                  tickLine={false}
                  tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                  domain={[
                    (dataMin) => {
                      const margin = dataMin * 0.15;
                      return Math.max(0, Math.floor(dataMin - margin));
                    },
                    (dataMax) => {
                      const margin = dataMax * 0.1;
                      return Math.ceil(dataMax + margin);
                    }
                  ]}
                />
                <YAxis 
                  type="number" 
                  dataKey="costMillion" 
                  name="공사비" 
                  unit="백만원" 
                  stroke={COLOR_PALETTE.slate400} 
                  fontSize={8} 
                  tickLine={false}
                  tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                  domain={[
                    (dataMin) => {
                      const margin = dataMin * 0.22;
                      return Math.max(0, Math.floor(dataMin - margin));
                    },
                    (dataMax) => {
                      const margin = dataMax * 0.1;
                      return Math.ceil(dataMax + margin);
                    }
                  ]}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-800 p-2 text-white text-[10px] rounded shadow-lg max-w-[200px]">
                           <p className="font-bold truncate text-[#f1f5f9]">{d.name}</p>
                           <p className="mt-1">면적: <strong className="text-amber-300">{d.gfa.toLocaleString()}㎡</strong></p>
                           <p>예산: <strong className="text-emerald-300">{d.costMillion.toLocaleString()} 백만원</strong></p>
                           <p className="text-slate-400">분류: {d.category}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {Object.entries(groupedScatterData).map(([key, data], idx) => (
                  <Scatter
                    key={key}
                    name={key}
                    data={data}
                    fill={COLOR_PALETTE.pieColors[idx % COLOR_PALETTE.pieColors.length]}
                  />
                ))}
                <Legend iconSize={6} iconType="circle" wrapperStyle={{ fontSize: 8 }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 5: 지역별 프로젝트 분포 */}
        <div 
          onMouseEnter={() => setHoveredChart("regionalBar")}
          onMouseLeave={() => setHoveredChart(null)}
          className={`bg-white border rounded-xl p-5 shadow-xs transition-all duration-300 flex flex-col justify-between h-[360px]
            ${hoveredChart === "regionalBar" || filters.region ? "border-sky-500 shadow-sm scale-[1.01]" : "border-[#dddddd]"}`}
        >
          <div className="mb-3">
            <h4 className="text-xs font-extrabold text-[#181d26] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="bg-sky-50 text-sky-700 p-1 rounded-md"><MapPin className="w-3.5 h-3.5" /></span>
                5. 대한민국 권역 지역별 병원 건립 프로젝트 분포
              </span>
              {filters.region && <span className="text-[10px] bg-sky-100 text-sky-700 font-extrabold px-1.5 py-0.5 rounded">필터링 적용: {filters.region}</span>}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              지역 막대를 선택하여 특정 광역시·도 권역의 의료 실적으로 대시보드의 데이터를 정제합니다.
            </p>
          </div>
          
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={regionalDistributionData.slice(0, 8)} 
                margin={{ top: 10, right: 10, bottom: 5, left: -25 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    handleRegionClick(state.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="region" stroke={COLOR_PALETTE.slate400} fontSize={9} tickLine={false} />
                <YAxis stroke={COLOR_PALETTE.slate400} fontSize={9} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="프로젝트수" name="사례 건수" fill={COLOR_PALETTE.secondary} radius={[4, 4, 0, 0]} maxBarSize={35}>
                  {regionalDistributionData.slice(0, 8).map((entry, index) => {
                    const isSelected = filters.region === entry.region;
                    const isAnotherSelected = filters.region !== null && !isSelected;
                    const normalColor = entry.region === "서울" || entry.region === "경기도" ? COLOR_PALETTE.primary : COLOR_PALETTE.secondary;
                    return (
                      <Cell 
                        key={`cell-reg-${index}`} 
                        fill={isSelected ? "#aa2d00" : normalColor} 
                        fillOpacity={isAnotherSelected ? 0.25 : 1.0}
                        stroke={isSelected ? "#181d26" : "none"}
                        strokeWidth={isSelected ? 1.5 : 0}
                        cursor="pointer"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 6: 평당공사비 vs 입면마감재 박스플롯 대용 통계 분포 */}
        <div 
          onMouseEnter={() => setHoveredChart("claddingBox")}
          onMouseLeave={() => setHoveredChart(null)}
          className={`bg-white border rounded-xl p-5 shadow-xs transition-all duration-300 flex flex-col justify-between h-[360px]
            ${hoveredChart === "claddingBox" || filters.cladding ? "border-amber-700 shadow-sm scale-[1.01]" : "border-[#dddddd]"}`}
        >
          <div className="mb-3">
            <h4 className="text-xs font-extrabold text-[#181d26] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="bg-amber-50 text-amber-805 p-1 rounded-md"><Paintbrush className="w-3.5 h-3.5" /></span>
                6. 입면 외장 마감자재별 평당공사비 통계 범위 분포 (BoxPlot 구조)
              </span>
              {filters.cladding && <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded">필터링 적용: {filters.cladding}</span>}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              마감자재 상자를 클릭하면 해당 구체적 입면 구조를 차용하는 실적 데이터로 통합 고시됩니다.
            </p>
          </div>
          
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={claddingCostData} 
                margin={{ top: 10, right: 10, bottom: 5, left: -25 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    handleCladdingClick(state.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="material" stroke={COLOR_PALETTE.slate400} fontSize={9} tickLine={false} />
                <YAxis stroke={COLOR_PALETTE.slate400} fontSize={9} tickLine={false} unit="M" />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      if (d.avg === 0) {
                        return (
                          <div className="bg-slate-900 border border-slate-800 p-2 text-white text-[10px] rounded shadow-lg">
                            <p className="font-bold">{d.material}</p>
                            <p className="text-red-300">현재 조건 하에 매칭 실적 없음</p>
                          </div>
                        );
                      }
                      return (
                        <div className="bg-slate-900 border border-slate-800 p-2 text-white text-[10px] rounded shadow-lg">
                          <p className="font-bold border-b border-slate-700 pb-1 mb-1">{d.material}</p>
                          <p>최소 평당단가: {d.min} 백만원/py</p>
                          <p>50% 주류구간 [Q1, Q3]: {d.boxSpread[0]} ~ {d.boxSpread[1]} 백만원/py</p>
                          <p className="text-emerald-300 font-bold">평균 집단치 (Mean): {d.avg} 백만원/py</p>
                          <p>최대 평당단가: {d.max} 백만원/py</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* 1. Bar representing the central 50% spread of the box plot (Q1 to Q3) */}
                <Bar 
                  dataKey="boxSpread" 
                  name="50% 주류구간 (Q1-Q3)" 
                  maxBarSize={30} 
                >
                  {claddingCostData.map((entry, index) => {
                    const isSelected = filters.cladding === entry.material;
                    const isAnotherSelected = filters.cladding !== null && !isSelected;
                    return (
                      <Cell 
                        key={`cell-clad-${index}`}
                        fill={COLOR_PALETTE.primary}
                        fillOpacity={isAnotherSelected ? 0.25 : 0.65}
                        stroke={isSelected ? "#181d26" : COLOR_PALETTE.primary}
                        strokeWidth={isSelected ? 1.5 : 1}
                        cursor="pointer"
                      />
                    );
                  })}
                </Bar>
                
                {/* 2. Line representing the exact Average mean core (Mean) */}
                <Line 
                  type="monotone" 
                  dataKey="avg" 
                  name="그룹별 평균 단가" 
                  stroke={COLOR_PALETTE.secondary} 
                  strokeWidth={2} 
                  dot={{ r: 4, stroke: "#ffffff", strokeWidth: 1.5, fill: COLOR_PALETTE.secondary }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-[8px] text-slate-400 text-left border-t border-slate-50 pt-1.5 flex justify-between select-none">
            <span>• 유닛커튼월 이 외벽 자재 대비 단가 진폭 및 최소/최대 분포 높음</span>
            <span>• 드라이비트 공정은 비교적 저난도의 합리적 단가에 형성</span>
          </div>
        </div>

      </div>

    </div>
  );
}
