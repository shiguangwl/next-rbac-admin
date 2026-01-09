/**
 * TimeSeriesDataService
 *
 * 负责与后端时间序列接口通信，封装 fetch 调用逻辑。
 */
const TimeSeriesDataService = {
    /**
     * 获取时间序列数据
     *
     * @param {string|null} startTime LocalDateTime 字符串，格式 yyyy-MM-ddTHH:mm:ss
     * @param {string|null} endTime   LocalDateTime 字符串，格式 yyyy-MM-ddTHH:mm:ss
     * @param {number} page           页码，从 1 开始
     * @param {number} size           每页条数
     * @returns {Promise<any>}        后端返回的完整 JSON 响应
     */
    async fetchTimeSeriesData(startTime, endTime, page = 1, size = 10) {
        // 使用全局配置中的 BASE_API_URL
        let url = `${BASE_API_URL}/dataApi/getTimeSeriesData`;
        const params = new URLSearchParams();
        if (startTime) {
            params.append("startTime", startTime);
        }
        if (endTime) {
            params.append("endTime", endTime);
        }
        params.append("page", page);
        params.append("size", size);
        url += "?" + params.toString();

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        return await response.json();
    },
};

// ========== 数据格式化层 ==========
/**
 * TimeSeriesFormatter
 *
 * 仅负责对原始数据进行展示层的格式化处理（如百分比、小数、中文文案等）。
 * 不做任何业务判断，方便替换和单独测试。
 */
const TimeSeriesFormatter = {
    /**
     * 格式化百分比
     */
    formatPercent(value) {
        return CommonFormatter.formatPercent(value);
    },

    /**
     * 格式化布尔值
     */
    formatBoolean(value) {
        if (value === null || value === undefined) {
            return "-";
        }
        return value ? "是" : "否";
    },

    /**
     * 格式化买卖信号
     */
    formatBuySellSignal(signal) {
        return CommonFormatter.formatBuySellSignal(signal);
    },

    /**
     * 根据总分计算买卖信号
     */
    calculateBuySellSignal(totalScore) {
        if (totalScore === null || totalScore === undefined) return "卖";
        // 0, 1, 2 = 卖，其余 = 买
        return totalScore <= 2 ? "卖" : "买";
    },
};

// ========== UI 渲染层 ==========
/**
 * TimeSeriesUIRenderer
 *
 * 负责 DOM 操作和可视化展示：表格、分页、网络状态、错误提示等。
 * 不直接调用后端，仅接收已经准备好的数据对象。
 */
