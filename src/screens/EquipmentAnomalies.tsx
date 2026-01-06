/**
 * EquipmentAnomalies (장비이상 모니터링)
 *
 * 장비별 이상 감지 내역을 확인하고 상태를 직접 관리할 수 있는 화면
 *
 * 주요 기능:
 * - 장비이상 목록 조회 및 검색
 * - 이상 상태 확인 처리 (미확인 → 확인완료)
 * - 정렬 및 필터링
 */

import { useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Switch } from "../app/components/ui/switch";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "../app/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../app/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../app/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "../app/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Dot,
} from "recharts";

export interface Equipment {
  id: string;
  projectName: string;
  equipmentSN: string;
  equipmentName: string;
  issueItem: string;
  measurementValue: number;
  unit: string;
  confirmStatus: "미확인" | "확인완료" | "조치완료";
  confirmedAt: string;
  actionCompletedAt?: string;
  issueDuration: string;
  occurredAt: string;
}

interface TimeSeriesData {
  time: string;
  value: number;
}

interface MultiSeriesData {
  time: string;
  waterTemp: number;
  do: number;
  salinity: number;
}

// 유틸리티 함수들
const CHARTABLE_ITEMS = ["수온", "DO", "염분"];
const isChartableItem = (itemName: string) =>
  CHARTABLE_ITEMS.includes(itemName);

const getUnitForItem = (itemName: string): string => {
  const units: Record<string, string> = {
    수온: "°C",
    DO: " ppm",
    염분: " PSU",
    pH: "",
    "GPS 감도": "",
    "배터리 전압": " V",
  };
  return units[itemName] || "";
};

const formatDateTime = (date: Date): string => {
  // KST 변환 (UTC + 9시간)
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kstDate.toISOString().slice(0, 16).replace("T", " ");
};

const getAlgorithmRange = (itemName: string) => {
  // Fixed baseline ranges (independent of measurementValue)
  const baselineRanges: Record<string, { min: number; max: number }> = {
    수온: { min: 14, max: 22 },
    DO: { min: 5, max: 9 },
    염분: { min: 28, max: 34 },
  };

  return baselineRanges[itemName] || { min: 0, max: 100 };
};

const generateAnomalyData = (equipment: Equipment): TimeSeriesData[] => {
  const occurredTime = new Date(equipment.occurredAt);
  const data: TimeSeriesData[] = [];
  const range = getAlgorithmRange(equipment.issueItem);
  const { measurementValue } = equipment;

  // Determine anomaly direction based on measurementValue
  const isAboveMax = measurementValue > range.max;
  const isBelowMin = measurementValue < range.min;

  // 1시간 간격으로 24시간 데이터 생성 (±12시간)
  for (let i = -12; i <= 12; i++) {
    const time = new Date(occurredTime);
    time.setHours(time.getHours() + i);

    let value: number;

    // i = 0: 발생 시점 - 정확히 measurementValue 사용 (첫 번째 이상치)
    if (i === 0) {
      value = measurementValue;
    }
    // i = 1 또는 2: 추가 이상치 1~2개 생성 (50% 확률)
    else if (i > 0 && i <= 2 && Math.random() > 0.5) {
      if (isAboveMax) {
        // 최대값 위로만 벗어남
        value = range.max + 1 + Math.random() * 2;
      } else if (isBelowMin) {
        // 최소값 아래로만 벗어남
        value = range.min - 1 - Math.random() * 2;
      } else {
        // measurementValue가 정상 범위 내인 경우 (일반적이지 않음)
        value = range.min + Math.random() * (range.max - range.min);
      }
    }
    // 나머지: 정상 범위 내의 값
    else {
      value = range.min + Math.random() * (range.max - range.min);
    }

    data.push({
      time: formatDateTime(time),
      value: Number(value.toFixed(2)), // 소수점 2자리로 제한
    });
  }

  return data;
};

