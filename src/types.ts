/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CaseRecord {
  id: string; // generated client-side or derived
  designer: string; // 설계사
  designYear: number; // 설계연도
  projectName: string; // 사업명
  location: string; // 위치
  client: string; // 발주처
  isPublic: boolean; // 공공/민간 (true = 공공, false = 민간)
  procurementMethod: string; // 발주방식
  cladding: string; // 입면주요마감
  category: string; // 분류
  beds: number; // 병상수
  scale: string; // 규모
  gfa: number; // 연면적 (m2)
  status: string; // 진행단계
  contractor: string; // 시공사
  openingYear: string; // 개원/준공년도
  designFee: number; // 설계비 (백만원)
  constructionCost: number; // 공사비 (억원)
  perPyungCost: number; // 평당공사비 (백만원/py)
  lng: number; // 좌표(경도)
  lat: number; // 좌표(위도)
  remarks: string; // 비고
}

export interface SimulationInput {
  category: string;
  beds: number;
  gfaPyung: number; // in pyung
  gfaM2: number; // in m²
  location: string;
  isPublic: boolean;
  procurementMethod: string;
  cladding: string;
}

export interface PredictionResult {
  estimatedPerPyungCost: number;
  estimatedConstructionCost: number;
  estimatedDesignFee: number;
  similarCases: CaseRecord[];
  costMultiplier: number; // scaling factor or regional adjustment
}
