"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Layers,
  RefreshCw,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * ETF 数据监控面板首页
 * 颜色逻辑：红色背景 = 买/高值/true，绿色背景 = 卖/低值/false
 */

interface StockData {
  id: number;
  stockCode: string;
  stockName: string | null;
  industry: string;
  totalScore: number | null;
  greaterThanM5Price: number | null;
  greaterThanM10Price: number | null;
  greaterThanM20Price: number | null;
  m0Percent: number | null;
  m5Percent: number | null;
  m10Percent: number | null;
  m20Percent: number | null;
  maMeanRatio: number | null;
  growthStockCount: number | null;
  totalStockCount: number | null;
  latestPrice: number | null;
  createTime: string;
}

type SortField = keyof StockData;
type SortOrder = "asc" | "desc";

// ========== 格式化工具 ==========
const formatPercent = (value: number | null): string => {
  if (value === null || value === undefined) return "-";
  return `${(value * 100).toFixed(2)}%`;
};

const formatBoolean = (value: number | null): string => {
  if (value === null || value === undefined) return "-";
  return value ? "100%" : "0%";
};

const formatTime = (timeStr: string): string => {
  if (!timeStr) return "-";
  if (timeStr.includes("T")) {
    return timeStr.replace("T", " ").substring(0, 16);
  }
  return timeStr.substring(0, 16);
};

// ========== 样式工具（与参考 Demo 一致）==========
// 百分比 >= 50% 为高（红色），< 50% 为低（绿色）
const getPercentBgClass = (value: number | null): string => {
  if (value === null || value === undefined) return "";
  return value >= 0.5
    ? "bg-red-100 text-red-800"
    : "bg-green-100 text-green-800";
};

// 布尔值 true 为红色，false 为绿色
const getBooleanBgClass = (value: number | null): string => {
  if (value === null || value === undefined) return "";
  return value ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
};

// 总分 >= 3 为高（红色），< 3 为低（绿色）
const getScoreBgClass = (score: number | null): string => {
  if (score === null || score === undefined) return "";
  return score >= 3 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
};

// 买卖信号：总分 <= 2 为卖（绿色），> 2 为买（红色），null 时返回 null
const calculateSignal = (totalScore: number | null): string | null => {
  if (totalScore === null || totalScore === undefined) return null;
  return totalScore <= 2 ? "卖" : "买";
};

const getSignalBgClass = (signal: string | null): string => {
  if (signal === null) return "";
  return signal === "买"
    ? "bg-red-100 text-red-800"
    : "bg-green-100 text-green-800";
};