const generateRecentData = (): MultiSeriesData[] => {
  const now = new Date();
  const data: MultiSeriesData[] = [];

  // 1시간 간격으로 24시간 데이터 생성 (정각 기준)
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now);
    time.setHours(time.getHours() - i);
    time.setMinutes(0);
    time.setSeconds(0);
    time.setMilliseconds(0);

    data.push({
      time: formatDateTime(time),
      waterTemp: Number((15 + Math.random() * 5).toFixed(2)), // 15-20°C
      do: Number((6 + Math.random() * 2).toFixed(2)), // 6-8 ppm
      salinity: Number((30 + Math.random() * 5).toFixed(2)), // 30-35 PSU
    });
  }

  return data;
};

const calculateYAxisDomain = (
  itemName: string,
  measurementValue: number
): [number, number] => {
  const range = getAlgorithmRange(itemName);

  // Determine if anomaly is above or below
  const isAboveMax = measurementValue > range.max;
  const isBelowMin = measurementValue < range.min;

  if (isAboveMax) {
    // Show from (min - 2) to (measurementValue + 3)
    return [range.min - 2, measurementValue + 3];
  } else if (isBelowMin) {
    // Show from (measurementValue - 3) to (max + 2)
    return [measurementValue - 3, range.max + 2];
  } else {
    // Default: show full range with padding
    return [range.min - 2, range.max + 2];
  }
};

const mockEquipmentData: Equipment[] = [
  {
    id: "1",
    projectName: "진흥원",
    equipmentSN: "MSB-M-250011",
    equipmentName: "신안 하의 옥도",
    issueItem: "GPS 감도",
    measurementValue: 1.0251,
    unit: "",
    confirmStatus: "조치완료",
    confirmedAt: "2025-10-27 09:05",
    actionCompletedAt: "2025-10-28 14:20",
    issueDuration: "120일",
    occurredAt: "2025-10-26 00:00",
  },
  {
    id: "2",
    projectName: "진흥원",
    equipmentSN: "MSB-M-250011",
    equipmentName: "신안 하의 옥도",
    issueItem: "배터리 전압",
    measurementValue: 9.25,
    unit: "",
    confirmStatus: "미확인",
    confirmedAt: "-",
    issueDuration: "60일",
    occurredAt: "2025-12-18 01:00",
  },
  {
    id: "3",
    projectName: "글로비트EMA",
    equipmentSN: "MRS-M-250001",
    equipmentName: "신영수산",
    issueItem: "DO",
    measurementValue: 0.0,
    unit: "",
    confirmStatus: "미확인",
    confirmedAt: "-",
    issueDuration: "15일",
    occurredAt: "2025-12-03 03:00",
  },
  {
    id: "4",
    projectName: "진흥원",
    equipmentSN: "MSB-M-250012",
    equipmentName: "완도 신지",
    issueItem: "수온",
    measurementValue: 28.5,
    unit: "",
    confirmStatus: "확인완료",
    confirmedAt: "2025-12-15 11:30",
    issueDuration: "5일",
    occurredAt: "2025-12-10 14:00",
  },
  {
    id: "5",
    projectName: "글로비트EMA",
    equipmentSN: "MRS-M-250002",
    equipmentName: "해양수산",
    issueItem: "염분",
    measurementValue: 35.2,
    unit: "",
    confirmStatus: "조치완료",
    confirmedAt: "2025-11-20 08:15",
    actionCompletedAt: "2025-11-22 16:45",
    issueDuration: "30일",
    occurredAt: "2025-11-18 00:00",
  },
  {
    id: "6",
    projectName: "진흥원",
    equipmentSN: "MSB-M-250013",
    equipmentName: "정점 2",
    issueItem: "염분",
    measurementValue: 8.5,
    unit: "",
    confirmStatus: "확인완료",
    confirmedAt: "2025-12-17 10:00",
    issueDuration: "3일",
    occurredAt: "2025-12-14 09:00",
  },
  {
    id: "7",
    projectName: "글로비트EMA",
    equipmentSN: "MRS-M-250003",
    equipmentName: "정점 1",
    issueItem: "수온",
    measurementValue: 12.8,
    unit: "",
    confirmStatus: "미확인",
    confirmedAt: "-",
    issueDuration: "1일",
    occurredAt: "2025-12-18 15:00",
  },
];

