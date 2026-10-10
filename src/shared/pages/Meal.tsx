import { useState, useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";

interface School {
  name: string;
  officeCode: string;
  schoolCode: string;
  officeName: string;
  subOfficeName: string;
}

interface SchoolSearchResponse {
  status: number;
  message: string;
  data: School[];
}

interface MonthOption {
  year: number;
  month: number;
}

interface MealSearchResponse {
  status: number;
  message: string;
  data: unknown[];
}

type ProcessStatus = "idle" | "fetching" | "generating" | "complete" | "error";

// KST 기준 연월
function getKSTYearMonth() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
}

function formatYearMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// 대상 연월 목록
function getMonthOptions(year: number, month: number): MonthOption[] {
  return [
    ...(month === 1 ? [{ year: year - 1, month: 12 }] : []),

    ...Array.from({ length: 12 }, (_, index) => ({
      year,
      month: index + 1,
    })),

    ...(month === 12 ? [{ year: year + 1, month: 1 }] : []),
  ];
}

export default function Meal() {
  const [message, setMessage] = useState("학교를 검색해 주세요.");

  // 학교 정보
  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [officeCode, setOfficeCode] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [subOfficeName, setSubOfficeName] = useState("");

  // 검색 결과
  const [schoolList, setSchoolList] = useState<School[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  // 대상 연월
  const [currentYearMonth, setCurrentYearMonth] = useState<MonthOption | null>(null);

  const [targetMonth, setTargetMonth] = useState("");

  // 엑셀 생성 상태
  const [processStatus, setProcessStatus] = useState<ProcessStatus>("idle");

  const [isGenerating, setIsGenerating] = useState(false);

  const [mealCount, setMealCount] = useState(0);

  const generatingRef = useRef(false);

  // KST 날짜 초기화 (SSR Hydration 호환)
  useEffect(() => {
    const current = getKSTYearMonth();

    setCurrentYearMonth(current);
    setTargetMonth(formatYearMonth(current.year, current.month));
  }, []);

  const monthOptions = currentYearMonth ? getMonthOptions(currentYearMonth.year, currentYearMonth.month) : [];

  // 학교 검색
  useEffect(() => {
    const keyword = schoolName.trim();

    if (schoolCode || !keyword) {
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);

      try {
        const response = await fetch(`/api/school/search?keyword=${encodeURIComponent(keyword)}`, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`학교 검색 실패 (HTTP ${response.status})`);
        }

        const result: SchoolSearchResponse = await response.json();

        if (controller.signal.aborted) return;

        const schools = Array.isArray(result.data) ? result.data : [];

        setSchoolList(schools);
        setSelectedIndex(-1);
        setIsOpen(schools.length > 0);

        setMessage(schools.length ? `${schools.length}개의 학교가 검색되었습니다.` : "검색 결과가 없습니다.");
      } catch (error) {
        if (controller.signal.aborted) return;

        setSchoolList([]);
        setSelectedIndex(-1);
        setIsOpen(false);

        setMessage(error instanceof Error ? error.message : "학교 검색 중 오류가 발생했습니다.");
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [schoolName, schoolCode]);

  // 학교 선택
  function selectSchool(school: School) {
    setSchoolName(school.name);
    setSchoolCode(school.schoolCode);
    setOfficeCode(school.officeCode);
    setOfficeName(school.officeName);
    setSubOfficeName(school.subOfficeName);

    setSchoolList([]);
    setSelectedIndex(-1);
    setIsOpen(false);
    setIsSearching(false);

    setProcessStatus("idle");
    setMealCount(0);
    setMessage(`${school.name} 학교가 선택되었습니다.`);
  }

  // 검색어 변경
  function handleSchoolNameChange(value: string) {
    setSchoolName(value);
    setSchoolCode("");
    setOfficeCode("");
    setOfficeName("");
    setSubOfficeName("");

    setSchoolList([]);
    setSelectedIndex(-1);
    setIsOpen(false);

    setProcessStatus("idle");
    setMealCount(0);

    setMessage(value.trim() ? "학교를 검색하고 있습니다." : "학교를 검색해 주세요.");
  }

  // 키보드 검색 결과 선택
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 한글 IME 입력 중 Enter 방지
    if (event.nativeEvent.isComposing || event.keyCode === 229) {
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (!isOpen || schoolList.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();

        setSelectedIndex((prev) => (prev < schoolList.length - 1 ? prev + 1 : 0));
        break;

      case "ArrowUp":
        event.preventDefault();

        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : schoolList.length - 1));
        break;

      case "Enter": {
        event.preventDefault();

        const index = selectedIndex >= 0 ? selectedIndex : 0;

        const school = schoolList[index];

        if (school) {
          selectSchool(school);
        }

        break;
      }
    }
  }

  // 선택된 항목 자동 스크롤
  useEffect(() => {
    if (!isOpen || selectedIndex < 0) return;

    const selectedElement = listRef.current?.querySelector<HTMLElement>(`[data-school-index="${selectedIndex}"]`);

    selectedElement?.scrollIntoView({
      block: "nearest",
    });
  }, [selectedIndex, isOpen]);

  // 급식 조회 → XLSX 생성 → 자동 다운로드
  async function handleMealExcel() {
    if (!schoolCode || !officeCode || !targetMonth) {
      setMessage("학교와 대상년월을 선택해 주세요.");
      return;
    }

    if (generatingRef.current) return;

    generatingRef.current = true;
    setIsGenerating(true);
    setProcessStatus("fetching");
    setMealCount(0);
    setMessage("급식 데이터를 조회하고 있습니다.");

    try {
      // 1. NEIS 급식 조회
      const params = new URLSearchParams({
        officeCode,
        schoolCode,
        date: targetMonth,
      });

      const mealResponse = await fetch(`/api/meal?${params.toString()}`);

      if (!mealResponse.ok) {
        throw new Error(`급식 조회 실패 (HTTP ${mealResponse.status})`);
      }

      const mealResult: MealSearchResponse = await mealResponse.json();

      if (!Array.isArray(mealResult.data)) {
        throw new Error("급식 API 응답 형식이 올바르지 않습니다.");
      }

      const meals = mealResult.data;

      if (meals.length === 0) {
        setProcessStatus("idle");
        setMessage("선택한 대상년월에 등록된 급식 데이터가 없습니다.");
        return;
      }

      setMealCount(meals.length);

      // 2. 엑셀 생성
      setProcessStatus("generating");
      setMessage(`${meals.length}건 조회 완료. 엑셀 파일을 생성하고 있습니다.`);

      const excelResponse = await fetch("/api/meal/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolName,
          schoolCode,
          officeCode,
          month: targetMonth,
          meals,
        }),
      });

      if (!excelResponse.ok) {
        throw new Error(`엑셀 생성 실패 (HTTP ${excelResponse.status})`);
      }

      // JSON 오류 응답이 XLSX로 저장되지 않도록 확인
      const contentType = excelResponse.headers.get("content-type") ?? "";

      const validExcelType = contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") || contentType.includes("application/octet-stream");

      if (!validExcelType) {
        throw new Error("서버에서 엑셀 파일이 아닌 응답을 반환했습니다.");
      }

      // 3. 다운로드
      const blob = await excelResponse.blob();

      if (blob.size === 0) {
        throw new Error("엑셀 파일이 비어 있습니다.");
      }

      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${schoolName}_${targetMonth}_급식.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      // 다운로드 시작 후 객체 URL 정리
      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 60000);

      setProcessStatus("complete");
      setMessage(`${meals.length}건의 급식 데이터를 엑셀 파일로 생성했습니다.`);
    } catch (error) {
      setProcessStatus("error");

      setMessage(error instanceof Error ? error.message : "급식 엑셀 생성 중 오류가 발생했습니다.");
    } finally {
      generatingRef.current = false;
      setIsGenerating(false);
    }
  }

  return (
    <section>
      <h1>오늘의 식단 추출</h1>

      <p>서울특별시교육청 웹호스팅 서비스를 이용하는 학교를 위한 오늘의 식단 추출 도구입니다.</p>

      <p>NEIS를 통해 오늘의 식단을 조회하고, 엑셀 파일로 다운로드 받을 수 있습니다.</p>

      {/* 검색 조건 */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* 학교명 */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <label htmlFor="school-search">학교명:</label>

          <div style={{ position: "relative" }}>
            <input
              id="school-search"
              type="search"
              name="keyword"
              value={schoolName}
              placeholder="학교명을 입력하세요."
              autoComplete="off"
              disabled={isGenerating}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isOpen && schoolList.length > 0}
              aria-controls="school-list"
              aria-activedescendant={isOpen && selectedIndex >= 0 ? `school-option-${selectedIndex}` : undefined}
              onChange={(event) => handleSchoolNameChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (schoolList.length > 0 && !schoolCode) {
                  setIsOpen(true);
                }
              }}
              onBlur={() => {
                setIsOpen(false);
              }}
            />

            {/* 학교 검색 결과 */}
            {isOpen && schoolList.length > 0 && (
              <div
                ref={listRef}
                id="school-list"
                role="listbox"
                aria-label="학교 검색 결과"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  width: "100%",
                  minWidth: "260px",
                  zIndex: 20,
                  maxHeight: "240px",
                  overflowY: "auto",
                  marginTop: "4px",
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                }}
              >
                {schoolList.map((school, index) => (
                  <div
                    key={`${school.officeCode}-${school.schoolCode}`}
                    id={`school-option-${index}`}
                    data-school-index={index}
                    role="option"
                    aria-selected={selectedIndex === index}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => selectSchool(school)}
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      backgroundColor: selectedIndex === index ? "#e8f0fe" : "transparent",
                      color: "#222",
                    }}
                  >
                    <div>{school.name}</div>

                    <small style={{ color: "#666" }}>
                      {school.officeName}
                      {school.subOfficeName && ` / ${school.subOfficeName}`}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 대상년월 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <label htmlFor="meal-month">대상년월:</label>

          <select
            id="meal-month"
            name="month"
            value={targetMonth}
            disabled={isGenerating}
            onChange={(event) => {
              setTargetMonth(event.target.value);
              setProcessStatus("idle");
              setMealCount(0);
            }}
          >
            {!targetMonth && <option value="">대상 연월 선택</option>}

            {monthOptions.map(({ year, month }) => {
              const value = formatYearMonth(year, month);

              return (
                <option key={value} value={value}>
                  {year}년 {month}월
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 학교 검색 진행 */}
      {isSearching && <p>학교 검색 중...</p>}

      {/* 선택된 학교 */}
      {schoolCode && (
        <div>
          <h3>선택된 학교</h3>

          <p>학교명: {schoolName}</p>
          <p>소속교육청: {officeName}</p>
          <p>관할지원청: {subOfficeName || "-"}</p>

          <button type="button" onClick={handleMealExcel} disabled={!schoolCode || !officeCode || !targetMonth || isGenerating}>
            {isGenerating ? (processStatus === "fetching" ? "급식 조회 중..." : "엑셀 생성 중...") : "급식 조회 및 엑셀 다운로드"}
          </button>
        </div>
      )}

      {/* 진행 상태 */}
      <div aria-live="polite">
        {processStatus === "fetching" && <p>NEIS 급식 데이터를 조회 중입니다.</p>}

        {processStatus === "generating" && <p>엑셀 파일을 생성 중입니다.</p>}

        {processStatus === "complete" && <p>급식 데이터 {mealCount}건 처리 완료</p>}

        {processStatus === "error" && <p>처리 중 오류가 발생했습니다.</p>}
      </div>

      <p role="status">{message}</p>
    </section>
  );
}
