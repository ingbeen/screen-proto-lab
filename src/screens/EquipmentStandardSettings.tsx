/**
 * EquipmentStandardSettings (장비이상 기준설정)
 *
 * 장비별 이상 감지 기준을 설정하고 관리하는 화면
 *
 * 주요 기능:
 * - 정점별 기준 범위 조회 및 검색
 * - 단건 기준 설정 (행 클릭)
 * - 일괄 기준 설정 (체크박스 선택)
 */

import { useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Checkbox } from "../app/components/ui/checkbox";
import { Badge } from "../app/components/ui/badge";
import { Label } from "../app/components/ui/label";
import { Switch } from "../app/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../app/components/ui/dialog";
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

export interface EquipmentStandard {
  id: string;
  projectName: string;
  equipmentSN: string;
  pointName: string;
  lastMeasuredAt: string;
  batteryVoltage: number;
  isVerified: boolean;
}

const mockStandardData: EquipmentStandard[] = [
  {
    id: "1",
    projectName: "진흥원",
    equipmentSN: "MSB-M-250011",
    pointName: "신안 하의 옥도",
    lastMeasuredAt: "2025-12-18 14:30",
    batteryVoltage: 12.5,
    isVerified: true,
  },
  {
    id: "2",
    projectName: "진흥원",
    equipmentSN: "MSB-M-250012",
    pointName: "완도 신지",
    lastMeasuredAt: "2025-12-18 14:25",
    batteryVoltage: 11.8,
    isVerified: true,
  },
  {
    id: "3",
    projectName: "글로비트EMA",
    equipmentSN: "MRS-M-250001",
    pointName: "신영수산",
    lastMeasuredAt: "2025-12-18 14:20",
    batteryVoltage: 12.1,
    isVerified: false,
  },
  {
    id: "4",
    projectName: "진흥원",
    equipmentSN: "MSB-M-250013",
    pointName: "정점 2",
    lastMeasuredAt: "2025-12-18 14:15",
    batteryVoltage: 12.3,
    isVerified: true,
  },
  {
    id: "5",
    projectName: "글로비트EMA",
    equipmentSN: "MRS-M-250002",
    pointName: "해양수산",
    lastMeasuredAt: "2025-12-18 14:10",
    batteryVoltage: 11.5,
    isVerified: false,
  },
  {
    id: "6",
    projectName: "글로비트EMA",
    equipmentSN: "MRS-M-250003",
    pointName: "정점 1",
    lastMeasuredAt: "2025-12-18 14:05",
    batteryVoltage: 12.0,
    isVerified: true,
  },
  {
    id: "7",
    projectName: "진흥원",
    equipmentSN: "MSB-M-250014",
    pointName: "정점 3",
    lastMeasuredAt: "2025-12-18 14:00",
    batteryVoltage: 11.9,
    isVerified: false,
  },
];

interface StandardRange {
  gpsSensitivityMin: string;
  gpsSensitivityMax: string;
  batteryVoltageMin: string;
  batteryVoltageMax: string;
  waterTempMin: string;
  waterTempMax: string;
  doMin: string;
  doMax: string;
  dailyMeasurementCountMin: string;
  dailyMeasurementCountMax: string;
}