export default function EquipmentAnomalies() {
  const equipmentData = mockEquipmentData;
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Equipment>("occurredAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showCompleted, setShowCompleted] = useState(false);

  // 팝업 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );
  const [anomalyChartData, setAnomalyChartData] = useState<TimeSeriesData[]>(
    []
  );
  const [recentChartData, setRecentChartData] = useState<MultiSeriesData[]>([]);

  const handleSort = (field: keyof Equipment) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleEquipmentClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);

    // 차트 데이터 생성
    if (isChartableItem(equipment.issueItem)) {
      setAnomalyChartData(generateAnomalyData(equipment));
    }
    setRecentChartData(generateRecentData());

    setDialogOpen(true);
  };

  // 범위 밖 점 렌더링 함수
  const renderAnomalyDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!selectedEquipment) return <Dot {...props} />;

    const range = getAlgorithmRange(selectedEquipment.issueItem);

    // 범위를 벗어난 점인지 확인
    const isOutOfRange = payload.value < range.min || payload.value > range.max;

    if (isOutOfRange) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#ef4444"
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }

    return <Dot {...props} r={3} fill="#2563eb" />;
  };

  const filteredAndSortedData = equipmentData
    .filter((item) => {
      const matchesSearch =
        (item.projectName?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (item.equipmentSN?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (item.equipmentName?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (item.issueItem?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        );

      const matchesCompletedFilter =
        showCompleted || item.confirmStatus !== "조치완료";

      return matchesSearch && matchesCompletedFilter;
    })
    .sort((a, b) => {
      // 조치완료 항목을 하단으로 정렬
      if (a.confirmStatus === "조치완료" && b.confirmStatus !== "조치완료") {
        return 1;
      }
      if (a.confirmStatus !== "조치완료" && b.confirmStatus === "조치완료") {
        return -1;
      }

      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

  const unconfirmedCount = filteredAndSortedData.filter(
    (item) => item.confirmStatus === "미확인"
  ).length;
  const confirmedCount = filteredAndSortedData.filter(
    (item) => item.confirmStatus === "확인완료"
  ).length;
  const actionCompletedCount = filteredAndSortedData.filter(
    (item) => item.confirmStatus === "조치완료"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900">장비이상 모니터링</h1>
              <p className="text-gray-500 mt-1">
                장비이상 모니터링 이상 감지 내역을 확인하고 관리할 수 있는 화면
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="사업명, 장비S/N, 장점명 또는 이상 항목 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showCompleted}
                    onCheckedChange={setShowCompleted}
                  />
                  <label className="text-sm text-gray-700">
                    조치 완료 내역 포함
                  </label>
                </div>
                <div className="text-sm text-gray-600">
                  미확인 {unconfirmedCount} | 확인완료 {confirmedCount} |
                  조치완료 {actionCompletedCount}
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("projectName")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        사업명
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("equipmentSN")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        장비S/N
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("equipmentName")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        장점명
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("issueItem")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        이상 항목
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("measurementValue")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        측정 수치
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("occurredAt")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        발생 일시
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("issueDuration")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        이상 지속 기간
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("confirmStatus")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        상태
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("confirmedAt")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        확인 일시
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      조치 완료 일시
                    </TableHead>
                    <TableHead className="text-center">작업</TableHead>
                    <TableHead className="text-center">새창 열기</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-center h-24 text-gray-500"
                      >
                        검색 결과가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">
                          {item.projectName}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className="underline cursor-pointer hover:text-blue-600"
                            onClick={() => handleEquipmentClick(item)}
                          >
                            {item.equipmentSN}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.equipmentName}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.issueItem}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.measurementValue}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.occurredAt}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.issueDuration}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.confirmStatus}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.confirmedAt}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.actionCompletedAt || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.confirmStatus === "미확인" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => console.log("확인 완료:", item.id)}
                              className="border-gray-300 text-blue-600 hover:bg-gray-100 text-xs w-28"
                            >
                              확인 완료 처리
                            </Button>
                          ) : item.confirmStatus === "확인완료" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => console.log("조치 완료:", item.id)}
                              className="border-gray-300 text-green-600 hover:bg-gray-100 text-xs w-28"
                            >
                              조치 완료 처리
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log("새창 열기:", item.id)}
                            className="border-gray-300 text-gray-700 hover:bg-gray-100 text-xs"
                          >
                            열기
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500 min-w-[120px]">
                총 {filteredAndSortedData.length}개의 항목
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => console.log("이전 페이지")}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      isActive
                      onClick={() => console.log("페이지 1")}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => console.log("다음 페이지")}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="flex items-center gap-2 min-w-[180px]">
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  페이지당 표시:
                </span>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  defaultValue="10"
                  onChange={(e) =>
                    console.log("페이지 사이즈 변경:", e.target.value)
                  }
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 장비 상세 팝업 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              장비 상세 / {selectedEquipment?.equipmentSN}
            </DialogTitle>
            <DialogDescription>
              {selectedEquipment?.projectName} |{" "}
              {selectedEquipment?.equipmentName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 상단 차트 - 차트 표시 가능 항목만 */}
            {selectedEquipment &&
            isChartableItem(selectedEquipment.issueItem) ? (
              <div>
                {/* 캡션 */}
                <div className="text-sm text-gray-600 mb-2">
                  {selectedEquipment.occurredAt} | {selectedEquipment.issueItem}{" "}
                  이상 | 측정값: {selectedEquipment.measurementValue}
                  {getUnitForItem(selectedEquipment.issueItem)}
                </div>

                {/* 차트 */}
                <div className="h-[300px]">
                  <ChartContainer
                    config={{
                      value: {
                        label: selectedEquipment.issueItem,
                        color: "#2563eb",
                      },
                    }}
                  >
                    <LineChart data={anomalyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis
                        domain={calculateYAxisDomain(
                          selectedEquipment.issueItem,
                          selectedEquipment.measurementValue
                        )}
                        tickFormatter={(value) => Math.round(value).toString()}
                      />

                      {/* 정상 범위 배경색 (최소~최대) */}
                      <ReferenceArea
                        y1={getAlgorithmRange(selectedEquipment.issueItem).min}
                        y2={getAlgorithmRange(selectedEquipment.issueItem).max}
                        fill="#22c55e"
                        fillOpacity={0.1}
                        stroke="none"
                      />

                      {/* 알고리즘 최소선 */}
                      <ReferenceLine
                        y={getAlgorithmRange(selectedEquipment.issueItem).min}
                        stroke="#dc2626"
                        strokeDasharray="3 3"
                        label="최소"
                      />

                      {/* 알고리즘 최대선 */}
                      <ReferenceLine
                        y={getAlgorithmRange(selectedEquipment.issueItem).max}
                        stroke="#dc2626"
                        strokeDasharray="3 3"
                        label="최대"
                      />

                      {/* 실측선 */}
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={renderAnomalyDot}
                      />

                      <ChartTooltip content={<ChartTooltipContent />} />
                    </LineChart>
                  </ChartContainer>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                {selectedEquipment?.issueItem} 항목은 차트를 지원하지 않습니다.
              </div>
            )}

            {/* 하단 차트 - 항상 표시 */}
            <div>
              <h3 className="text-sm font-medium mb-2">
                최근 24시간 측정 추이
              </h3>
              <div className="h-[300px]">
                <ChartContainer
                  config={{
                    waterTemp: {
                      label: "수온",
                      color: "#2563eb",
                    },
                    do: {
                      label: "DO",
                      color: "#16a34a",
                    },
                    salinity: {
                      label: "염분",
                      color: "#9333ea",
                    },
                  }}
                >
                  <LineChart data={recentChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />

                    {/* 3개의 측정 항목 */}
                    <Line
                      type="monotone"
                      dataKey="waterTemp"
                      stroke="#2563eb"
                      name="수온"
                    />
                    <Line
                      type="monotone"
                      dataKey="do"
                      stroke="#16a34a"
                      name="DO"
                    />
                    <Line
                      type="monotone"
                      dataKey="salinity"
                      stroke="#9333ea"
                      name="염분"
                    />

                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
                </ChartContainer>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