const TimeSeriesUIRenderer = {
    /**
     * 更新网络状态显示
     */
    updateNetworkStatus(status) {
        const statusElement = document.getElementById("networkStatus");
        if (statusElement) {
            statusElement.className = `network-status ${status}`;
            statusElement.textContent = status === "online" ? "● 在线" : "○ 离线";
        }
    },

    /**
     * 更新最后更新时间
     */
    updateLastUpdateTime() {
        const element = document.getElementById("lastUpdate");
        if (element) {
            const now = new Date();
            element.textContent = `最后更新: ${now.toLocaleString("zh-CN")}`;
        }
    },

    /**
     * 更新统计信息
     */
    updateStatistics(timeColumnCount, productRowCount, total, page, size) {
        const timeCountElement = document.getElementById("timeColumnCount");
        const productCountElement = document.getElementById("productRowCount");
        if (timeCountElement) {
            timeCountElement.textContent = timeColumnCount;
        }
        if (productCountElement) {
            productCountElement.textContent = `${productRowCount} / ${total}`;
        }
    },

    /**
     * 渲染主表格（表头 + 表体 + 分页）
     *
     * @param {Object} data 后端返回的完整响应对象
     * @param {Object} data.data 实际数据载荷
     */
    renderTable(data) {
        const { timeColumns, productRows, total, page, size } = data.data;

        const table = document.getElementById("timeseriesTable");
        const loadingDiv = document.getElementById("loadingDiv");
        const errorDiv = document.getElementById("errorDiv");
        const noDataDiv = document.getElementById("noDataDiv");
        const tableHead = document.getElementById("tableHead");
        const tableBody = document.getElementById("tableBody");

        // 隐藏加载和错误提示
        if (loadingDiv) loadingDiv.style.display = "none";
        if (errorDiv) errorDiv.style.display = "none";

        // 无数据处理
        if (!timeColumns || timeColumns.length === 0 || !productRows || productRows.length === 0) {
            if (table) table.style.display = "none";
            if (noDataDiv) noDataDiv.style.display = "block";
            this.updateStatistics(0, 0, 0, 1, 10);
            return;
        }

        // 显示表格
        if (table) table.style.display = "table";
        if (noDataDiv) noDataDiv.style.display = "none";

        // 渲染表头
        this.renderTableHead(tableHead, timeColumns);

        // 渲染表体
        this.renderTableBody(tableBody, productRows, timeColumns);

        // 更新统计信息
        this.updateStatistics(timeColumns.length, productRows.length, total, page, size);

        // 更新分页信息
        TimeSeriesAppState.total = total;
        TimeSeriesAppState.page = page;
        TimeSeriesAppState.size = size;
        this.renderPagination(total, page, size);

        // 显示分页控件
        const paginationDiv = document.getElementById("paginationDiv");
        if (paginationDiv) {
            paginationDiv.style.display = "flex";
        }
    },

    /**
     * 渲染分页控件
     *
     * @param {number} total 总记录数
     * @param {number} page  当前页码
     * @param {number} size  每页条数
     */
    renderPagination(total, page, size) {
        const paginationDiv = document.getElementById("paginationDiv");
        if (!paginationDiv) return;

        const totalPages = Math.ceil(total / size);
        const startRecord = (page - 1) * size + 1;
        const endRecord = Math.min(page * size, total);

        paginationDiv.innerHTML = `
            <div class="pagination-info">
                显示第 ${startRecord}-${endRecord} 条，共 ${total} 条
            </div>
            <div class="pagination-controls">
                <button 
                    class="pagination-btn" 
                    ${page <= 1 ? "disabled" : ""} 
                    onclick="TimeSeriesApp.goToPage(${page - 1})"
                >
                    上一页
                </button>
                <span class="pagination-page-info">
                    第 ${page} / ${totalPages} 页
                </span>
                <button 
                    class="pagination-btn" 
                    ${page >= totalPages ? "disabled" : ""} 
                    onclick="TimeSeriesApp.goToPage(${page + 1})"
                >
                    下一页
                </button>
                <div class="pagination-size">
                    <label for="pageSizeSelect">每页:</label>
                    <select id="pageSizeSelect" class="page-size-select" onchange="TimeSeriesApp.changePageSize(this.value)">
                        <option value="50" ${size === 50 ? "selected" : ""}>50</option>
                        <option value="100" ${size === 100 ? "selected" : ""}>100</option>
                        <option value="200" ${size === 200 ? "selected" : ""}>200</option>
                        <option value="500" ${size === 500 ? "selected" : ""}>500</option>
                    </select>
                </div>
            </div>
        `;
    },

    /**
     * 渲染表头
     *
     * 固定列：产品信息 + 指标信息
     * 动态列：时间列（后端返回的 timeColumns）
     *
     * @param {HTMLTableSectionElement} tableHead thead DOM 节点
     * @param {string[]} timeColumns              时间列列表
     */
    renderTableHead(tableHead, timeColumns) {
        const headerRow = document.createElement("tr");

        // 固定列：合并产品信息为一列
        const th = document.createElement("th");
        th.className = "fixed-col";
        th.innerHTML = `
            <div class="product-header">
                <div>产品信息</div>
            </div>
        `;
        headerRow.appendChild(th);

        // 指标信息列
        const indicatorTh = document.createElement("th");
        indicatorTh.innerHTML = "指标信息";
        headerRow.appendChild(indicatorTh);

        // 时间列
        timeColumns.forEach((timeColumn) => {
            const th = document.createElement("th");
            th.className = "time-col";
            th.textContent = timeColumn;
            headerRow.appendChild(th);
        });

        tableHead.innerHTML = "";
        tableHead.appendChild(headerRow);
    },

    /**
     * 渲染表体
     *
     * 每一行对应一个产品（ETF / 指数），按配置顺序分页显示。
     *
     * @param {HTMLTableSectionElement} tableBody tbody DOM 节点
     * @param {Object[]} productRows              产品行列表
     * @param {string[]} timeColumns              时间列列表
     */
    renderTableBody(tableBody, productRows, timeColumns) {
        tableBody.innerHTML = "";

        productRows.forEach((productRow) => {
            const tr = document.createElement("tr");

            // 固定列：合并产品信息为一列
            const td = document.createElement("td");
            td.className = "fixed-col";
            td.innerHTML = `
                <div class="product-info">
                    <div class="product-code">${productRow.etfCode || "-"}</div>
                    <div class="product-name">${productRow.etfName || "-"}</div>
                    <div class="product-industry">${productRow.industry || "-"}</div>
                </div>
            `;
            tr.appendChild(td);

            // 指标信息列（固定文案竖直展示）
            const indicatorTd = document.createElement("td");
            indicatorTd.className = "indicator-cell";
            indicatorTd.innerHTML = `
                <div class="indicator-list">
                    <div class="indicator-item">总分</div>
                    <div class="indicator-item">买卖信号</div>
                    <div class="indicator-item">5日</div>
                    <div class="indicator-item">10日</div>
                    <div class="indicator-item">20日</div>
                    <div class="indicator-item">M0占比</div>
                    <div class="indicator-item">M5占比</div>
                    <div class="indicator-item">M10占比</div>
                    <div class="indicator-item">M20占比</div>
                    <div class="indicator-item">Ma均值</div>
                </div>
            `;
            tr.appendChild(indicatorTd);

            // 时间列数据
            timeColumns.forEach((timeColumn) => {
                const td = document.createElement("td");
                td.className = "data-cell";

                const dataPoint = productRow.timeSeriesData[timeColumn];
                if (dataPoint) {
                    td.innerHTML = this.renderDataCell(dataPoint);
                } else {
                    td.textContent = "-";
                }

                tr.appendChild(td);
            });

            tableBody.appendChild(tr);
        });
    },

    /**
     * 渲染单个时间点的数据单元格
     *
     * 右侧每一列的内容都通过这里统一输出，包含：
     * - 总分 / 买卖信号
     * - 5/10/20 日价格比较
     * - M0/M5/M10/M20 仓位占比
     * - Ma 均值 / 增长股数 / 总股数
     *
     * @param {Object} dataPoint 单个时间点的数据对象
     * @returns {string}         单元格 HTML 片段
     */
    renderDataCell(dataPoint) {
        // 格式化各个值
        const totalScore = dataPoint.totalScore ?? "-";
        // 根据总分计算买卖信号: 0,1,2=卖，其余=买
        const buySellSignal = TimeSeriesFormatter.calculateBuySellSignal(dataPoint.totalScore);
        const m5Day = TimeSeriesFormatter.formatBoolean(dataPoint.greaterThanM5Price);
        const m10Day = TimeSeriesFormatter.formatBoolean(dataPoint.greaterThanM10Price);
        const m20Day = TimeSeriesFormatter.formatBoolean(dataPoint.greaterThanM20Price);
        const m0Percent = TimeSeriesFormatter.formatPercent(dataPoint.m0Percent);
        const m5Percent = TimeSeriesFormatter.formatPercent(dataPoint.m5Percent);
        const m10Percent = TimeSeriesFormatter.formatPercent(dataPoint.m10Percent);
        const m20Percent = TimeSeriesFormatter.formatPercent(dataPoint.m20Percent);
        const maMean = TimeSeriesFormatter.formatPercent(dataPoint.maMeanRatio);

        // 获取样式类
        const scoreClass = this.getScoreClass(dataPoint.totalScore);
        const signalClass = this.getSignalClass(buySellSignal);
        const m5DayClass = this.getBooleanClass(dataPoint.greaterThanM5Price);
        const m10DayClass = this.getBooleanClass(dataPoint.greaterThanM10Price);
        const m20DayClass = this.getBooleanClass(dataPoint.greaterThanM20Price);
        const m0PercentClass = this.getPercentClass(dataPoint.m0Percent);
        const m5PercentClass = this.getPercentClass(dataPoint.m5Percent);
        const m10PercentClass = this.getPercentClass(dataPoint.m10Percent);
        const m20PercentClass = this.getPercentClass(dataPoint.m20Percent);
        const maMeanClass = this.getPercentClass(dataPoint.maMeanRatio);

        // 按“指标信息”逐行对齐：一行一个指标的值
        return `
            <div class="data-cell-compact">
                <div class="data-line">
                    <span class="data-value ${scoreClass}">${totalScore}</span>
                </div>
                <div class="data-line">
                    <span class="data-value ${signalClass}">${buySellSignal}</span>
                </div>
                <div class="data-line">
                    <span class="data-value ${m5DayClass}">${m5Day}</span>
                </div>
                <div class="data-line">
                    <span class="data-value ${m10DayClass}">${m10Day}</span>
                </div>
                <div class="data-line">
                    <span class="data-value ${m20DayClass}">${m20Day}</span>
                </div>
                <div class="data-line">
                    <span class="data-value ${m0PercentClass}">${m0Percent}</span>
                </div>
                <div class="data-line">
                    <span class="data-value ${m5PercentClass}">${m5Percent}</span>
                </div>
                <div class="data-line">
                    <span class="data-value ${m10PercentClass}">${m10Percent}</span>
                </div>
                <div class="data-line">
                    <span class="data-value ${m20PercentClass}">${m20Percent}</span>
                </div>
                <div class="data-line">
                    <span class="data-value ${maMeanClass}">${maMean}</span>
                </div>
            </div>
        `;
    },

    /**
     * 根据总分获取样式类
     * @param {number|null|undefined} score
     * @returns {string}
     */
    getScoreClass(score) {
        if (score === null || score === undefined) return "";
        return score >= 3 ? "score-high" : "score-low";
    },

    /**
     * 根据买卖信号获取样式类
     * @param {string} signal 买/卖 中文信号
     * @returns {string}
     */
    getSignalClass(signal) {
        if (!signal) return "";
        return signal === "买" ? "signal-buy" : "signal-sell";
    },

    /**
     * 根据百分比数值获取样式类
     * @param {number|null|undefined} value 0~1 之间的小数
     * @returns {string}
     */
    getPercentClass(value) {
        if (value === null || value === undefined) return "";
        return value >= 0.5 ? "percent-high" : "percent-low";
    },

    /**
     * 根据布尔值获取样式类
     * @param {boolean|null|undefined} value
     * @returns {string}
     */
    getBooleanClass(value) {
        if (value === null || value === undefined) return "";
        return value ? "boolean-true" : "boolean-false";
    },

    /**
     * 显示错误信息
     */
    showError(message) {
        const errorDiv = document.getElementById("errorDiv");
        const loadingDiv = document.getElementById("loadingDiv");
        const table = document.getElementById("timeseriesTable");

        if (errorDiv) {
            errorDiv.textContent = `获取数据失败: ${message}`;
            errorDiv.style.display = "block";
        }
        if (loadingDiv) loadingDiv.style.display = "none";
        if (table) table.style.display = "none";
    },
};

