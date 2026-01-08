"use client";

/**
 * 分页组件
 * @description 通用分页组件，支持页码跳转和每页数量选择
 */

import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icon";

interface PaginationProps {
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总记录数 */
  total: number;
  /** 页码变化回调 */
  onPageChange: (page: number) => void;
  /** 每页数量变化回调 */
  onPageSizeChange?: (pageSize: number) => void;
  /** 每页数量选项 */
  pageSizeOptions?: number[];
  /** 是否显示每页数量选择器 */
  showSizeChanger?: boolean;
  /** 是否显示总数 */
  showTotal?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 生成页码数组
 */
function generatePageNumbers(
  current: number,
  total: number
): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [];
  const maxVisible = 7;

  if (total <= maxVisible) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  // 始终显示第一页
  pages.push(1);

  if (current > 3) {
    pages.push("ellipsis");
  }

  // 当前页附近的页码
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  // 始终显示最后一页
  if (total > 1) {
    pages.push(total);
  }

  return pages;
}

/**
 * 分页组件
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showSizeChanger = true,
  showTotal = true,
  className,
}: PaginationProps) {
  const totalPages = useMemo(
    () => Math.ceil(total / pageSize),
    [total, pageSize]
  );
  const pageNumbers = useMemo(
    () => generatePageNumbers(page, totalPages),
    [page, totalPages]
  );

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      onPageChange(newPage);
    }
  };

  if (total === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4",
        className
      )}
    >
      {/* 左侧：总数和每页数量 */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {showTotal && <span>共 {total} 条</span>}
        {showSizeChanger && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>每页</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-input bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>条</span>
          </div>
        )}
      </div>

      {/* 右侧：页码 */}
      <div className="flex items-center gap-1">
        {/* 上一页 */}
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => handlePageChange(page - 1)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded border border-input bg-background transition-colors",
            canGoPrev
              ? "hover:bg-accent hover:text-accent-foreground"
              : "cursor-not-allowed opacity-50"
          )}
        >
          <ChevronLeftIcon size="sm" />
        </button>

        {/* 页码 */}
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === "ellipsis") {
            const prev = pageNumbers[index - 1];
            const next = pageNumbers[index + 1];
            const key = `ellipsis-${String(prev ?? "start")}-${String(
              next ?? "end"
            )}`;
            return (
              <span
                key={key}
                className="flex h-8 w-8 items-center justify-center text-muted-foreground"
              >
                ...
              </span>
            );
          }

          const isActive = pageNum === page;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => handlePageChange(pageNum)}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded border border-input px-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {pageNum}
            </button>
          );
        })}

        {/* 下一页 */}
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => handlePageChange(page + 1)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded border border-input bg-background transition-colors",
            canGoNext
              ? "hover:bg-accent hover:text-accent-foreground"
              : "cursor-not-allowed opacity-50"
          )}
        >
          <ChevronRightIcon size="sm" />
        </button>
      </div>
    </div>
  );
}
