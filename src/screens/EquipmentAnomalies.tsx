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
    occurredAt: "2025-10-26 00:30",
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
    occurredAt: "2025-12-18 00:30",
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
    occurredAt: "2025-12-03 00:30",
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
    issueItem: "pH",
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
    occurredAt: "2025-12-18 15:30",
  },
];

export default function EquipmentAnomalies() {
  const equipmentData = mockEquipmentData;
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Equipment>("occurredAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showCompleted, setShowCompleted] = useState(false);

  const handleSort = (field: keyof Equipment) => {
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
              <h1 className="text-gray-900">장비이상 모니터링(가제)</h1>
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
                          {item.equipmentSN}
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
                              size="sm"
                              onClick={() => console.log("확인 완료:", item.id)}
                              className="bg-blue-500 hover:bg-blue-600 text-white w-24"
                            >
                              확인 완료
                            </Button>
                          ) : item.confirmStatus === "확인완료" ? (
                            <Button
                              size="sm"
                              onClick={() => console.log("조치 완료:", item.id)}
                              className="bg-green-500 hover:bg-green-600 text-white w-24"
                            >
                              조치 완료
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
                            className="text-red-500 border-red-300 hover:bg-red-50"
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
    </div>
  );
}
