/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { CaseRecord } from "../types";
import { useFilters } from "../context/FilterContext";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  Legend
} from "recharts";
import { BarChart3, LineChart as LineIcon, Activity, Sliders, X } from "lucide-react";

interface ChartsViewProps {
  cases: CaseRecord[];
}

export default function ChartsView({ cases }: ChartsViewProps) {
  const [activeTab, setActiveTab] = useState<"scatter" | "trend" | "regional" | "category">("scatter");
  const { selectedCompany, setSelectedCompany, clearFilters } = useFilters();

  // Filter cases by selectedCompany globally if selectedCompany exists
  const filteredCases = useMemo(() => {
    if (!selectedCompany) return cases;
    const cleanFilter = selectedCompany.replace(/사$/, "").trim().toUpperCase();
    return cases.filter(c => (c.designer || "").trim().toUpperCase() === cleanFilter);
  }, [cases, selectedCompany]);

  // 1. Data Prep: Scatter Plot (GFA vs Bed Count)
  const scatterData = useMemo(() => {
    return filteredCases
      .filter(c => c.beds > 0 && c.gfa > 0)
      .map(c => ({
        name: c.projectName,
        beds: c.beds,
        gfa: Math.round(c.gfa),
        cost: c.constructionCost || 0,
        category: c.category,
        perPyung: c.perPyungCost
      }));
  }, [filteredCases]);

  // 2. Data Prep: Trend Line (Avg Cost per Pyung over Design Year)
  const trendData = useMemo(() => {
    const yearsGrouped: Record<number, { sumCost: number; sumPyung: number; count: number }> = {};
    filteredCases.forEach(c => {
      if (!c.designYear || c.designYear < 2000) return;
      if (!yearsGrouped[c.designYear]) {
        yearsGrouped[c.designYear] = { sumCost: 0, sumPyung: 0, count: 0 };
      }
      if (c.perPyungCost > 0) {
        yearsGrouped[c.designYear].sumPyung += c.perPyungCost;
        yearsGrouped[c.designYear].sumCost += c.constructionCost;
        yearsGrouped[c.designYear].count += 1;
      }
    });

    return Object.entries(yearsGrouped)
      .map(([year, info]) => ({
        year: parseInt(year),
        avgPerPyung: info.count > 0 ? parseFloat((info.sumPyung / info.count).toFixed(2)) : 0,
        avgCost: info.count > 0 ? parseFloat((info.sumCost / info.count).toFixed(1)) : 0
      }))
      .sort((a, b) => a.year - b.year);
  }, [filteredCases]);

  // 3. Data Prep: Regional bar chart (Grouped by major metropolitan boundary)
  const regionalData = useMemo(() => {
    const regionGroup: Record<string, number> = {};
    filteredCases.forEach(c => {
      let simpleLoc = "전국";
      if (c.location.includes("서울")) simpleLoc = "서울";
      else if (c.location.includes("경기") || c.location.includes("인천")) simpleLoc = "경기/인천";
      else if (c.location.includes("대구") || c.location.includes("경북") || c.location.includes("경남") || c.location.includes("부산") || c.location.includes("울산")) simpleLoc = "영남권 (대구/부산/경남)";
      else if (c.location.includes("전남") || c.location.includes("전북") || c.location.includes("광주")) simpleLoc = "호남권 (광주/전라)";
      else if (c.location.includes("충남") || c.location.includes("충북") || c.location.includes("대전") || c.location.includes("세종")) simpleLoc = "충청권 (대전/충청)";
      else if (c.location.includes("제주")) simpleLoc = "제주권";
      else if (c.location.includes("강원")) simpleLoc = "강원권";

      regionGroup[simpleLoc] = (regionGroup[simpleLoc] || 0) + 1;
    });

    return Object.entries(regionGroup)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredCases]);

  // 4. Data Prep: Use-Case Category analysis chart
  const categoryChartData = useMemo(() => {
    const categoryGroup: Record<string, { count: number; sumPyung: number; validPyungCount: number }> = {};
    filteredCases.forEach(c => {
      const cat = c.category || "기타의료";
      if (!categoryGroup[cat]) {
        categoryGroup[cat] = { count: 0, sumPyung: 0, validPyungCount: 0 };
      }
      categoryGroup[cat].count += 1;
      if (c.perPyungCost > 0) {
        categoryGroup[cat].sumPyung += c.perPyungCost;
        categoryGroup[cat].validPyungCount += 1;
      }
    });

    return Object.entries(categoryGroup)
      .map(([category, info]) => ({
        category,
        count: info.count,
        avgPerPyung: info.validPyungCount > 0 ? parseFloat((info.sumPyung / info.validPyungCount).toFixed(1)) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredCases]);

  // Custom tooltips (highly polished)
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg shadow-xl text-white text-xs max-w-sm">
          <p className="font-bold text-slate-100 mb-1">{data.name}</p>
          <div className="space-y-0.5 text-slate-300">
            <p>의료분류: <span className="text-indigo-300 font-medium">{data.category}</span></p>
            <p>규모: <span className="text-amber-300 font-medium">{data.beds} 병상</span></p>
            <p>연면적: <span className="text-emerald-300 font-medium">{data.gfa.toLocaleString()} m²</span></p>
            <p>평당공사비: <span className="text-rose-300 font-medium">{data.perPyung.toFixed(2)} 백만원/py</span></p>
            <p>총 공사비: <span className="text-yellow-300 font-bold">{data.cost ? `${data.cost}억원` : "정보없음"}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTrendTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg shadow-xl text-white text-xs">
          <p className="font-bold text-slate-100 mb-1">{data.year}년 설계 사업</p>
          <p className="text-emerald-300">평균 평당비: <span className="font-semibold text-slate-200">{data.avgPerPyung} 백만원 / py</span></p>
          <p className="text-amber-300">평균 공사비: <span className="font-semibold text-slate-200">{data.avgCost} 억원</span></p>
        </div>
      );
    }
    return null;
  };

  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg shadow-xl text-white text-xs">
          <p className="font-bold text-slate-100 mb-1">{data.category}</p>
          <p className="text-emerald-300">평균 평당비: <span className="font-semibold text-slate-200">{data.avgPerPyung} 백만원 / py</span></p>
          <p className="text-[#fcab79]">수집 사례수: <span className="font-semibold text-slate-200">{data.count} 건</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 h-[520px] flex flex-col select-none shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
      {selectedCompany && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 mb-4 flex items-center justify-between text-xs text-indigo-950 animate-fadeIn shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white font-bold py-0.5 px-2 rounded-lg text-[10px]">
              필터 활성화
            </span>
            <span>선택된 설계사: <strong>{selectedCompany}사</strong> 실적 필터링 중 (총 {filteredCases.length}개 사례 자동 연동)</span>
          </div>
          <button 
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer border border-rose-200/50 hover:bg-rose-50 px-2.5 py-1 rounded-lg"
          >
            필터 해제 <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-700 stroke-[2.5]" />
            유사사례 입체 분석 차트
          </h3>
          <p className="text-xs text-slate-700 font-medium mt-0.5">인허가 스케일과 기획 연면적 및 연도별 건축비 단가 분포를 탐색합니다.</p>
        </div>

        {/* Tab Selection buttons with high visibility */}
        <div className="flex bg-slate-100 border-none rounded-xl p-1.5 shadow-inner text-xs text-slate-800 font-bold select-none whitespace-nowrap overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("scatter")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${activeTab === "scatter" ? "bg-indigo-650 text-white shadow-xs font-black" : "text-slate-800 hover:text-slate-950 hover:bg-slate-300"}`}
          >
            면적-병상 상관도
          </button>
          <button
            onClick={() => setActiveTab("trend")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${activeTab === "trend" ? "bg-indigo-650 text-white shadow-xs font-black" : "text-slate-800 hover:text-slate-950 hover:bg-slate-300"}`}
          >
            연도별 공사비추이
          </button>
          <button
            onClick={() => setActiveTab("regional")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${activeTab === "regional" ? "bg-indigo-650 text-white shadow-xs font-black" : "text-slate-800 hover:text-slate-950 hover:bg-slate-300"}`}
          >
            권역별 분포현황
          </button>
          <button
            onClick={() => setActiveTab("category")}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${activeTab === "category" ? "bg-indigo-650 text-white shadow-xs font-black" : "text-slate-800 hover:text-slate-950 hover:bg-slate-300"}`}
          >
            용도분류별 평당비용
          </button>
        </div>
      </div>

      {/* Simplified Highlight Explanation for Non-Technical Users */}
      {activeTab === "scatter" && (
        <div className="bg-[#fefaf2] border border-[#f3e3ca] rounded-lg p-3 mb-3 text-xs text-[#333840] leading-relaxed animate-fadeIn">
          <div className="flex items-center gap-1.5 font-semibold text-[#181d26] mb-1">
            <span className="text-[#aa2d00]">💡 한눈에 보는 요약:</span>
            <span>병원 규모(병상수)가 커질수록 필요한 건물 면적도 함께 증가해요!</span>
          </div>
          <p className="text-slate-600">
            주로 종합병원(<span className="text-[#aa2d00] font-bold">빨간색 점</span>)은 응급전용 수술동과 필수 설비로 인해 일반 의원이나 요양병원(<span className="text-slate-500 font-bold">짙은 회색 점</span>) 대비 <strong>같은 병상수 대비 2~3배 넓은 연면적</strong>을 차지하는 경향이 뚜렷합니다.
          </p>
        </div>
      )}

      {activeTab === "trend" && (
        <div className="bg-[#fefaf2] border border-[#f3e3ca] rounded-lg p-3 mb-3 text-xs text-[#333840] leading-relaxed animate-fadeIn">
          <div className="flex items-center gap-1.5 font-semibold text-[#181d26] mb-1">
            <span className="text-[#aa2d00]">💡 한눈에 보는 요약:</span>
            <span>원자재 가격과 인건비가 올라 평당 건축비가 계속 우상향하고 있어요!</span>
          </div>
          <p className="text-slate-600">
            시간이 지날수록 글로벌 자재 충격과 시공 노무비 상향으로 인해 <span className="text-[#aa2d00] font-bold">평당 실제 공사비(빨간색 실선)가 계속 가파르게 오르는 것</span>을 보여줍니다. 이에 따라 최근 기안되는 사업들은 과거보다 예산 책정에 주의해야 합니다.
          </p>
        </div>
      )}

      {activeTab === "regional" && (
        <div className="bg-[#fefaf2] border border-[#f3e3ca] rounded-lg p-3 mb-3 text-xs text-[#333840] leading-relaxed animate-fadeIn">
          <div className="flex items-center gap-1.5 font-semibold text-[#181d26] mb-1">
            <span className="text-[#aa2d00]">💡 한눈에 보는 요약:</span>
            <span>주요 유사 사례의 절반 이상이 서울과 수도권에 집중되어 있어요!</span>
          </div>
          <p className="text-slate-600">
            전국 116개 건립 사례 중 <strong>서울 및 경기/인천 수도권 지역 비중이 절대다수</strong>를 차지합니다. 지방 거점 의료원 설립 계획 대비 수도권 집중 현상이 데이터를 통해 뚜렷하게 입증되고 있습니다.
          </p>
        </div>
      )}

      {activeTab === "category" && (
        <div className="bg-[#fefaf2] border border-[#f3e3ca] rounded-lg p-3 mb-3 text-xs text-[#333840] leading-relaxed animate-fadeIn">
          <div className="flex items-center gap-1.5 font-semibold text-[#181d26] mb-1">
            <span className="text-[#aa2d00]">💡 한눈에 보는 요약:</span>
            <span>의료 성격과 필수 설비에 따라 평당 공사비 차이가 큽니다!</span>
          </div>
          <p className="text-slate-600">
            중환자실과 무균실 등 설비 복잡도가 매우 높은 <strong>종합 임상용도의 평균 평당 단가</strong>가 일반 요양병원 및 건강검진 위주의 1차 복합시설 및 기타의료시설보다 <strong>평균 30~55% 이상 월등히 비싸게 형성</strong>됩니다.
          </p>
        </div>
      )}

      {/* Chart Render Canvas */}
      <div className="flex-1 min-h-0 relative flex justify-center items-center">
        {activeTab === "scatter" && (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                dataKey="beds" 
                name="병상수" 
                unit="병상" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false}
              />
              <YAxis 
                type="number" 
                dataKey="gfa" 
                name="연면적" 
                unit="㎡" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false}
                tickFormatter={(val) => `${Math.round(val / 1000)}k`}
              />
              <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="의료기관사례" data={scatterData} fill="#aa2d00">
                {scatterData.map((entry, index) => {
                  let fillColor = "#6366f1"; // default high-contrast indigo
                  if (entry.category.includes("종합")) fillColor = "#aa2d00"; // Crimson Red
                  else if (entry.category.includes("전문")) fillColor = "#0284c7"; // Sky Blue
                  else if (entry.category.includes("요양")) fillColor = "#0d9488"; // Deep Teal
                  return <Cell key={`cell-${index}`} fill={fillColor} fillOpacity={0.8} stroke={fillColor} strokeWidth={1.5} />;// increased opacity and stroke width for much higher visibility
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}

        {activeTab === "trend" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="year" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                stroke="#aa2d00" 
                fontSize={10} 
                tickLine={false}
                label={{ value: '평당 비용(백만/py)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#aa2d00', fontSize: 10 } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#181d26" 
                fontSize={10} 
                tickLine={false}
                label={{ value: '평균 사업공사비(억)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#181d26', fontSize: 10 } }}
              />
              <Tooltip content={<CustomTrendTooltip />} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="avgPerPyung" 
                stroke="#aa2d00" 
                strokeWidth={3} 
                activeDot={{ r: 6 }} 
                name="평당 건축단가"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgCost" 
                stroke="#181d26" 
                strokeWidth={2} 
                strokeDasharray="4 4" 
                name="평균 사업 공사비"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === "regional" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionalData} margin={{ top: 20, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="region" 
                stroke="#94a3b8" 
                fontSize={9} 
                tickLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
              />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill="#181d26" radius={[4, 4, 0, 0]} maxBarSize={45}>
                {regionalData.map((entry, index) => {
                  const colors = ["#aa2d00", "#1e3a8a", "#0284c7", "#4f46e5", "#0d9488", "#475569"];
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === "category" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 20, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="category" 
                stroke="#94a3b8" 
                fontSize={9} 
                tickLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
              />
              <Tooltip content={<CustomCategoryTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="avgPerPyung" fill="#181d26" radius={[4, 4, 0, 0]} maxBarSize={45}>
                {categoryChartData.map((entry, index) => {
                  const colors = ["#aa2d00", "#1e3a8a", "#0284c7", "#4f46e5", "#0d9488", "#475569"];
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend and Note */}
      <div className="mt-3 text-[10px] text-slate-400 border-t border-slate-100 pt-2.5 flex items-center justify-between">
        <p className="flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          {activeTab === "scatter" && "도트 색상 분류상 빨강은 '종합병원', 노랑은 '전문병원', 초록은 '기타/요양병원'입니다."}
          {activeTab === "trend" && "연도별 평당공사비(평균치)는 인력/자재 수급 충격에 따른 우상향 경향을 뚜렷이 나타냅니다."}
          {activeTab === "regional" && "서울/경기 수도권 중심 병원 건립 프로젝트의 지역적 집중도를 계량 평가할 수 있습니다."}
          {activeTab === "category" && "의료 고유용도 기능분류별 평균 평당 건설단가비를 계량하여 예산 효율성을 다각도로 검토합니다."}
        </p>
      </div>
    </div>
  );
}
