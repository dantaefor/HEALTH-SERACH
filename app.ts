/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
let casesCache: any[] = [];
let isFetching = false;

// Lazy initialization of GoogleGenAI SDK safely
let aiInstance: GoogleGenAI | null = null;
function getAIInstance() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Helper functions for CSV parsing
function parseCSVLine(line: string) {
  const values: string[] = [];
  let value = '';
  let insideQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

function parseCSV(text: string) {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === '\n' && !insideQuotes) {
      lines.push(currentLine);
      currentLine = '';
      continue;
    }
    currentLine += char;
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(h => h.replace(/\s+/g, ' ').trim());
  
  const results: any[] = [];
  
  // Find key header indices for maximum robustness
  const idxDesigner = headers.findIndex(h => h === "설계사");
  const idxYear = headers.findIndex(h => h === "설계연도");
  const idxProjName = headers.findIndex(h => h === "사업명");
  const idxLocation = headers.findIndex(h => h === "위치");
  const idxClient = headers.findIndex(h => h === "발주처");
  const idxPublicPrivate = headers.findIndex(h => h === "공공/민간");
  const idxProcurement = headers.findIndex(h => h === "발주방식");
  const idxCladding = headers.findIndex(h => h === "입면주요마감");
  const idxCategory = headers.findIndex(h => h === "분류");
  const idxBeds = headers.findIndex(h => h === "병상수");
  const idxScale = headers.findIndex(h => h === "규모");
  const idxGfa = headers.findIndex(h => h === "연면적");
  const idxStatus = headers.findIndex(h => h === "진행단계");
  const idxContractor = headers.findIndex(h => h === "시공사");
  const idxOpeningYear = headers.findIndex(h => h === "개원/준공년도");
  const idxDesignFee = headers.findIndex(h => h.includes("설계비"));
  const idxConstructionCost = headers.findIndex(h => h.includes("공사비") && !h.includes("평당"));
  const idxPerPyungCost = headers.findIndex(h => h.includes("평당공사비"));
  const idxLng = headers.findIndex(h => h.includes("경도"));
  const idxLat = headers.findIndex(h => h.includes("위도"));
  const idxRemarks = headers.findIndex(h => h === "비고");

  let idCounter = 1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    if (values.length === 0 || values.every(v => v === '')) continue;
    
    const designer = valAt(values, idxDesigner);
    if (!designer || designer === "설계사") continue; // skip header or empty rows
    
    const parseNum = (str: string) => {
      const clean = (str || "").replace(/,/g, "").trim();
      if (!clean || clean === "-" || clean === "N/A" || clean === "미정") return 0;
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    };

    const designFee = parseNum(valAt(values, idxDesignFee));
    let rawConstructionCost = parseNum(valAt(values, idxConstructionCost));
    const gfa = parseNum(valAt(values, idxGfa));
    
    // Clean up outlier data with typo entry: "2842 건립사업" should be 1,160.2 백만원 (11.6억원) instead of 1,160,200 백만원 (1.16조원)
    if (valAt(values, idxProjName) === "2842 건립사업") {
      rawConstructionCost = 1160.2;
    }
    
    // Convert million won (백만원) to hundred million won (억원)
    const constructionCost = rawConstructionCost / 100;
    
    let perPyungCost = 0;
    if (idxPerPyungCost !== -1) {
      perPyungCost = parseNum(valAt(values, idxPerPyungCost));
    } else if (gfa > 0 && constructionCost > 0) {
      // Calculate per pyung cost in Million KRW: 공사비(백만원) / 연면적 * 3.3048
      perPyungCost = rawConstructionCost / gfa * 3.3048;
    }

    results.push({
      id: `case-${idCounter++}`,
      designer,
      designYear: parseNum(valAt(values, idxYear)),
      projectName: valAt(values, idxProjName),
      location: valAt(values, idxLocation) || "전국",
      client: valAt(values, idxClient),
      isPublic: (valAt(values, idxPublicPrivate) || "").includes("공공"),
      procurementMethod: valAt(values, idxProcurement) || "N/A",
      cladding: valAt(values, idxCladding) || "N/A",
      category: valAt(values, idxCategory) || "일반병원",
      beds: Math.round(parseNum(valAt(values, idxBeds))),
      scale: valAt(values, idxScale) || "N/A",
      gfa,
      status: valAt(values, idxStatus) || "N/A",
      contractor: valAt(values, idxContractor) || "N/A",
      openingYear: valAt(values, idxOpeningYear) || "N/A",
      designFee,
      constructionCost,
      perPyungCost,
      lng: parseNum(valAt(values, idxLng)),
      lat: parseNum(valAt(values, idxLat)),
      remarks: valAt(values, idxRemarks) || ""
    });
  }

  return results;
}