// ========== 应用状态管理 ==========
const TimeSeriesAppState = {
    networkStatus: "online",
    page: 1,
    size: 50,
    total: 0,
    currentResponse: null,
};

// ========== 主应用控制器 ==========
const TimeSeriesApp = {
    /**
     * 初始化应用
     */
    init() {
        // 设置默认时间范围（今天）
        this.resetTimeRange();
        // 立即获取一次数据
        this.fetchData();
    },

    /**
     * 重置时间范围（默认为今天）
     */
    resetTimeRange() {
        const endTime = new Date();
        // 设置为今天的开始时间（00:00:00）
        const startTime = new Date(endTime);
        startTime.setHours(0, 0, 0, 0);

        const startTimeInput = document.getElementById("startTime");
        const endTimeInput = document.getElementById("endTime");

        if (startTimeInput) {
            startTimeInput.value = this.formatDateTimeLocal(startTime);
        }
        if (endTimeInput) {
            endTimeInput.value = this.formatDateTimeLocal(endTime);
        }

        // 重置页码
        TimeSeriesAppState.page = 1;
    },

    /**
     * 格式化日期时间为 datetime-local 格式
     */
    formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    /**
     * 格式化日期时间为 LocalDateTime 格式（用于后端接口）
     * 从 datetime-local 格式（yyyy-MM-ddTHH:mm）转换为 LocalDateTime 格式（yyyy-MM-ddTHH:mm:ss）
     */
    formatLocalDateTime(datetimeLocalString) {
        // datetime-local 格式：yyyy-MM-ddTHH:mm
        // LocalDateTime 格式：yyyy-MM-ddTHH:mm:ss
        // 直接添加 :00 秒数即可
        return datetimeLocalString + ":00";
    },

    /**
     * 获取并更新数据
     */
    async fetchData(page = null) {
        const startTimeInput = document.getElementById("startTime");
        const endTimeInput = document.getElementById("endTime");
        const loadingDiv = document.getElementById("loadingDiv");
        const errorDiv = document.getElementById("errorDiv");

        const startTime = startTimeInput?.value || null;
        const endTime = endTimeInput?.value || null;

        // 如果指定了页码，更新状态
        if (page !== null) {
            TimeSeriesAppState.page = page;
        }

        // 显示加载状态
        if (loadingDiv) loadingDiv.style.display = "block";
        if (errorDiv) errorDiv.style.display = "none";

        try {
            // 转换时间格式（从 datetime-local 转换为 LocalDateTime 格式，不进行时区转换）
            // 格式：yyyy-MM-ddTHH:mm:ss（Spring Boot LocalDateTime 默认格式）
            const startTimeISO = startTime ? this.formatLocalDateTime(startTime) : null;
            const endTimeISO = endTime ? this.formatLocalDateTime(endTime) : null;

            const responseData = await TimeSeriesDataService.fetchTimeSeriesData(
                startTimeISO,
                endTimeISO,
                TimeSeriesAppState.page,
                TimeSeriesAppState.size,
            );
            TimeSeriesAppState.currentResponse = responseData;

            // 更新UI
            TimeSeriesUIRenderer.renderTable(responseData);
            TimeSeriesUIRenderer.updateLastUpdateTime();

            // 更新网络状态
            TimeSeriesAppState.networkStatus = "online";
            TimeSeriesUIRenderer.updateNetworkStatus("online");
        } catch (error) {
            console.error("获取数据失败:", error);

            // 更新网络状态
            TimeSeriesAppState.networkStatus = "offline";
            TimeSeriesUIRenderer.updateNetworkStatus("offline");

            // 显示错误信息
            TimeSeriesUIRenderer.showError(error.message);
        }
    },

    /**
     * 跳转到指定页码
     */
    goToPage(page) {
        if (page < 1) return;
        this.fetchData(page);
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: "smooth" });
    },

    /**
     * 改变每页显示数量
     */
    changePageSize(newSize) {
        const size = parseInt(newSize, 10);
        if (size < 50) {
            alert("每页最少显示50条");
            return;
        }
        TimeSeriesAppState.size = size;
        TimeSeriesAppState.page = 1; // 重置到第一页
        this.fetchData(1);
    },
};