export default function HomePage() {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">(
    "online"
  );
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  const previousDataRef = useRef<StockData[]>([]);
  const isFirstLoadRef = useRef(true);
  const [changedCodes, setChangedCodes] = useState<Set<string>>(new Set());
  const [newCodes, setNewCodes] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (sortField && sortOrder) {
        params.set("sortBy", sortField);
        params.set("sortOrder", sortOrder);
      }
      const res = await fetch(`/api/stock/data?${params.toString()}`);
      const json = await res.json();
      if (json.code === "OK") {
        const newData: StockData[] = json.data;

        // 检测数据变化（非首次加载）
        if (!isFirstLoadRef.current) {
          const newCodesSet = new Set<string>();
          const changedCodesSet = new Set<string>();

          for (const item of newData) {
            const oldItem = previousDataRef.current.find(
              (d) => d.stockCode === item.stockCode
            );
            if (!oldItem) {
              newCodesSet.add(item.stockCode);
            } else if (JSON.stringify(oldItem) !== JSON.stringify(item)) {
              changedCodesSet.add(item.stockCode);
            }
          }

          setNewCodes(newCodesSet);
          setChangedCodes(changedCodesSet);

          // 2秒后清除高亮
          setTimeout(() => {
            setNewCodes(new Set());
            setChangedCodes(new Set());
          }, 2000);
        }

        previousDataRef.current = newData;
        isFirstLoadRef.current = false;
        setData(newData);
        setLastUpdateTime(newData[0]?.createTime || "");
        setNetworkStatus("online");
      }
    } catch (err) {
      console.error("获取数据失败:", err);
      setNetworkStatus("offline");
    } finally {
      setLoading(false);
    }
  }, [sortField, sortOrder]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // 统计数据
  const stats = useMemo(() => {
    const total = data.length;
    const validScores = data.filter((d) => d.totalScore !== null);
    const avgScore = validScores.length
      ? validScores.reduce((sum, d) => sum + (d.totalScore || 0), 0) /
        validScores.length
      : 0;
    const buySignalCount = data.filter((d) => (d.totalScore || 0) >= 3).length;
    // 大盘指数占比 = M5占比均值
    const marketIndexRatio = data.length
      ? data.reduce((sum, d) => sum + (d.m5Percent || 0), 0) / data.length
      : 0;
    const avgM10 = data.length
      ? data.reduce((sum, d) => sum + (d.m10Percent || 0), 0) / data.length
      : 0;
    const avgM20 = data.length
      ? data.reduce((sum, d) => sum + (d.m20Percent || 0), 0) / data.length
      : 0;
    // Ma均值占比 = maMeanRatio均值
    const avgMaMean = data.length
      ? data.reduce((sum, d) => sum + (d.maMeanRatio || 0), 0) / data.length
      : 0;
    const totalGrowth = data.reduce(
      (sum, d) => sum + (d.growthStockCount || 0),
      0
    );
    const totalStocks = data.reduce(
      (sum, d) => sum + (d.totalStockCount || 0),
      0
    );
    // 大盘趋势：大盘指数占比 > 50% 为买，否则为卖
    const marketTrend = marketIndexRatio >= 0.5 ? "买" : "卖";

    return {
      total,
      avgScore,
      buySignalCount,
      marketIndexRatio,
      avgM10,
      avgM20,
      avgMaMean,
      totalGrowth,
      totalStocks,
      marketTrend,
    };
  }, [data]);

  // 排序后的数据
  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [data, sortField, sortOrder]);

  const getRowAnimationClass = (stockCode: string): string => {
    if (newCodes.has(stockCode)) return "animate-pulse bg-success/20";
    if (changedCodes.has(stockCode)) return "animate-pulse bg-info/20";
    return "";
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="inline h-3 w-3 opacity-40" />;
    if (sortOrder === "asc")
      return <ArrowUp className="inline h-3 w-3 text-primary" />;
    return <ArrowDown className="inline h-3 w-3 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 顶部导航 */}
      <header className="navbar bg-base-100/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="flex-1">
          <div className="px-4 flex items-center gap-3">
            <div className="relative">
              <BarChart3 className="h-8 w-8 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <BarChart3 className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                ETF 数据监控面板
              </h1>
              <p className="text-xs text-purple-300/80 font-medium tracking-wider hidden sm:block">
                实时数据监控 · 智能分析决策
              </p>
            </div>
          </div>
        </div>
        <div className="flex-none flex items-center gap-4 pr-4">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            {networkStatus === "online" ? (
              <Wifi className="h-4 w-4 text-success" />
            ) : (
              <WifiOff className="h-4 w-4 text-error" />
            )}
            <span>
              {lastUpdateTime ? formatTime(lastUpdateTime) : "加载中..."}
            </span>
          </div>
          <div className="text-white/80 text-sm">
            数据条数:{" "}
            <span className="font-semibold text-white">{data.length}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-white"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto p-4 space-y-4">
        {/* 统计卡片 */}
        <div className="stats stats-vertical lg:stats-horizontal shadow-xl w-full bg-base-100/95 backdrop-blur">
          <div className="stat">
            <div className="stat-title">大盘趋势</div>
            <div
              className={`stat-value ${
                stats.marketTrend === "买" ? "text-error" : "text-success"
              }`}
            >
              <span
                className={`px-3 py-1 rounded ${
                  stats.marketTrend === "买" ? "bg-red-100" : "bg-green-100"
                }`}
              >
                {stats.marketTrend}
              </span>
            </div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div className="stat-title">平均分数</div>
            <div className="stat-value text-secondary">
              {stats.avgScore.toFixed(2)}
            </div>
          </div>

          <div className="stat">
            <div className="stat-title">大盘指数占比</div>
            <div className="stat-value text-sm">
              {(stats.marketIndexRatio * 100).toFixed(2)}%
            </div>
          </div>

          <div className="stat">
            <div className="stat-title">M10 均值</div>
            <div className="stat-value text-sm">
              {(stats.avgM10 * 100).toFixed(2)}%
            </div>
          </div>

          <div className="stat">
            <div className="stat-title">M20 均值</div>
            <div className="stat-value text-sm">
              {(stats.avgM20 * 100).toFixed(2)}%
            </div>
          </div>

          <div className="stat">
            <div className="stat-title">Ma均值占比</div>
            <div className="stat-value text-sm">
              {(stats.avgMaMean * 100).toFixed(2)}%
            </div>
          </div>

          <div className="stat">
            <div className="stat-figure text-success">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div className="stat-title">增长股数</div>
            <div className="stat-value text-success">{stats.totalGrowth}</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-info">
              <Layers className="h-8 w-8" />
            </div>
            <div className="stat-title">总股数</div>
            <div className="stat-value text-info">{stats.totalStocks}</div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="card bg-base-100/95 backdrop-blur shadow-xl">
          <div className="card-body p-0">
            <table className="table table-zebra table-pin-rows text-sm [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
              <thead>
                <tr className="bg-base-200">
                  <SortableTh
                    field="createTime"
                    label="更新时间"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="createTime" />}
                  />
                  <SortableTh
                    field="stockCode"
                    label="代码"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="stockCode" />}
                  />
                  <SortableTh
                    field="industry"
                    label="行业"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="industry" />}
                  />
                  <SortableTh
                    field="stockName"
                    label="名称"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="stockName" />}
                  />
                  <SortableTh
                    field="totalScore"
                    label="总分"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="totalScore" />}
                  />
                  <th className="text-center">买卖信号</th>
                  <SortableTh
                    field="greaterThanM5Price"
                    label="5日"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="greaterThanM5Price" />}
                  />
                  <SortableTh
                    field="greaterThanM10Price"
                    label="10日"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="greaterThanM10Price" />}
                  />
                  <SortableTh
                    field="greaterThanM20Price"
                    label="20日"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="greaterThanM20Price" />}
                  />
                  <SortableTh
                    field="m0Percent"
                    label="M0占比"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="m0Percent" />}
                  />
                  <SortableTh
                    field="m5Percent"
                    label="M5占比"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="m5Percent" />}
                  />
                  <SortableTh
                    field="m10Percent"
                    label="M10占比"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="m10Percent" />}
                  />
                  <SortableTh
                    field="m20Percent"
                    label="M20占比"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="m20Percent" />}
                  />
                  <SortableTh
                    field="maMeanRatio"
                    label="Ma均值"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="maMeanRatio" />}
                  />
                  <SortableTh
                    field="growthStockCount"
                    label="增长股数"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="growthStockCount" />}
                  />
                  <SortableTh
                    field="totalStockCount"
                    label="总股数"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    icon={<SortIcon field="totalStockCount" />}
                  />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={16} className="text-center py-12">
                      <span className="loading loading-spinner loading-lg" />
                    </td>
                  </tr>
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={16}
                      className="text-center py-12 text-base-content/50"
                    >
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  sortedData.map((item) => {
                    const signal = calculateSignal(item.totalScore);
                    return (
                      <tr
                        key={item.id || item.stockCode}
                        className={`hover ${getRowAnimationClass(
                          item.stockCode
                        )}`}
                      >
                        <td className="text-xs text-base-content/60 whitespace-nowrap">
                          {formatTime(item.createTime)}
                        </td>
                        <td className="font-semibold text-primary">
                          {item.stockCode || "-"}
                        </td>
                        <td>{item.industry || "-"}</td>
                        <td className="font-medium">{item.stockName || "-"}</td>
                        <td
                          className={`text-center font-bold ${getScoreBgClass(
                            item.totalScore
                          )}`}
                        >
                          {item.totalScore ?? "-"}
                        </td>
                        <td
                          className={`text-center font-bold ${getSignalBgClass(
                            signal
                          )}`}
                        >
                          {signal ?? "-"}
                        </td>
                        <td
                          className={`text-center font-semibold ${getBooleanBgClass(
                            item.greaterThanM5Price
                          )}`}
                        >
                          {formatBoolean(item.greaterThanM5Price)}
                        </td>
                        <td
                          className={`text-center font-semibold ${getBooleanBgClass(
                            item.greaterThanM10Price
                          )}`}
                        >
                          {formatBoolean(item.greaterThanM10Price)}
                        </td>
                        <td
                          className={`text-center font-semibold ${getBooleanBgClass(
                            item.greaterThanM20Price
                          )}`}
                        >
                          {formatBoolean(item.greaterThanM20Price)}
                        </td>
                        <td
                          className={`text-center font-semibold ${getPercentBgClass(
                            item.m0Percent
                          )}`}
                        >
                          {formatPercent(item.m0Percent)}
                        </td>
                        <td
                          className={`text-center font-semibold ${getPercentBgClass(
                            item.m5Percent
                          )}`}
                        >
                          {formatPercent(item.m5Percent)}
                        </td>
                        <td
                          className={`text-center font-semibold ${getPercentBgClass(
                            item.m10Percent
                          )}`}
                        >
                          {formatPercent(item.m10Percent)}
                        </td>
                        <td
                          className={`text-center font-semibold ${getPercentBgClass(
                            item.m20Percent
                          )}`}
                        >
                          {formatPercent(item.m20Percent)}
                        </td>
                        <td
                          className={`text-center font-semibold ${getPercentBgClass(
                            item.maMeanRatio
                          )}`}
                        >
                          {formatPercent(item.maMeanRatio)}
                        </td>
                        <td className="text-center">
                          {item.growthStockCount ?? "-"}
                        </td>
                        <td className="text-center">
                          {item.totalStockCount ?? "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// ========== 可排序表头组件 ==========
interface SortableThProps {
  field: SortField;
  label: string;
  sortField: SortField | null;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  icon: React.ReactNode;
}

function SortableTh({ field, label, onSort, icon }: SortableThProps) {
  return (
    <th
      className="cursor-pointer select-none hover:bg-base-300 transition-colors text-center whitespace-nowrap"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center justify-center gap-1">
        {label}
        {icon}
      </span>
    </th>
  );
}
