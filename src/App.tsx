/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { CaseRecord, SimulationInput } from "./types";
import StatsCards from "./components/StatsCards";
import KoreaMap from "./components/KoreaMap";
import ChartsView from "./components/ChartsView";
import SmartSearchBoard from "./components/SmartSearchBoard";
import StatisticalReport from "./components/StatisticalReport";
import { 
  RefreshCw, 
  MapPin, 
  Sparkles, 
  Building, 
  AlertTriangle, 
  ArrowRight, 
  Compass, 
  Database,
  Building2,
  ListFilter,
  CheckCircle,
  HelpCircle,
  Sliders,
  TrendingUp,
  Award
} from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [similarCases, setSimilarCases] = useState<CaseRecord[]>([]);
  const [searchMode, setSearchMode] = useState<"matching" | "general" | "gis">("matching");
  const [activeMainTab, setActiveMainTab] = useState<"dashboard" | "report">("dashboard");
  const [viewStep, setViewStep] = useState<"landing" | "choice" | "workspace">("landing");

  // Fetch all cases from full-stack API on startup
  const fetchCasesData = async (isRefetch = false) => {
    if (isRefetch) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch("/api/cases");
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        setCases(result.data);
        // Highlight the first case as default
        setSelectedCase(result.data[0]);
        setError("");
      } else {
        setError(result.error || "데이터베이스 로드 중 응답 데이터가 비어있습니다.");
      }
    } catch (e: any) {
      setError(`서버 연결 오류: ${e.message || "연결할 수 없습니다."}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCasesData();
  }, []);

  // Trigger manual sync or remote spreadsheet query
  const handleRefetchDatabase = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/cases/refetch", { method: "POST" });
      const result = await response.json();
      if (result.success) {
        await fetchCasesData(true);
      } else {
        alert("시트 동기화 실패: " + result.error);
      }
    } catch (e: any) {
      alert("시트 통신 에러: " + e.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Called when simulation runs successfully, updates mapped highlighted nearest points
  const handleSimulationRun = (input: SimulationInput, matches: CaseRecord[]) => {
    setSimilarCases(matches);
    if (matches.length > 0) {
      // Focus map coordinate to the most similar case
      setSelectedCase(matches[0]);
    }
  };

  // Click on dots or grid rows focuses on a target record and scrolls slightly if needed
  const handleSelectCase = (record: CaseRecord) => {
    setSelectedCase(record);
    const rowElement = document.getElementById(`row-${record.id}`);
    if (rowElement) {
      rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-slate-500 font-sans">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-indigo-650 animate-spin" />
          <div className="text-center">
            <h2 className="text-sm font-bold text-slate-800">실시간 공개 시트 연동 중...</h2>
            <p className="text-xs text-slate-400 mt-1">RAW DATA 시트의 의료기관 건립 사례 116건을 정밀 로딩 및 구조화하고 있습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-slate-500 font-sans">
        <div className="max-w-md bg-white border border-rose-100 rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-3" />
          <h2 className="text-base font-bold text-slate-800">데이터베이스 로드 중 오류 발생</h2>
          <p className="text-xs text-rose-600 mt-1 bg-rose-50/50 p-2.5 rounded border border-rose-50 max-w-sm font-mono overflow-x-auto text-left">
            {error}
          </p>
          <button
            onClick={() => fetchCasesData()}
            className="mt-5 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors"
          >
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  // Render Step 1: Landing Page
  if (viewStep === "landing") {
    return (
      <div className="min-h-screen bg-white text-apple-ink font-sans flex flex-col antialiased justify-between relative overflow-hidden">
        {/* Soft elegant dot grid for a hint of detail */}
        <div className="absolute top-0 left-0 w-full sm:w-[50%] h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40 select-none [mask-image:linear-gradient(to_right,white_80%,transparent)]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-apple-parchment rounded-full filter blur-[120px] pointer-events-none opacity-40 select-none" />

        {/* Apple global-nav Chassis */}
        <header className="h-[44px] bg-apple-black text-white/80 select-none z-10 relative flex justify-between items-center px-4 sm:px-8 text-xs font-normal border-b border-white/5 font-sans">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-white/10 hover:bg-white/20 rounded-[4px] flex items-center justify-center text-white text-[9px] font-black tracking-widest transition-colors">H</span>
            <span className="text-[11px] font-semibold text-white uppercase tracking-wider">HEALTH SEARCH</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-[11px] text-white/60">
            <span className="hover:text-white transition-colors cursor-pointer">건립사례 DB (116개소)</span>
            <span className="hover:text-white transition-colors cursor-pointer">가중치 유사 매칭</span>
            <span className="hover:text-white transition-colors cursor-pointer">전국 GIS 입지 지도</span>
            <span className="hover:text-white transition-colors cursor-pointer">심층 통계 보고서</span>
          </div>
          <span className="text-[10px] font-mono tracking-wider font-semibold text-white/40">BUILD V3.2</span>
        </header>

        {/* Landing Split Workspace (Title section / Animated Mockup Card Section) */}
        <main className="flex-grow flex items-center justify-center py-12 lg:py-20 px-6 sm:px-12 z-10 relative max-w-7xl mx-auto w-full">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left side column: Confident but quiet typography & taglines */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-7 space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start"
            >
              {/* Product tag with Action Blue accent */}
              <div className="inline-flex items-center gap-1.5 bg-apple-parchment px-3 py-1 rounded-full border border-apple-border shadow-3xs select-none">
                <span className="w-1.5 h-1.5 bg-apple-blue rounded-full animate-pulse" />
                <span className="text-[10px] font-semibold tracking-wider text-apple-blue uppercase">
                  Analytical Medical GIS Workspace
                </span>
              </div>
 
              {/* Title & Signature subtitle */}
              <div className="space-y-4">
                <div className="relative inline-block">
                  {/* Faint elegant design paint wash effect background behind title */}
                  <svg className="absolute -bottom-1 left-[-4%] w-[108%] h-10 text-apple-blue/5 opacity-50 -z-15 select-none pointer-events-none" viewBox="0 0 350 30" fill="currentColor">
                    <path d="M5,15 C45,13 130,5 210,8 C245,9.5 315,18 340,16 C305,12 185,13 125,15 C65,17 18,19 5,15 Z" />
                  </svg>
                  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-semibold tracking-[-0.025em] leading-[1.07] text-apple-ink pb-2">
                    <span style={{ color: "#f4b000" }} className="inline-block text-[1.12em] font-black pr-1 tracking-tight">“PICK”</span> <span className="text-[0.75em] font-medium text-slate-800">your Proj</span>
                  </h1>
                </div>

                <p className="text-apple-ink text-xl sm:text-2xl font-light leading-relaxed tracking-tight">
                  감이 아닌, <span className="text-apple-blue font-semibold border-b-[2px] border-apple-blue/20 pb-0.5">데이터로 최적의 유사사례</span>를 찾아보세요.
                </p>
              </div>

              {/* Core System Description text */}
              <p className="text-slate-600 text-sm max-w-xl leading-relaxed tracking-tight font-medium">
                본 플랫폼은 실시간 구글 스프레드시트와 연계된 전국 <span className="font-semibold text-apple-ink border-b border-apple-hairline">116개 의료기관 수립 사업 지표</span>를
                <br />
                참조하여, 초기 기획안 사양값을 실시간 점수화 매칭하는 지능형 모의 실행 대시보드입니다.
              </p>

              {/* Action Blue CTA button-primary */}
              <div className="pt-2 z-20">
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "#0055b3" }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ 
                    y: {
                      repeat: Infinity,
                      duration: 2.2,
                      ease: "easeInOut"
                    }
                  }}
                  onClick={() => setViewStep("choice")}
                  className="px-8 py-3.5 bg-apple-blue text-white text-sm sm:text-base font-semibold rounded-full shadow-md transition-all flex items-center justify-center gap-2 hover:shadow-lg cursor-pointer border border-apple-blue/10 tracking-tight"
                >
                  <span>유사사례 검색 시작하기</span>
                  <ArrowRight className="w-4 h-4 text-white/90" />
                </motion.button>
              </div>

              {/* Key system credentials columns (Centered, aligned, beautifully styled) */}
              <div className="pt-8 border-t border-apple-hairline w-full max-w-md grid grid-cols-3 gap-4 text-center select-none text-slate-500 font-sans">
                <div className="flex flex-col items-center text-center">
                  <span className="text-[9px] font-semibold text-slate-400 block tracking-wider uppercase text-center w-full">Connected Database</span>
                  <p className="font-semibold text-[11px] text-apple-ink mt-1 lg:mt-1.5 text-center leading-[15px] whitespace-nowrap">116개 전국 사업 지표</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-[9px] font-semibold text-slate-400 block tracking-wider uppercase text-center w-full">Grid Parameters</span>
                  <p className="font-semibold text-[11px] text-apple-ink mt-1 lg:mt-1.5 text-center leading-[15px] whitespace-nowrap">12가지 검색 필터</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-[9px] font-semibold text-slate-400 block tracking-wider uppercase text-center w-full">Matching Engine</span>
                  <p className="font-semibold text-[11px] text-apple-ink mt-1 lg:mt-1.5 text-center leading-[15px] whitespace-nowrap">유사점수 산출 알고리즘 탑재</p>
                </div>
              </div>
            </motion.div>

            {/* Right side column: Premium simulated case study mockup card with the exact product-shadow and rounded-lg (18px) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.97, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
              className="lg:col-span-5 flex justify-center w-full z-15 relative px-4 sm:px-0"
            >
              {/* Stacked Cards Wrapper around the active fanned desk */}
              <div className="relative w-full max-w-[380px] select-none">
                
                {/* Background Card 1 (Fanned Out Left - Deepest Layer) */}
                <div 
                  className="absolute inset-0 bg-slate-50 border border-slate-200/50 shadow-xs rounded-[18px] p-6 select-none pointer-events-none transition-all duration-500"
                  style={{ 
                    transform: "rotate(-12deg) translateX(-55px) translateY(12px) scale(0.96)",
                    zIndex: 1,
                    boxShadow: "0 4px 20px -2px rgba(0,0,0,0.04)"
                  }}
                >
                  <div className="w-16 h-3 bg-slate-200/50 rounded-xs mb-3" />
                  <div className="w-24 h-4 bg-slate-200/30 rounded-xs mb-4" />
                  <div className="w-full h-1/2 bg-slate-50 border border-slate-100 rounded-lg opacity-40 mb-3" />
                  <div className="w-full h-1.5 bg-slate-200/30 rounded-xs mb-1.5" />
                  <div className="w-2/3 h-1.5 bg-slate-200/30 rounded-xs" />
                </div>

                {/* Background Card 2 (Fanned Out Right - Mid Layer) */}
                <div 
                  className="absolute inset-0 bg-white border border-slate-200 shadow-sm rounded-[18px] p-6 select-none pointer-events-none transition-all duration-500"
                  style={{ 
                    transform: "rotate(10deg) translateX(50px) translateY(8px) scale(0.97)",
                    zIndex: 2,
                    boxShadow: "0 8px 30px -4px rgba(0,0,0,0.05)"
                  }}
                >
                  <div className="w-20 h-3 bg-slate-200/60 rounded-xs mb-3" />
                  <div className="w-28 h-4 bg-slate-200/40 rounded-xs mb-4" />
                  <div className="w-full h-1/2 bg-slate-50 border border-slate-100 rounded-lg opacity-60 mb-3" />
                  <div className="w-full h-1.5 bg-slate-200/40 rounded-xs mb-1.5" />
                  <div className="w-2/3 h-1.5 bg-slate-200/40 rounded-xs" />
                </div>

                {/* Main Card (Top-most card, interactive, straight) */}
                <div 
                  className="bg-white border border-apple-hairline shadow-apple-product rounded-[18px] p-6 sm:p-7 w-full space-y-6 relative select-none hover:shadow-2xl transition-all duration-300"
                  style={{ zIndex: 10, position: "relative" }}
                >
                  
                  {/* Mac window button indicators */}
                  <div className="flex gap-1.5 absolute top-4 right-5 z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                  </div>

                  {/* Sub title / Type labels */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-semibold text-slate-400 tracking-wider block uppercase">
                      Simulated Project Case Study
                    </span>
                    <h3 className="text-xl sm:text-2xl font-semibold text-apple-ink tracking-tight">
                      경상남도 서부의료원
                    </h3>
                  </div>

                  {/* Info and mini MAP */}
                  <div className="grid grid-cols-12 gap-2 pt-1">
                    <div className="col-span-7 space-y-3 text-xs flex flex-col justify-center">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 block font-semibold leading-none">모역 위치</span>
                        <p className="text-apple-ink font-semibold text-[11px] flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-apple-blue" /> 경상남도 남해권역
                        </p>
                      </div>
                      <div className="space-y-0.5 flex flex-col justify-center">
                        <span className="text-[9px] text-slate-400 block font-semibold leading-none">핵심 사업</span>
                        <p className="text-slate-600 font-semibold text-[10px] leading-snug mt-1">
                          감염병대응 내·외과 5개실 운영
                        </p>
                      </div>
                    </div>

                    {/* Symmetrical South Korea Miniature illustration */}
                    <div className="col-span-5 flex justify-end items-center pr-1">
                      <div className="relative p-2 bg-apple-parchment border border-apple-border rounded-xl">
                        <svg viewBox="0 0 100 130" className="w-[66px] h-[88px] opacity-95">
                          <path d="M48,5 C55,10 58,16 63,20 C66,23 70,26 71,32 C73,36 74,40 72,46 C70,52 74,58 76,64 C78,70 77,76 74,80 C71,84 66,87 60,89 C55,91 51,95 46,98 C41,101 38,105 39,109 C36,110 34,104 32,99 C30,94 26,92 22,88 C18,84 16,79 16,73 C16,67 17,62 15,58 C13,54 12,49 14,43 C16,37 20,33 21,26 C22,19 25,14 29,10 C33,6 39,2 48,5 Z" fill="#e9eff6" stroke="#cdd8e4" strokeWidth="1" strokeLinejoin="round" />
                          <ellipse cx="32" cy="116" rx="6" ry="3.5" fill="#e9eff6" stroke="#cdd8e4" strokeWidth="1" />
                          <g transform="translate(56, 84)">
                            <circle cx="0" cy="0" r="10" fill="#0066cc" className="opacity-25 animate-pulse" />
                            <circle cx="0" cy="0" r="4" fill="#0066cc" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Similarity Score Radial Display */}
                  <div className="border-t border-apple-divider pt-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-semibold text-slate-400 block pb-0.5">유사도 환산 결과</span>
                      <p className="text-xs text-apple-ink font-semibold leading-normal">
                        매칭점수 <span className="text-apple-blue font-semibold underline decoration-wavy decoration-apple-blue/20">92.8점</span> 도출<br />
                        <span className="text-[10px] text-slate-400 font-normal">(상위 3순위 유사사례 자동 정합)</span>
                      </p>
                    </div>

                    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 36 36" className="w-14 h-14 transform -rotate-90">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#0066cc" strokeWidth="3.5" strokeDasharray="92.8, 100" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-mono font-semibold text-apple-ink">
                        92.8%
                      </div>
                    </div>
                  </div>

                  {/* Similarity Chart Bars */}
                  <div className="border-t border-apple-divider pt-4 space-y-2.5 font-sans">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                      <span>유사도 검증</span>
                      <span>1위  |  2위  |  3위  |  4위</span>
                    </div>
                    
                    <div className="h-14 flex items-end justify-between px-4 pt-2 bg-apple-parchment rounded-xl border border-apple-border/40">
                      <div className="flex flex-col items-center w-6">
                        <div className="w-3 bg-apple-blue rounded-t-xs h-10 shadow-xs" title="1위: 92.8%"></div>
                      </div>
                      <div className="flex flex-col items-center w-6">
                        <div className="w-3 bg-slate-400 rounded-t-xs h-8 shadow-xs" title="2위: 83.1%"></div>
                      </div>
                      <div className="flex flex-col items-center w-6">
                        <div className="w-3 bg-slate-300 rounded-t-xs h-6 shadow-xs" title="3위: 71.4%"></div>
                      </div>
                      <div className="flex flex-col items-center w-6">
                        <div className="w-3 bg-slate-200 rounded-t-xs h-3.5" title="4위: 48.0%"></div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Metadata Indicators */}
                  <div className="flex items-center justify-between text-[9px] text-slate-450 font-mono font-semibold border-t border-apple-divider pt-3 select-none">
                    <span className="flex items-center gap-1">🟢 MO (계획 연면적)</span>
                    <span className="flex items-center gap-1">🔵 2FB (가용 병상)</span>
                    <span className="flex items-center gap-1 font-mono">🟡 GFD (공사원가)</span>
                  </div>

                </div>
              </div>
            </motion.div>

          </div>
        </main>

        {/* Apple style footer */}
        <footer className="bg-apple-parchment border-t border-apple-hairline py-8 px-6 text-center text-[11px] text-slate-500 select-none z-10 relative">
          <p>© 2026 HEALTH SEARCH Co., Ltd. Crafted with Haas Grotesk Digital Dialect & Minimalist Aesthetic.</p>
        </footer>
      </div>
    );
  }

  // Render Step 2: Path Choice Selector View
  if (viewStep === "choice") {
    return (
      <div className="min-h-screen bg-apple-parchment text-apple-ink font-sans flex flex-col antialiased justify-between">
        <header className="px-8 py-[13px] h-[52px] bg-white/80 border-b border-apple-hairline backdrop-blur-md select-none flex justify-between items-center sticky top-0 z-50">
          <button 
            onClick={() => setViewStep("landing")}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-apple-blue font-medium cursor-pointer transition-colors"
          >
            ← 홈으로 돌아가기
          </button>
          <span className="text-[10px] font-semibold text-apple-blue tracking-wider bg-apple-blue/5 px-2.5 py-1 rounded-full uppercase">Path Selector</span>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center py-16 px-6 max-w-6xl mx-auto w-full space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3 max-w-2xl pb-2"
          >
            <span className="text-[10px] font-semibold text-apple-blue tracking-wider uppercase bg-apple-blue/10 px-3 py-1 rounded-full inline-block mb-4">
              Select Analytical Pathway
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-tight font-sans leading-tight">
              원하시는 탐색 경로를 지정해주십시오
            </h2>
            <p className="text-slate-550 text-base leading-relaxed font-sans">
              분석 의도에 따라 신속 기획안 가중치 유사 매칭 방식 혹은
              <br />
              다변수 정량 상세 조건 검색 경로를 유연하게 선택할 수 있습니다.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 w-full max-w-4xl px-4 sm:px-6">
            
            {/* Card 1: 신규 PROJ 매칭사례 찾기 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ 
                scale: 1.01,
                boxShadow: "rgba(0, 0, 0, 0.12) 3px 5px 30px" 
              }}
              onClick={() => {
                setSearchMode("matching");
                setViewStep("workspace");
              }}
              className="bg-white border text-left border-apple-hairline rounded-[18px] p-6 sm:p-8 cursor-pointer group transition-all flex flex-col justify-between space-y-6 relative overflow-hidden"
            >
              <div className="space-y-5 relative z-10">
                <div className="w-full h-40 rounded-xl overflow-hidden border border-apple-divider shadow-inner relative group-hover:scale-[1.01] transition-transform duration-500 select-none">
                  <img 
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80" 
                    alt="Modern Volumetric Architectural Design Case Study" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover brightness-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-1.5 bg-white/95 py-0.5 px-2.5 rounded-full border border-apple-border shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-apple-blue" />
                    <span className="text-[10px] font-semibold text-slate-700">신속 가중치 알고리즘</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-apple-ink group-hover:text-apple-blue transition-colors font-sans tracking-tight">
                    신규 PROJ 매칭사례 찾기
                  </h3>
                  <div className="inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full bg-apple-blue/5 border border-apple-blue/10">
                    <span className="w-1.5 h-1.5 bg-apple-blue rounded-full animate-pulse" />
                    <span className="text-[9px] text-apple-blue font-semibold tracking-wider uppercase">
                      유사사례 TOP 3 산출 모델
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed font-sans pt-1">
                    기획 중인 프로젝트 사양(연면적, 병상수, 사업비 등 12개 핵심 지표)을 기반으로 전국 국가의료 데이터베이스에서 유사도가 가장 높은 3개 사례를 실시간 점수화 매칭합니다.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-apple-divider relative z-10">
                <button className="w-full py-3 h-11 bg-apple-blue hover:bg-apple-blue/95 active:scale-95 text-white rounded-full font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-sans">
                  <span>신규 기획안 매칭 시작하기</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/90 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>

            {/* Card 2: 조건에 맞는 유사사례 찾기 */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ 
                scale: 1.01,
                boxShadow: "rgba(0, 0, 0, 0.12) 3px 5px 30px" 
              }}
              onClick={() => {
                setSearchMode("general");
                setViewStep("workspace");
              }}
              className="bg-white border text-left border-apple-hairline rounded-[18px] p-6 sm:p-8 cursor-pointer group transition-all flex flex-col justify-between space-y-6 relative overflow-hidden"
            >
              <div className="space-y-5 relative z-10">
                <div className="w-full h-40 rounded-xl overflow-hidden border border-apple-divider shadow-inner relative group-hover:scale-[1.01] transition-transform duration-500 select-none">
                  <img 
                    src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80" 
                    alt="Futuristic Curving Architectural Glass Pavilion with Terraces" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover brightness-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-1.5 bg-white/95 py-0.5 px-2.5 rounded-full border border-apple-border shadow-xs">
                    <Sliders className="w-3.5 h-3.5 text-apple-ink" />
                    <span className="text-[10px] font-semibold text-slate-700">정밀 다조건 보정 분석</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-apple-ink group-hover:text-apple-ink/80 transition-colors font-sans tracking-tight">
                    조건에 맞는 유사사례 찾기
                  </h3>
                  <div className="inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full bg-apple-parchment border border-apple-border">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-ping" />
                    <span className="text-[9px] text-slate-600 font-semibold tracking-wider uppercase">
                      다조건 대시보드 인덱스
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed font-sans pt-1">
                    프로젝트 건립 연도, 전국 권역, 규모, 외벽 마감재 및 평당 공사단가 등 원하는 상세 필터링 조건을 임의 지정하여 전체 요약 통계 테이블을 일괄 구조화합니다.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-apple-divider relative z-10">
                <button className="w-full py-3 h-11 bg-apple-ink hover:opacity-95 active:scale-95 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-sans">
                  <span>다조건 정밀 대시보드 켜기</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/90 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>

          </div>
        </main>

        <footer className="bg-white border-t border-apple-hairline py-6 px-6 text-center text-xs text-slate-400 select-none">
          <p>© 2026 HEALTH SEARCH Core Explorer Suite • Haas Grotesk Edition</p>
        </footer>
      </div>
    );
  }

  // Render Step 3: Main Dashboard Workspace
  return (
    <div className="min-h-screen bg-white font-sans text-[#333840] flex flex-col antialiased">
      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 space-y-10">
        
        {/* Editorial Title / Hero block */}
        <div className="text-left py-2 max-w-5xl">
          <h2 className="text-[2.2rem] md:text-[2.75rem] font-bold tracking-tight text-slate-900 font-sans leading-tight">
            의료기관 건립 프로젝트 유사사례 <span className="text-indigo-600 font-black">지능형 탐색 패널</span>
          </h2>
          <p className="text-slate-600 text-[15px] mt-4 leading-relaxed max-w-3xl font-medium">
            전국 116개 주요 의료기관 <span className="font-extrabold text-[#aa2d00] bg-rose-50/80 px-1.5 py-0.5 rounded-md">설계사 "A사" 사례 클릭 시, 다른 차트와 상호 연동 필터 적용</span> 평당 공사단가 및 지리적 입지 좌표 구조를 입체적으로 질의하고 필터링하는 지능형 GIS 의사결정 프레임워크입니다.
          </p>
        </div>

        {/* Brand Voltage Punctuation Block: Airtable’s Signature Cream Callout Band */}
        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-3xl p-6 sm:p-8 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-8 relative overflow-hidden">
          <div className="flex-1 relative z-10 text-left">
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 bg-white/80 shadow-sm py-1 px-3 rounded-full">SYSTEM PROFILE</span>
            <h3 className="text-[22px] font-bold tracking-tight text-slate-800 mt-4 mb-2">
              GIS 평단가 분석 및 실시간 공공 조달 비교 매트릭스
            </h3>
            <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-2xl">
              본 플랫폼에 수집된 데이터는 실시간 구글 스프레드시트와의 API 싱크를 통해 자동 갱신됩니다. 보정 필터를 적용해 평당 공사비 추이를 도출하거나 AI 어드바이저의 타당성 자문을 즉시 받아보실 수 있습니다.
            </p>
          </div>
          {/* Sizable Image Area for SYSTEM PROFILE as shown in the screenshots */}
          <div className="w-full md:w-[280px] lg:w-[350px] shrink-0 relative z-10">
            <div className="w-full rounded-[16px] border border-slate-200 bg-slate-50 overflow-hidden relative shadow-xs hover:shadow-md transition-all duration-300" style={{ aspectRatio: "16 / 9" }}>
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=450&q=80" 
                alt="System Architecture Mapping Illustration" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-2.5 right-2.5 bg-indigo-600/90 text-[10px] text-white font-bold py-0.5 px-2.5 rounded-full select-none backdrop-blur-3xs shadow-sm">
                PORTAL GIS DIRECTORY
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Navigation & Control bar - Responsive & Color Coordinated in Blue Theme */}
        <div className="bg-indigo-50/65 border border-indigo-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
            <div className="flex items-center gap-2 select-none shrink-0">
              <span className="w-5 h-5 bg-indigo-600 rounded-[4px] flex items-center justify-center text-white text-[11px] font-black tracking-tight">M</span>
              <span className="text-sm font-bold tracking-tight text-slate-800 font-sans">
                Medical <span className="font-normal text-slate-500">GIS Portal</span>
              </span>
            </div>
            
            <nav className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-[13px] sm:text-[14px] font-bold font-sans sm:border-l sm:border-slate-300 sm:pl-5">
              <button
                onClick={() => setViewStep("choice")}
                className="text-indigo-600 hover:underline font-extrabold cursor-pointer flex items-center gap-1 shrink-0 transition-transform duration-200 hover:scale-[1.02]"
                title="시작 검토유형 선택으로 변경"
              >
                ← 가중치/방식 변경
              </button>
              <button
                onClick={() => setActiveMainTab("dashboard")}
                className={`cursor-pointer transition-all border-b-2 py-1 ${activeMainTab === "dashboard" ? "text-indigo-650 font-black border-indigo-600" : "text-[#41454d] border-transparent hover:text-slate-900"}`}
              >
                대시보드
              </button>
              <button
                onClick={() => setActiveMainTab("report")}
                className={`cursor-pointer transition-all border-b-2 py-1 ${activeMainTab === "report" ? "text-indigo-650 font-black border-indigo-600" : "text-[#41454d] border-transparent hover:text-slate-900"}`}
              >
                통계 보고서
              </button>
            </nav>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 w-full md:w-auto">
            <button
              onClick={handleRefetchDatabase}
              disabled={refreshing}
              className="bg-white text-slate-700 text-[12px] sm:text-[13px] font-semibold border border-slate-200 rounded-lg py-2 px-3.5 flex items-center gap-1.5 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 select-none transition-all active:bg-slate-50 hover:bg-slate-50 hover:border-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
              스프레드시트 동기화
            </button>
            
            <a
              href="#proposal"
              className="inline-flex bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] sm:text-[13px] font-semibold py-2 px-3.5 rounded-lg select-none transition-all shadow-xs hover:shadow-sm"
            >
              공동제안서 다운로드
            </a>
          </div>
        </div>

        {/* Main Work Environment: Coordinated Analytical Workspace */}
        {activeMainTab === "dashboard" ? (
          <div className="pt-2">
            <SmartSearchBoard 
              cases={cases} 
              onSelectCase={handleSelectCase} 
              selectedCase={selectedCase} 
              searchMode={searchMode}
              onSearchModeChange={setSearchMode}
              mapComponent={
                <KoreaMap 
                  cases={cases} 
                  selectedCase={selectedCase} 
                  onSelectCase={handleSelectCase} 
                />
              }
            />
          </div>
        ) : (
          <div className="pt-2">
            <StatisticalReport cases={cases} />
          </div>
        )}

        {/* Supplementary Statistics Foldout (Placed at bottom and minimized) */}
        <div className="border border-[#dddddd] bg-[#fafbfc] rounded-xl p-5 shadow-2xs">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer font-semibold text-xs text-slate-500 uppercase tracking-widest select-none outline-none">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 group-open:bg-[#aa2d00] block transition-colors"></span>
                📊 유사사례 기획 설계 분석 심층 통계 차트 (보조 데이터 뷰)
              </span>
              <span className="text-slate-400 text-[10px] transition-transform group-open:rotate-180">▼</span>
            </summary>
            
            <div className="mt-5 pt-4 border-t border-slate-150 animate-fadeIn">
              <ChartsView cases={cases} />
            </div>
          </details>
        </div>
        
      </main>

      {/* Structured Editorial Footer (footer) - Light Canvas, Balanced Layout */}
      <footer className="bg-white border-t border-[#dddddd] text-slate-500 py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-xs font-normal">
          <div className="space-y-2">
            <div className="flex items-center gap-2 select-none">
              <span className="w-4 h-4 bg-[#181d26] rounded-[3px] flex items-center justify-center text-white text-[9px] font-black">M</span>
              <span className="text-[#181d26] font-semibold">의료기관 유사사례 지능형 검색보드</span>
            </div>
            <p className="text-slate-400">전국 의료 보조시설 및 공공병원 건립 기획 사업의 지리적 입지 데이터 시각화 플랫폼</p>
          </div>
          
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[#41454d]">
            <a href="#workspace" className="hover:text-[#181d26]">Airtable Workspace</a>
            <a href="#terms" className="hover:text-[#181d26]">이용 약관</a>
            <a href="#privacy" className="hover:text-[#181d26]">개인정보 처리방침</a>
            <span className="text-slate-450 font-mono">Database: Google Sheets Connected (116 Cases)</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row justify-between text-[11px] text-slate-400">
          <p>© 2026 Medical GIS Portal. All rights reserved.</p>
          <p className="font-mono mt-2 sm:mt-0">Ref: Haas Grotesk Digital Dialect</p>
        </div>
      </footer>
    </div>
  );
}