// ========== 全局函数 ==========
function fetchData() {
    // 查询时重置到第一页
    TimeSeriesAppState.page = 1;
    TimeSeriesApp.fetchData();
}

function resetTimeRange() {
    TimeSeriesApp.resetTimeRange();
}

function exportExcel() {
    const table = document.getElementById("timeseriesTable");
    if (!table || table.style.display === "none") {
        alert("暂无数据可导出");
        return;
    }

    const headThs = table.querySelectorAll("thead tr th");
    const timeHeaders = [];
    headThs.forEach((th) => {
        // 仅导出时间列，跳过“产品信息”和“指标信息”
        if (th.classList.contains("time-col")) {
            timeHeaders.push(th.textContent.trim());
        }
    });

    // 指标信息列：固定文案
    const indicatorLabels = [
        "总分",
        "买卖信号",
        "5日",
        "10日",
        "20日",
        "M0占比",
        "M5占比",
        "M10占比",
        "M20占比",
        "Ma均值",
    ];
    const indicatorCount = indicatorLabels.length;

    let html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\" /><style>td{mso-number-format:\"\\@\";white-space:normal;line-height:1.5;vertical-align:top;}</style></head><body><table border=\"1\"><thead><tr>";
    html += "<th>产品信息</th><th>指标信息</th>";
    timeHeaders.forEach((t) => {
        html += `<th>${t}</th>`;
    });
    html += "</tr></thead><tbody>";

    const bodyRows = table.querySelectorAll("tbody tr");
    bodyRows.forEach((row) => {
        const fixedTd = row.querySelector("td.fixed-col");
        const code = fixedTd?.querySelector(".product-code")?.textContent.trim() || "";
        const name = fixedTd?.querySelector(".product-name")?.textContent.trim() || "";
        const industry = fixedTd?.querySelector(".product-industry")?.textContent.trim() || "";
        
        // 产品信息合并为一个单元格内容
        const productInfo = `${code}<br/>${name}<br/>${industry}`;

        // 指标信息合并为一个单元格
        const indicatorInfo = indicatorLabels.join("<br/>");

        // 获取所有时间列的数据
        const dataTds = row.querySelectorAll("td.data-cell");
        const timeColumnData = [];
        dataTds.forEach((td) => {
            const lines = td.querySelectorAll(".data-line");
            const values = [];
            lines.forEach((line) => {
                const valueSpan = line.querySelector(".data-value");
                const v = valueSpan ? valueSpan.textContent.trim() : "-";
                values.push(v);
            });
            // 将所有指标值合并为一个单元格内容
            timeColumnData.push(values.join("<br/>"));
        });

        // 创建一行，所有列都是合并的单元格
        html += "<tr>";
        html += `<td>${productInfo}</td>`;
        html += `<td>${indicatorInfo}</td>`;
        
        // 每个时间列的数据（所有指标值合并）
        timeColumnData.forEach((cellData) => {
            html += `<td>${cellData}</td>`;
        });

        html += "</tr>";
    });

    html += "</tbody></table></body></html>";

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const start = document.getElementById("startTime")?.value || "";
    const end = document.getElementById("endTime")?.value || "";
    const filename = `指数数据_${start}_${end}.xls`.replace(/[:]/g, "-");
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ========== 应用启动 ==========
document.addEventListener("DOMContentLoaded", () => {
    TimeSeriesApp.init();
});