function valAt(arr: string[], index: number): string {
  if (index === -1 || index >= arr.length) return "";
  return arr[index] ? arr[index].trim() : "";
}

// Fetch spreadsheet and load cache
async function loadSheetsData() {
  if (isFetching) return;
  isFetching = true;
  console.log("Fetching live spreadsheet data...");
  const url = 'https://docs.google.com/spreadsheets/d/1Jd4Nzzv6htVuzm6WcGUj2WJLeZbvVbNiWxWddkLZAls/gviz/tq?tqx=out:csv&sheet=RAW%20DATA';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const text = await res.text();
    const parsed = parseCSV(text);
    if (parsed.length > 0) {
      casesCache = parsed;
      console.log(`Successfully loaded ${casesCache.length} cases in cache.`);
    } else {
      console.warn("Parsed 0 cases from spreadsheet. Using cached or empty database.");
    }
  } catch (error) {
    console.error("Failed to load spreadsheet data live:", error);
    // Keep stale cache if it exists
  } finally {
    isFetching = false;
  }
}

const app = express();
app.use(express.json());

// Dynamic load spreadsheet data helper middleware (especially for cold-started Serverless Functions)
app.use(async (req, res, next) => {
  try {
    if (casesCache.length === 0 && (req.path.startsWith("/api/cases") || req.path.startsWith("/api/search") || req.path.startsWith("/api/chat-advisor"))) {
      await loadSheetsData();
    }
  } catch (err) {
    console.error("Middleware loadSheetsData error caught safely:", err);
  }
  next();
});