export default function EquipmentStandardSettings() {
  const equipmentData = mockStandardData;
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] =
    useState<keyof EquipmentStandard>("lastMeasuredAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 팝업 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"single" | "batch">("single");
  const [selectedItem, setSelectedItem] = useState<EquipmentStandard | null>(
    null
  );
  const [isActivated, setIsActivated] = useState(false);
  const [standardRange, setStandardRange] = useState<StandardRange>({
    gpsSensitivityMin: "",
    gpsSensitivityMax: "",
    batteryVoltageMin: "",
    batteryVoltageMax: "",
    waterTempMin: "",
    waterTempMax: "",
    doMin: "",
    doMax: "",
    dailyMeasurementCountMin: "",
    dailyMeasurementCountMax: "",
  });

  const handleSort = (field: keyof EquipmentStandard) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
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
        (item.pointName?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        );

      return matchesSearch;
    })
    .sort((a, b) => {
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

      if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        return sortDirection === "asc"
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }

      return 0;
    });

  // 전체 선택 상태 계산
  const allSelected =
    filteredAndSortedData.length > 0 &&
    filteredAndSortedData.every((item) => selectedIds.includes(item.id));
  const someSelected =
    selectedIds.length > 0 &&
    filteredAndSortedData.some((item) => selectedIds.includes(item.id)) &&
    !allSelected;

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedData.map((item) => item.id));
    }
  };

  // 개별 선택/해제
  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  // 행 클릭 - 단건 팝업
  const handleRowClick = (item: EquipmentStandard) => {
    setDialogMode("single");
    setSelectedItem(item);
    setIsActivated(item.isVerified);
    setStandardRange({
      gpsSensitivityMin: "5",
      gpsSensitivityMax: "15",
      batteryVoltageMin: "11.0",
      batteryVoltageMax: "13.0",
      waterTempMin: "0",
      waterTempMax: "30",
      doMin: "5",
      doMax: "12",
      dailyMeasurementCountMin: "24",
      dailyMeasurementCountMax: "24",
    });
    setDialogOpen(true);
  };

  // 선택 적용 버튼 - 일괄 팝업
  const handleBatchApply = () => {
    if (selectedIds.length === 0) {
      alert("적용할 항목을 선택해주세요.");
      return;
    }
    setDialogMode("batch");
    setSelectedItem(null);
    setIsActivated(true);
    setStandardRange({
      gpsSensitivityMin: "5",
      gpsSensitivityMax: "15",
      batteryVoltageMin: "11.0",
      batteryVoltageMax: "13.0",
      waterTempMin: "0",
      waterTempMax: "30",
      doMin: "5",
      doMax: "12",
      dailyMeasurementCountMin: "24",
      dailyMeasurementCountMax: "24",
    });
    setDialogOpen(true);
  };

  // 팝업 저장
  const handleSaveStandard = () => {
    if (dialogMode === "single" && selectedItem) {
      console.log(`[단건 적용] 정점: ${selectedItem.pointName}`, standardRange);
    } else if (dialogMode === "batch") {
      console.log(
        `[일괄 적용] 선택된 ${selectedIds.length}개 항목에 적용`,
        standardRange
      );
    }
    setDialogOpen(false);
  };

  const verifiedCount = filteredAndSortedData.filter(
    (item) => item.isVerified
  ).length;
  const unverifiedCount = filteredAndSortedData.length - verifiedCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900">장비이상 기준설정</h1>
              <p className="text-gray-500 mt-1">
                정점별 이상 감지 기준 범위를 설정하고 관리할 수 있는 화면
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
                  placeholder="사업명, 장비S/N 또는 정점명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleBatchApply}
                  disabled={selectedIds.length === 0}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  선택 적용 ({selectedIds.length})
                </Button>
                <div className="text-sm text-gray-600">
                  활성화 {verifiedCount} | 비활성화 {unverifiedCount}
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-center w-12">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={allSelected}
                          ref={(el) => {
                            if (el) {
                              el.dataset.state = someSelected
                                ? "indeterminate"
                                : allSelected
                                ? "checked"
                                : "unchecked";
                            }
                          }}
                          onCheckedChange={handleSelectAll}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </TableHead>
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
                        장비 S/N
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("pointName")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        정점명
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("lastMeasuredAt")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        최근 측정 일시
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("batteryVoltage")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        배터리 전압 (V)
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("isVerified")}
                        className="hover:bg-transparent p-0 mx-auto"
                      >
                        검증여부
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center h-24 text-gray-500"
                      >
                        검색 결과가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedData.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRowClick(item)}
                      >
                        <TableCell className="text-center">
                          <div
                            className="flex justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selectedIds.includes(item.id)}
                              onCheckedChange={(checked) =>
                                handleSelectItem(item.id, checked as boolean)
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.projectName}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.equipmentSN}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.pointName}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.lastMeasuredAt}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.batteryVoltage}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge
                              variant={
                                item.isVerified ? "default" : "secondary"
                              }
                              className={
                                item.isVerified
                                  ? "bg-green-100 text-green-700 border-green-200 cursor-default"
                                  : "bg-gray-100 text-gray-600 border-gray-200 cursor-default"
                              }
                            >
                              {item.isVerified ? "활성화" : "비활성화"}
                            </Badge>
                          </div>
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

      {/* 기준 범위 설정 팝업 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "single"
                ? `기준 범위 설정 - ${selectedItem?.pointName || ""}`
                : `일괄 기준 범위 설정 (${selectedIds.length}개 항목)`}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "single"
                ? "해당 정점의 이상 감지 기준 범위를 설정합니다."
                : "선택한 정점들에 동일한 기준 범위를 적용합니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 활성화 토글 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activated" className="text-right col-span-1">
                활성화
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch
                  id="activated"
                  checked={isActivated}
                  onCheckedChange={setIsActivated}
                />
                <span className="text-sm text-gray-600">
                  {isActivated ? "활성화됨" : "비활성화됨"}
                </span>
              </div>
            </div>
            {/* GPS 감도 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gps-min" className="text-right col-span-1">
                GPS 감도
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="gps-min"
                  type="number"
                  placeholder="최소값"
                  value={standardRange.gpsSensitivityMin}
                  onChange={(e) =>
                    setStandardRange({
                      ...standardRange,
                      gpsSensitivityMin: e.target.value,
                    })
                  }
                  className="flex-1"
                />
                <span className="text-gray-500">~</span>
                <Input
                  id="gps-max"
                  type="number"
                  placeholder="최대값"
                  value={standardRange.gpsSensitivityMax}
                  onChange={(e) =>
                    setStandardRange({
                      ...standardRange,
                      gpsSensitivityMax: e.target.value,
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>

            {/* 배터리 전압 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="battery-min" className="text-right col-span-1">
                배터리 전압
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="battery-min"
                  type="number"
                  placeholder="최소값"
                  value={standardRange.batteryVoltageMin}
                  onChange={(e) =>
                    setStandardRange({
                      ...standardRange,
                      batteryVoltageMin: e.target.value,
                    })
                  }
                  className="flex-1"
                />
                <span className="text-gray-500">~</span>
                <Input
                  id="battery-max"
                  type="number"
                  placeholder="최대값"
                  value={standardRange.batteryVoltageMax}
                  onChange={(e) =>
                    setStandardRange({
                      ...standardRange,
                      batteryVoltageMax: e.target.value,
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>

            {/* 수온 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="temp-min" className="text-right col-span-1">
                수온
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="temp-min"
                  type="number"
                  placeholder="최소값"
                  value={standardRange.waterTempMin}
                  onChange={(e) =>
                    setStandardRange({
                      ...standardRange,
                      waterTempMin: e.target.value,
                    })
                  }
                  className="flex-1"
                />
                <span className="text-gray-500">~</span>
                <Input
                  id="temp-max"
                  type="number"
                  placeholder="최대값"
                  value={standardRange.waterTempMax}
                  onChange={(e) =>
                    setStandardRange({
                      ...standardRange,
                      waterTempMax: e.target.value,
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>

            {/* DO */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="do-min" className="text-right col-span-1">
                DO
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="do-min"
                  type="number"
                  placeholder="최소값"
                  value={standardRange.doMin}
                  onChange={(e) =>
                    setStandardRange({
                      ...standardRange,
                      doMin: e.target.value,
                    })
                  }
                  className="flex-1"
                />
                <span className="text-gray-500">~</span>
                <Input
                  id="do-max"
                  type="number"
                  placeholder="최대값"
                  value={standardRange.doMax}
                  onChange={(e) =>
                    setStandardRange({
                      ...standardRange,
                      doMax: e.target.value,
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>

            {/* 일별 데이터 측정 횟수 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="count-min" className="text-right col-span-1">
                일별 측정 횟수
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="count-min"
                  type="number"
                  placeholder="최소값"
                  value={standardRange.dailyMeasurementCountMin}
                  onChange={(e) =>
                    setStandardRange({
                      ...standardRange,
                      dailyMeasurementCountMin: e.target.value,
                    })
                  }
                  className="flex-1"
                />
                <span className="text-gray-500">~</span>
                <Input
                  id="count-max"
                  type="number"
                  placeholder="최대값"
                  value={standardRange.dailyMeasurementCountMax}
                  onChange={(e) =>
                    setStandardRange({
                      ...standardRange,
                      dailyMeasurementCountMax: e.target.value,
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveStandard}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