// Route to get all cases
  app.get("/api/cases", async (req, res) => {
    try {
      if (casesCache.length === 0) {
        await loadSheetsData();
      }
      res.json({
        success: true,
        data: casesCache,
        count: casesCache.length
      });
    } catch (error) {
      console.error("Error in /api/cases:", error);
      res.status(500).json({ error: "Failed to fetch cases." });
    }
  });

  // Route to trigger manual refetch of data
  app.post("/api/cases/refetch", async (req, res) => {
    try {
      await loadSheetsData();
      res.json({
        success: true,
        count: casesCache.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in /api/cases/refetch:", error);
      res.status(500).json({ error: "Failed to refetch cases." });
    }
  });

  // Multimodal Intelligent Similarity and Search Engine API
  app.post("/api/search", (req, res) => {
    const { mode, inputs, customWeights } = req.body;
    
    // Initial specified weights from the guidelines (super critical!)
    const defaultWeights: Record<string, number> = {
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
    };

    const finalWeights = { ...defaultWeights };
    if (customWeights) {
      for (const k in customWeights) {
        if (typeof customWeights[k] === "number") {
          finalWeights[k] = customWeights[k];
        }
      }
    }

    if (!casesCache || casesCache.length === 0) {
      return res.json({ success: true, data: [], activeWeightsUsed: finalWeights });
    }

    let results = [];

    // Scale floors extraction
    const parseScale = (scaleStr: string) => {
      const bMin = scaleStr.match(/B(\d+)/i);
      const fMin = scaleStr.match(/(\d+)F/i);
      return {
        b: bMin ? parseInt(bMin[1]) : 0,
        f: fMin ? parseInt(fMin[1]) : 0
      };
    };

    if (mode === "matching") {
      // 12 specific inputs for Mode 1
      const {
        gfaM2,              // 1
        beds,               // 2
        constructionCost,   // 3
        designFee,          // 4
        scaleB, scaleF,     // 5 (지하, 지상)
        cladding,           // 6
        location,           // 7
        isPublic,           // 8 (boolean)
        procurementMethod,  // 9
        category,           // 10
        status,             // 11
        contractor          // 12
      } = inputs || {};

      // Determine which inputs are provided (active fields)
      const isActive = (key: string, val: any) => {
        if (val === undefined || val === null || val === "") return false;
        if (typeof val === "number" && val <= 0) return false;
        if (key === "cladding" && val === "N/A") return false;
        if (key === "procurementMethod" && val === "N/A") return false;
        if (key === "status" && val === "N/A") return false;
        if (key === "contractor" && val === "N/A") return false;
        return true;
      };

      const activeFields: string[] = [];
      const fieldsToCheck = [
        { key: "gfa", val: gfaM2 },
        { key: "beds", val: beds },
        { key: "constructionCost", val: constructionCost },
        { key: "designFee", val: designFee },
        { key: "scale", val: (scaleB > 0 || scaleF > 0) ? 1 : 0 },
        { key: "cladding", val: cladding },
        { key: "location", val: location },
        { key: "isPublic", val: isPublic },
        { key: "procurementMethod", val: procurementMethod },
        { key: "category", val: category },
        { key: "status", val: status },
        { key: "contractor", val: contractor }
      ];

      fieldsToCheck.forEach(f => {
        if (isActive(f.key, f.val)) {
          activeFields.push(f.key);
        }
      });

      // Boost active fields by 1.5x as required in prompt!
      const workingWeights: Record<string, number> = {};
      let activeWeightSum = 0;
      activeFields.forEach(field => {
        workingWeights[field] = (finalWeights[field] || 0.05) * 1.5;
        activeWeightSum += workingWeights[field];
      });

      // Also ensure default weights for inactive ones or fallback
      results = casesCache.map(c => {
        const scores: Record<string, number> = {};
        const reasons: string[] = [];
        const diffs: string[] = [];

        // 1. GFA m2 ratio
        if (activeFields.includes("gfa")) {
          const ratio = Math.min(c.gfa, gfaM2) / Math.max(c.gfa, gfaM2, 1);
          scores["gfa"] = ratio;
          if (ratio >= 0.8) {
            reasons.push(`연면적이 매우 유사함 (계획: ${gfaM2.toLocaleString()}m² vs 사례: ${c.gfa.toLocaleString()}m²)`);
          } else if (ratio >= 0.6) {
            reasons.push(`연면적이 유사한 규모 대역임 (계획: ${gfaM2.toLocaleString()}m² vs 사례: ${c.gfa.toLocaleString()}m²)`);
          } else {
            diffs.push(`연면적 비율의 규모 격차 존재 (계획: ${gfaM2.toLocaleString()}m² vs 사례: ${c.gfa.toLocaleString()}m²)`);
          }
        }

        // 2. Beds ratio
        if (activeFields.includes("beds")) {
          const ratio = Math.min(c.beds, beds) / Math.max(c.beds, beds, 1);
          scores["beds"] = ratio;
          if (ratio >= 0.8) {
            reasons.push(`기획 병상수가 매우 유사함 (계획: ${beds}병상 vs 사례: ${c.beds}병상)`);
          } else if (ratio >= 0.6) {
            reasons.push(`기획 병상수가 유사 수준의 규모임 (계획: ${beds}병상 vs 사례: ${c.beds}병상)`);
          } else {
            diffs.push(`병상 규모 대역 차이 있음 (계획: ${beds}병상 vs 사례: ${c.beds}병상)`);
          }
        }

        // 3. Construction Cost ratio
        if (activeFields.includes("constructionCost")) {
          const ratio = Math.min(c.constructionCost, constructionCost) / Math.max(c.constructionCost, constructionCost, 1);
          scores["constructionCost"] = ratio;
          if (ratio >= 0.8) {
            reasons.push(`건축 예산이 매우 유사함 (계획: ${constructionCost}억 vs 사례: ${c.constructionCost}억)`);
          } else if (ratio >= 0.6) {
            reasons.push(`건축 공사비 예산이 동류 스케일임 (계획: ${constructionCost}억 vs 사례: ${c.constructionCost}억)`);
          } else {
            diffs.push(`공사비 예산 격차 존재 (계획: ${constructionCost}억 vs 사례: ${c.constructionCost}억)`);
          }
        }

        // 4. Design Fee ratio
        if (activeFields.includes("designFee")) {
          const ratio = Math.min(c.designFee, designFee) / Math.max(c.designFee, designFee, 1);
          scores["designFee"] = ratio;
          if (ratio >= 0.8) {
            reasons.push(`설계 요율 예산이 매우 인접함 (계획: ${designFee}백만원 vs 사례: ${c.designFee}백만원)`);
          } else if (ratio >= 0.6) {
            reasons.push(`기획 설계비가 동급 예산 구간임 (계획: ${designFee}백만원 vs 사례: ${c.designFee}백만원)`);
          } else {
            diffs.push(`설계 계약비 스케일 차이 (계획: ${designFee}백만원 vs 사례: ${c.designFee}백만원)`);
          }
        }

        // 5. Scale (지하/지상) floors
        if (activeFields.includes("scale")) {
          const cScale = parseScale(c.scale);
          const bScore = scaleB > 0 ? (Math.min(cScale.b, scaleB) / Math.max(cScale.b, scaleB, 1)) : 1;
          const fScore = scaleF > 0 ? (Math.min(cScale.f, scaleF) / Math.max(cScale.f, scaleF, 1)) : 1;
          const totalScaleScore = (bScore + fScore) / 2;
          scores["scale"] = totalScaleScore;
          if (totalScaleScore >= 0.8) {
            reasons.push(`지층/지상 층수 배치가 흡사함 (계획: B${scaleB}/${scaleF}F vs 사례: ${c.scale})`);
          } else {
            diffs.push(`건축 규모 층수 구성 차이 (계획: B${scaleB}/${scaleF}F vs 사례: ${c.scale})`);
          }
        }

        // 6. Cladding
        if (activeFields.includes("cladding")) {
          const match = c.cladding.toLowerCase().includes(cladding.toLowerCase()) || cladding.toLowerCase().includes(c.cladding.toLowerCase());
          scores["cladding"] = match ? 1.0 : 0.2;
          if (match) {
            reasons.push(`동일한 입면 마감재 채택 (${cladding})`);
          } else {
            diffs.push(`외관 마감재 상이 (계획: ${cladding} vs 사례: ${c.cladding})`);
          }
        }

        // 7. Location (Region matching)
        if (activeFields.includes("location")) {
          const matched = c.location.startsWith(location) || location.startsWith(c.location.substring(0, 2));
          scores["location"] = matched ? 1.0 : 0.1;
          if (matched) {
            reasons.push(`지리적으로 인접한 권역임 (${c.location})`);
          } else {
            diffs.push(`지역적 지리적 위치 불일치 (계획: ${location} vs 사례: ${c.location})`);
          }
        }

        // 8. Public / Private
        if (activeFields.includes("isPublic")) {
          const matched = c.isPublic === isPublic;
          scores["isPublic"] = matched ? 1.0 : 0.0;
          if (matched) {
            reasons.push(`동일한 소유 및 조달 분류 (${isPublic ? "공공보조기관" : "민간투자기관"})`);
          } else {
            diffs.push(`조달 및 보조 체계가 상이함 (계획: ${isPublic ? "공공" : "민간"} vs 사례: ${c.isPublic ? "공공" : "민간"})`);
          }
        }

        // 9. ProcurementMethod
        if (activeFields.includes("procurementMethod")) {
          const matched = c.procurementMethod.toLowerCase().includes(procurementMethod.toLowerCase()) || procurementMethod.toLowerCase().includes(c.procurementMethod.toLowerCase());
          scores["procurementMethod"] = matched ? 1.0 : 0.1;
          if (matched) {
            reasons.push(`일치하는 계약 발주 추진방식 (${procurementMethod})`);
          } else {
            diffs.push(`발주 계약 방식 상이 (계획: ${procurementMethod} vs 사례: ${c.procurementMethod})`);
          }
        }

        // 10. Hospital Category
        if (activeFields.includes("category")) {
          const isExact = c.category === category;
          const isPartial = c.category.includes("병원") && category.includes("병원");
          scores["category"] = isExact ? 1.0 : (isPartial ? 0.6 : 0.0);
          if (isExact) {
            reasons.push(`의료기관 분류가 완전 일치함 (${category})`);
          } else if (isPartial) {
            reasons.push(`의료 기능이 유사한 일반 병원군 분류`);
          } else {
            diffs.push(`용도 및 주요 의료 기능 분류의 불일치 (계획: ${category} vs 사례: ${c.category})`);
          }
        }

        // 11. Status
        if (activeFields.includes("status")) {
          const matched = c.status.toLowerCase().includes(status.toLowerCase()) || status.toLowerCase().includes(c.status.toLowerCase());
          scores["status"] = matched ? 1.0 : 0.2;
          if (matched) {
            reasons.push(`진행 단계의 높은 동질성 (${status})`);
          }
        }

        // 12. Contractor
        if (activeFields.includes("contractor")) {
          const matched = c.contractor.toLowerCase().includes(contractor.toLowerCase()) || contractor.toLowerCase().includes(c.contractor.toLowerCase());
          scores["contractor"] = matched ? 1.0 : 0.1;
          if (matched) {
            reasons.push(`동일 시공사 수주 네트워크 매칭 (${contractor})`);
          }
        }

        // Calculate weighted score using dynamic weights on active fields
        let finalScore = 0;
        if (activeWeightSum > 0) {
          let weightedSum = 0;
          activeFields.forEach(f => {
            weightedSum += scores[f] * workingWeights[f];
          });
          finalScore = weightedSum / activeWeightSum;
        } else {
          finalScore = 1.0; // no filter active means full match
        }

        // Determine top contributing items (highest w'*s)
        const contributions = activeFields.map(f => {
          return {
            field: f,
            label: f === "gfa" ? "연면적" 
                 : f === "beds" ? "병상수" 
                 : f === "constructionCost" ? "공사비" 
                 : f === "designFee" ? "설계비" 
                 : f === "scale" ? "지하/지상 규모" 
                 : f === "cladding" ? "입면주요마감" 
                 : f === "location" ? "예정 위치" 
                 : f === "isPublic" ? "공공/민간 구분" 
                 : f === "procurementMethod" ? "발주방식" 
                 : f === "category" ? "병원분류" 
                 : f === "status" ? "진행단계" 
                 : f === "contractor" ? "시공사" : f,
            score: scores[f] || 0,
            weighted: (scores[f] || 0) * (workingWeights[f] || 0)
          };
        });
        
        // Sort contributions descending to pick top 3
        contributions.sort((x, y) => y.weighted - x.weighted);
        const top3Contributions = contributions.slice(0, 3).map(ct => `${ct.label} (일치율 ${(ct.score * 100).toFixed(0)}%)`);

        // Generate qualitative description based on final similarity score
        let qualDesc = "차이 있음";
        if (finalScore >= 0.8) qualDesc = "매우 유사";
        else if (finalScore >= 0.6) qualDesc = "유사";
        else if (finalScore >= 0.4) qualDesc = "다소 유사";

        return {
          ...c,
          similarityScore: finalScore,
          qualitativeDescription: qualDesc,
          topContributions: top3Contributions,
          matchingReasons: reasons.slice(0, 3),
          keyDifferences: diffs.slice(0, 2)
        };
      });

      // Sort by similarity score descending
      results.sort((a, b) => b.similarityScore - a.similarityScore);

    } else {
      // MODE 2: "general" 다조건 정밀 유사사례 검색
      const {
        designYearMin, designYearMax,
        gfaMin, gfaMax,
        bedsMin, bedsMax,
        constructionCostMin, constructionCostMax,
        designFeeMin, designFeeMax,
        scaleBMin, scaleBMax,
        scaleFMin, scaleFMax,
        claddingQuery,
        locationQuery,
        isPublicCheck, // "공공", "민간", "전체"
        procurementQuery,
        categoryQuery,
        statusQuery,
        contractorQuery,
        openingYearCheck, // "준공", "예정", "전체"
        designerQuery
      } = inputs || {};

      // Establish active fields for general range matching mode
      const activeFields: string[] = [];
      const addActive = (key: string, condition: boolean) => {
        if (condition) activeFields.push(key);
      };

      addActive("designYear", (designYearMin > 0 || designYearMax > 0));
      addActive("gfa", (gfaMin > 0 || gfaMax > 0));
      addActive("beds", (bedsMin > 0 || bedsMax > 0));
      addActive("constructionCost", (constructionCostMin > 0 || constructionCostMax > 0));
      addActive("designFee", (designFeeMin > 0 || designFeeMax > 0));
      addActive("scale", (scaleBMin > 0 || scaleBMax > 0 || scaleFMin > 0 || scaleFMax > 0));
      addActive("cladding", (claddingQuery && claddingQuery !== ""));
      addActive("location", (locationQuery && locationQuery !== "전체"));
      addActive("isPublic", (isPublicCheck && isPublicCheck !== "전체"));
      addActive("procurementMethod", (procurementQuery && procurementQuery !== "전체"));
      addActive("category", (categoryQuery && categoryQuery !== "전체"));
      addActive("status", (statusQuery && statusQuery !== "전체"));
      addActive("contractor", (contractorQuery && contractorQuery !== "전체"));
      addActive("openingYear", (openingYearCheck && openingYearCheck !== "전체"));
      addActive("designer", (designerQuery && designerQuery !== "전체"));

      // Sum of active weights for Mode 2
      const activeWeights: Record<string, number> = {};
      let activeWeightSum = 0;
      activeFields.forEach(f => {
        activeWeights[f] = finalWeights[f] || 0.05;
        activeWeightSum += activeWeights[f];
      });

      const inRangeScore = (val: number, min: number | undefined, max: number | undefined) => {
        const actualMin = min ?? 0;
        const actualMax = max ?? Infinity;
        if (val >= actualMin && val <= actualMax) return 1.0;
        
        // decaying score for out-of-range
        const rangeSpan = Math.max(1, (actualMax === Infinity ? actualMin : actualMax) - actualMin);
        const dist = val < actualMin ? actualMin - val : val - actualMax;
        return Math.max(0.1, 1.0 - (dist / (rangeSpan * 2)));
      };

      let filteredCases = [...casesCache];

      if (isPublicCheck && isPublicCheck !== "전체") {
        const targetIsPublic = isPublicCheck === "공공";
        filteredCases = filteredCases.filter(c => c.isPublic === targetIsPublic);
      }

      if (openingYearCheck && openingYearCheck !== "전체") {
        if (openingYearCheck === "예정") {
          filteredCases = filteredCases.filter(c => c.openingYear.includes("예정"));
        } else if (openingYearCheck === "준공") {
          filteredCases = filteredCases.filter(c => !c.openingYear.includes("예정"));
        }
      }

      if (locationQuery && locationQuery !== "전체") {
        filteredCases = filteredCases.filter(c => 
          c.location.startsWith(locationQuery) || locationQuery.startsWith(c.location.substring(0, 2))
        );
      }

      if (categoryQuery && categoryQuery !== "전체") {
        filteredCases = filteredCases.filter(c => c.category === categoryQuery);
      }

      if (procurementQuery && procurementQuery !== "전체") {
        filteredCases = filteredCases.filter(c => c.procurementMethod === procurementQuery);
      }

      if (statusQuery && statusQuery !== "전체") {
        filteredCases = filteredCases.filter(c => c.status === statusQuery);
      }

      if (contractorQuery && contractorQuery !== "전체") {
        filteredCases = filteredCases.filter(c => c.contractor === contractorQuery);
      }

      if (designerQuery && designerQuery !== "전체") {
        filteredCases = filteredCases.filter(c => c.designer === designerQuery);
      }

      if (claddingQuery && claddingQuery.trim() !== "") {
        filteredCases = filteredCases.filter(c => 
          c.cladding.toLowerCase().includes(claddingQuery.toLowerCase())
        );
      }

      results = filteredCases.map(c => {
        const scores: Record<string, number> = {};

        // 1. 설계연도 범위
        if (activeFields.includes("designYear")) {
          scores["designYear"] = inRangeScore(c.designYear, designYearMin, designYearMax);
        }
        // 2. 연면적 범위
        if (activeFields.includes("gfa")) {
          scores["gfa"] = inRangeScore(c.gfa, gfaMin, gfaMax);
        }
        // 3. 병상수 범위
        if (activeFields.includes("beds")) {
          scores["beds"] = inRangeScore(c.beds, bedsMin, bedsMax);
        }
        // 4. 공사비 범위
        if (activeFields.includes("constructionCost")) {
          scores["constructionCost"] = inRangeScore(c.constructionCost, constructionCostMin, constructionCostMax);
        }
        // 5. 설계비 범위
        if (activeFields.includes("designFee")) {
          scores["designFee"] = inRangeScore(c.designFee, designFeeMin, designFeeMax);
        }
        // 6. 규모 범위 (지하/지상)
        if (activeFields.includes("scale")) {
          const cScale = parseScale(c.scale);
          const bScr = inRangeScore(cScale.b, scaleBMin, scaleBMax);
          const fScr = inRangeScore(cScale.f, scaleFMin, scaleFMax);
          scores["scale"] = (bScr + fScr) / 2;
        }
        // 7. 입면마감 (텍스트 포함 매칭)
        if (activeFields.includes("cladding")) {
          const matched = c.cladding.toLowerCase().includes(claddingQuery.toLowerCase());
          scores["cladding"] = matched ? 1.0 : 0.2;
        }
        // 8. 위치 (드롭다운)
        if (activeFields.includes("location")) {
          const matched = c.location.startsWith(locationQuery) || locationQuery.startsWith(c.location.substring(0, 2));
          scores["location"] = matched ? 1.0 : 0.0;
        }
        // 9. 공공/민간 (클릭형)
        if (activeFields.includes("isPublic")) {
          const targetIsPublic = isPublicCheck === "공공";
          scores["isPublic"] = (c.isPublic === targetIsPublic) ? 1.0 : 0.0;
        }
        // 10. 발주방식 (드롭다운)
        if (activeFields.includes("procurementMethod")) {
          scores["procurementMethod"] = (c.procurementMethod === procurementQuery) ? 1.0 : 0.1;
        }
        // 11. 분류 (드롭다운)
        if (activeFields.includes("category")) {
          scores["category"] = (c.category === categoryQuery) ? 1.0 : 0.0;
        }
        // 12. 진행단계 (드롭다운)
        if (activeFields.includes("status")) {
          scores["status"] = (c.status === statusQuery) ? 1.0 : 0.2;
        }
        // 13. 시공사 (드롭다운)
        if (activeFields.includes("contractor")) {
          scores["contractor"] = (c.contractor === contractorQuery) ? 1.0 : 0.1;
        }
        // 14. 준공/예정 (클릭형)
        if (activeFields.includes("openingYear")) {
          const containsExpected = c.openingYear.includes("예정");
          if (openingYearCheck === "예정") {
            scores["openingYear"] = containsExpected ? 1.0 : 0.2;
          } else {
            // "준공"
            scores["openingYear"] = !containsExpected ? 1.0 : 0.2;
          }
        }
        // 15. 설계사 (드롭다운)
        if (activeFields.includes("designer")) {
          scores["designer"] = (c.designer === designerQuery) ? 1.0 : 0.0;
        }

        let finalScore = 0;
        if (activeWeightSum > 0) {
          let weightedSum = 0;
          activeFields.forEach(f => {
            weightedSum += scores[f] * activeWeights[f];
          });
          finalScore = weightedSum / activeWeightSum;
        } else {
          finalScore = 1.0; // no fields active, fully matches
        }

        let qualDesc = "차이 있음";
        if (finalScore >= 0.8) qualDesc = "매우 유사";
        else if (finalScore >= 0.6) qualDesc = "유사";
        else if (finalScore >= 0.4) qualDesc = "다소 유사";

        return {
          ...c,
          similarityScore: finalScore,
          qualitativeDescription: qualDesc,
          topContributions: activeFields.slice(0, 3).map(f => {
            const labels: Record<string, string> = {
              designYear: "설계연도", gfa: "연면적", beds: "병상수", constructionCost: "공사비",
              designFee: "설계비", scale: "규모", cladding: "입면마감", location: "지역",
              isPublic: "조달구분", procurementMethod: "발주방식", category: "용도분류",
              status: "진행단계", contractor: "시공사", openingYear: "준공구분", designer: "설계사"
            };
            return `${labels[f]} (일치율 ${(scores[f]*100).toFixed(0)}%)`;
          }),
          matchingReasons: [`입력 조건과의 가교 매치율 ${(finalScore * 100).toFixed(1)}%`],
          keyDifferences: []
        };
      });

      results.sort((a, b) => b.similarityScore - a.similarityScore);
    }

    res.json({
      success: true,
      mode,
      data: results,
      activeWeightsUsed: finalWeights
    });
  });

  // Route to chat with Gemini Advisor
  app.post("/api/chat-advisor", async (req, res) => {
    const { input, similarCases } = req.body;

    if (!input) {
      return res.status(400).json({ error: "No input parameters provided." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API Key is currently missing. Please add it in Settings > Secrets."
      });
    }

    try {
      const matchDetails = (similarCases || [])
        .map((c: any, index: number) => {
          return `${index + 1}. [${c.projectName}]
- 분류 / 연면적 / 병상수: ${c.category} / ${c.gfa.toLocaleString()} m² (약 ${(c.gfa / 3.3).toFixed(0)}평) / ${c.beds}병상
- 설계연도 / 준공년도: ${c.designYear}년 / ${c.openingYear}
- 공공/민간구분: ${c.isPublic ? "공공" : "민간"}
- 발주방식 / 입면마감: ${c.procurementMethod} / ${c.cladding}
- 설계비: ${c.designFee ? `${c.designFee.toLocaleString()} 백만원` : "정보 없음"}
- 공사비 / 평당공사비: ${c.constructionCost ? `${c.constructionCost.toLocaleString()} 억원` : "정보 없음"} / ${c.perPyungCost ? `${c.perPyungCost.toFixed(2)} 백만원/평` : "정보 없음"}
- 비고: ${c.remarks || "없음"}`;
        })
        .join("\n\n");

      const prompt = `당신은 의료기관 신축 및 증축 타당성 조사, 건축 기획, 그리고 사업 예산 설계 부문의 전문 건설 기술사/적산 가이드 AI 컨설턴트입니다.
사용자가 기획하고 있는 새로운 병원 프로젝트 사양과 유사한 과거 실제 건립 사례 ${similarCases ? similarCases.length : 0}건의 데이터를 기반으로 전문적이고 구체적인 '의료시설 건축기획 및 공사비 시뮬레이션 자문 보고서'를 한국어로 작성해 주세요.

## 1. 계획 중인 프로젝트 프로필 (사용자 입력)
- 의료기관 분류: ${input.category}
- 목표 병상수: ${input.beds} 병상
- 계획 연면적: ${input.gfaM2.toLocaleString()} m² (약 ${input.gfaPyung.toLocaleString()} 평)
- 계획 위치: ${input.location}
- 공공/민간 구분: ${input.isPublic ? "공공" : "민간"}
- 선호 발주방식: ${input.procurementMethod || "기본 (현상설계/수의계약 등)"}
- 선호 외관/입면마감: ${input.cladding || "기본 (커튼월/금속패널 등)"}

## 2. 데이터베이스 매칭 유사사례 목록 (기반 데이터)
${matchDetails || "매칭된 유사 사례가 없습니다."}

## 3. 답변 작성 가이드 및 보고서 목차 요구사항:
- 가독성이 극대화된 아름다운 마크다운(Markdown) 포맷으로 전형적인 기술보고서 스타일을 사용해 주세요. (가벼운 어조 대신 정중하고 격조 높은 실무 전문가의 톤앤매너로 작성)
- 이모지는 보고서의 품격을 위해 가급적 절제해 주시거나 각 대주제 헤더 부근에만 제한적으로 사용해 주세요.
- 다음의 표준 목차 구조를 정확히 지켜 서술해 주세요:

### [1. 기획 사양 적정성 검토 (Scale & Space Ratio)]
  - 기획된 연면적 대비 병상수 비율(1병상당 면적, m²/bed)을 계산하고, 유사사례들의 평균 비율과 비교하여 과대/과소기획 여부를 검토해 주세요.
  - 일반적으로 한국 의료기관의 기준(예: 종합병원 120~160m²/bed, 전문병원 80~110m²/bed 등)과 비교한 기획 사양의 현실성을 정량 평가합니다.

### [2. 다각적 공사비 시뮬레이션 및 예산 검증 (Cost Simulation)]
  - 기획 사양(계획 평수) 및 유사사례들의 평당공사비를 기반으로 예측한 총 공사비 가이드라인을 타겟으로 설명해 줍니다.
  - 공공 여부(${input.isPublic ? "공공" : "민간"}) 및 물가 상승률(설계년도 대비 2026년 현재 원자재/임금 추이 변화 반영)에 따른 가중치를 감안하여 전문가적 '공사비 현실화 시나리오(최적안, 보수적안, 낙관안)'을 구체적 금액(억원 단위)으로 시뮬레이션해 주세요.
  - 적정 설계비(설계비 = 공사비의 약 % 요율 대비 실제 사례 기반 예측치 제시) 산출내역도 예측해서 제안해 주세요.

### [3. 발주 방식 및 설계 기획 리스크 관리 (Risk & Procurement Analysis)]
  - 계획된 발주방식(${input.procurementMethod})과 마감재(${input.cladding}) 사양이 유사사례들과 비교해 어떠한 리스크 및 기회 요인이 있는지 분석해 줍니다.
  - 의료기획 프로젝트가 직면할 수 있는 단계적 리스크(설계 지연, 시공사 리스크, 물가 변동 대책 등)를 조언해 줍니다.

### [4. 실무 전문가 전략 제언 (Special Executive Summary)]
  - 본 기획 프로젝트가 착공 및 성공적인 완공에 이르기 위해 건축주/발주처가 반드시 우선 수행해야 할 실무 액션플랜 3가지를 명확히 제시해 주세요.`;

      // Use gemini-3.5-flash as default for basic text tasks/summarization
      const ai = getAIInstance();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      const reportText = response.text || "AI 자문 리포트를 생성하지 못했습니다. 다시 시도해 주세요.";

      res.json({
        success: true,
        report: reportText,
        generatedAt: new Date().toISOString()
      });

    } catch (e: any) {
      console.error("Gemini Advisor Error:", e);
      res.status(500).json({ error: e.message || "자문 리포트 생성 중 알 수 없는 서버 에러 발생" });
    }
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Express Error Handler:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error", message: err.message });
    }
  });

export default app;