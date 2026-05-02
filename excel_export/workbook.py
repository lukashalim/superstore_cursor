"""Build .xlsx from dashboard export JSON payload."""
from __future__ import annotations

import io
from typing import Any

import xlsxwriter

# Chart ranges use XlsxWriter's tuple form: [sheetname, first_row, first_col, last_row, last_col] (0-indexed).


def _fmts(wb: xlsxwriter.Workbook) -> dict[str, Any]:
    return {
        "title": wb.add_format({"bold": True, "font_size": 14, "font_color": "#0F172A"}),
        "sub": wb.add_format({"font_size": 11, "font_color": "#475569"}),
        "header": wb.add_format({"bold": True, "bg_color": "#E2E8F0", "border": 1}),
        "cell": wb.add_format({"border": 1}),
        "currency": wb.add_format({"num_format": "$#,##0", "border": 1}),
        "pct": wb.add_format({"num_format": "0.00", "border": 1}),
        "pct_hdr": wb.add_format({"num_format": '0.00"%"', "border": 1}),
    }


def _add_cover(wb: xlsxwriter.Workbook, data: dict[str, Any], f: dict[str, Any]) -> None:
    ws = wb.add_worksheet("Cover")
    meta = data["meta"]
    ws.write(0, 0, meta["primaryTitle"], f["title"])
    ws.write(2, 0, meta["tabLabel"], f["sub"])
    ws.write(3, 0, meta["exportLine"], f["sub"])
    ws.write(5, 0, "Applied filters", f["header"])
    row = 6
    for line in meta["filterLines"]:
        parts = line.split(": ", 1)
        if len(parts) == 2:
            ws.write(row, 0, parts[0], f["cell"])
            ws.write(row, 1, parts[1], f["cell"])
        else:
            ws.write(row, 0, line, f["cell"])
        row += 1
    ws.set_column(0, 0, 14)
    ws.set_column(1, 1, 28)


def _add_kpis(wb: xlsxwriter.Workbook, data: dict[str, Any], f: dict[str, Any]) -> None:
    ws = wb.add_worksheet("KPIs")
    d = data["descriptive"]
    ws.write(0, 0, "Metric", f["header"])
    ws.write(0, 1, "Value", f["header"])
    ws.write(0, 2, "Delta vs region avg", f["header"])
    ws.write(1, 0, "Sales", f["cell"])
    ws.write(1, 1, d["salesTotal"], f["currency"])
    ws.write(1, 2, d["salesDeltaVsRegionAvg"], f["currency"])
    ws.write(2, 0, "Profit ratio %", f["cell"])
    ws.write(2, 1, d["profitRatio"], f["pct"])
    ws.write(2, 2, d["profitRatioDeltaVsRegionAvg"], f["pct"])
    ws.write(3, 0, "Days to ship", f["cell"])
    ws.write(3, 1, d["daysToShip"], f["pct"])
    ws.write(3, 2, d["daysToShipDeltaVsRegionAvg"], f["pct"])
    ws.set_column(0, 2, 22)


def _add_trend_sheet(
    wb: xlsxwriter.Workbook,
    sheet_name: str,
    chart_title: str,
    series: list[dict[str, Any]],
    y_title: str,
    value_format: str,
) -> None:
    ws = wb.add_worksheet(sheet_name)
    ws.write(0, 0, "Month")
    ws.write(0, 1, "Current year (CP)")
    ws.write(0, 2, "Prior year (PP)")
    fmt = wb.add_format({"num_format": value_format, "border": 1})
    row = 1
    for p in series:
        ws.write(row, 0, p["month"])
        ws.write(row, 1, p["cp"], fmt)
        ws.write(row, 2, p["pp"], fmt)
        row += 1
    if row <= 1:
        ws.write(1, 0, "No trend data")
        return
    last = row - 1
    # Excel rejects some single-point line series; need a contiguous row range (>=2 rows).
    if last < 2:
        ws.write(last + 2, 0, "Chart omitted: need at least 2 months of trend data.")
        return
    chart = wb.add_chart({"type": "line"})
    chart.add_series(
        {
            "name": "Current year (CP)",
            "categories": [sheet_name, 1, 0, last, 0],
            "values": [sheet_name, 1, 1, last, 1],
            "line": {"color": "#3B82F6"},
        }
    )
    chart.add_series(
        {
            "name": "Prior year (PP)",
            "categories": [sheet_name, 1, 0, last, 0],
            "values": [sheet_name, 1, 2, last, 2],
            "line": {"color": "#94A3B8"},
        }
    )
    chart.set_title({"name": chart_title})
    chart.set_x_axis({"name": "Month"})
    chart.set_y_axis({"name": y_title, "num_format": value_format})
    chart.set_legend({"position": "bottom"})
    ws.insert_chart(1, 4, chart, {"x_scale": 1.65, "y_scale": 1.15})


def _add_bullets(wb: xlsxwriter.Workbook, data: dict[str, Any], f: dict[str, Any]) -> None:
    ws = wb.add_worksheet("Bullets")
    d = data["descriptive"]
    ws.write(0, 0, "Bullet targets (same as dashboard)", f["header"])
    ws.write(2, 0, f"Sales vs target $900k — actual ${d['salesTotal']:,.0f}")
    ws.write(
        3,
        0,
        f"Profit ratio vs target 12% — actual {d['profitRatio']:.2f}%",
    )
    ws.write(
        4,
        0,
        f"Days to ship vs target 4.1d — actual {d['daysToShip']:.2f} days",
    )


def _add_region_cmp(wb: xlsxwriter.Workbook, data: dict[str, Any], f: dict[str, Any]) -> None:
    ws = wb.add_worksheet("Region_cmp")
    rc = data["descriptive"]["regionComparison"]
    if not rc:
        ws.write(0, 0, "No region data for current filters.")
        return
    ws.write(0, 0, "Region", f["header"])
    ws.write(0, 1, "Sales", f["header"])
    ws.write(0, 2, "Profit ratio %", f["header"])
    ws.write(0, 3, "Days to ship", f["header"])
    row = 1
    for r in rc:
        ws.write(row, 0, r["region"], f["cell"])
        ws.write(row, 1, r["sales"], f["currency"])
        ws.write(row, 2, r["profitRatio"], f["pct"])
        ws.write(row, 3, r["daysToShip"], f["pct"])
        row += 1
    last = row - 1
    if last < 1:
        return
    chart = wb.add_chart({"type": "column"})
    chart.add_series(
        {
            "name": "Sales",
            "categories": ["Region_cmp", 1, 0, last, 0],
            "values": ["Region_cmp", 1, 1, last, 1],
            "fill": {"color": "#8B5CF6"},
        }
    )
    chart.set_title({"name": "Region comparison - sales"})
    chart.set_y_axis({"name": "Sales (USD)", "num_format": "$#,##0"})
    chart.set_x_axis({"name": "Region"})
    ws.insert_chart(1, 5, chart, {"x_scale": 1.55, "y_scale": 1.15})


def _add_storyline(wb: xlsxwriter.Workbook, data: dict[str, Any], f: dict[str, Any]) -> None:
    ws = wb.add_worksheet("Storyline")
    insights = data.get("annotations") or []
    if not insights:
        ws.write(0, 0, "No annotation insights.")
        return
    ws.write(0, 0, "Annotation storyline", f["header"])
    row = 2
    for i, item in enumerate(insights, start=1):
        ws.write(row, 0, f"{i}. {item['title']} ({item['impact']})", f["title"])
        row += 1
        ws.write(row, 0, item["detail"], f["sub"])
        row += 2


def _add_presc_scatter(wb: xlsxwriter.Workbook, data: dict[str, Any], f: dict[str, Any]) -> None:
    ws = wb.add_worksheet("Presc_Scatter")
    pts = data["prescriptive"]["scatter"]
    ws.write(0, 0, "Sub-category", f["header"])
    ws.write(0, 1, "Sales (X)", f["header"])
    ws.write(0, 2, "Profit ratio % (Y)", f["header"])
    ws.write(0, 3, "Orders (size)", f["header"])
    row = 1
    for p in pts:
        ws.write(row, 0, p["subCategory"], f["cell"])
        ws.write(row, 1, p["sales"], f["currency"])
        ws.write(row, 2, p["profitRatio"], f["pct"])
        ws.write(row, 3, p["orders"], f["cell"])
        row += 1
    if row <= 1:
        ws.write(1, 0, "No sub-category data for current filters.")
        return
    last = row - 1
    ws.write(
        last + 2,
        0,
        "Chart: sales (X) vs profit ratio (Y). Orders column is table-only (PPT uses bubble size).",
    )
    # Scatter: use default markers only (custom marker size can map to bubble "sizes" in OOXML).
    if last < 2:
        ws.write(last + 3, 0, "Chart omitted: need at least 2 sub-categories.")
        return
    # One label ref per point: column A (sub-category). Excel row = 0-indexed row + 1.
    label_refs = [{"value": f"=Presc_Scatter!$A${r + 1}"} for r in range(1, last + 1)]
    chart = wb.add_chart({"type": "scatter"})
    chart.add_series(
        {
            "name": "Sub-categories",
            "categories": ["Presc_Scatter", 1, 1, last, 1],
            "values": ["Presc_Scatter", 1, 2, last, 2],
            "data_labels": {
                "value": False,
                "custom": label_refs,
                "position": "right",
                "font": {"size": 9},
            },
        }
    )
    chart.set_title({"name": "Prescriptive scatter - sales x profit ratio"})
    chart.set_x_axis({"name": "Sales (USD)"})
    chart.set_y_axis({"name": "Profit ratio %"})
    chart.set_legend({"position": "bottom"})
    ws.insert_chart(1, 5, chart, {"x_scale": 1.55, "y_scale": 1.15})


def _add_presc_region(wb: xlsxwriter.Workbook, data: dict[str, Any], f: dict[str, Any]) -> None:
    ws = wb.add_worksheet("Presc_Region")
    ra = data["prescriptive"]["regionActions"]
    if not ra:
        ws.write(0, 0, "No regional data for current filters.")
        return
    ws.write(0, 0, "Region", f["header"])
    ws.write(0, 1, "Sales", f["header"])
    ws.write(0, 2, "Profit", f["header"])
    ws.write(0, 3, "Recommended action", f["header"])
    row = 1
    for r in ra:
        ws.write(row, 0, r["region"], f["cell"])
        ws.write(row, 1, r["sales"], f["currency"])
        ws.write(row, 2, r["profit"], f["currency"])
        ws.write(row, 3, r["recommendedAction"], f["cell"])
        row += 1
    last = row - 1
    if last < 1:
        return
    chart = wb.add_chart({"type": "bar"})
    chart.add_series(
        {
            "name": "Sales",
            "categories": ["Presc_Region", 1, 0, last, 0],
            "values": ["Presc_Region", 1, 1, last, 1],
            "fill": {"color": "#6366F1"},
        }
    )
    chart.set_title({"name": "Regional sales - prescriptive view"})
    # Bar chart: value axis is horizontal; avoid num_format on axis (can trigger invalid ref in some Excel builds).
    chart.set_x_axis({"name": "Sales (USD)"})
    chart.set_y_axis({"name": "Region"})
    ws.insert_chart(1, 5, chart, {"x_scale": 1.55, "y_scale": 1.15})


def _add_playbook(wb: xlsxwriter.Workbook, data: dict[str, Any], f: dict[str, Any], title: str) -> None:
    ws = wb.add_worksheet("Playbook")
    ws.write(0, 0, title, f["header"])
    ws.write(1, 0, "Title", f["header"])
    ws.write(1, 1, "Impact", f["header"])
    ws.write(1, 2, "Detail", f["header"])
    row = 2
    for item in data["prescriptive"]["playbook"]:
        ws.write(row, 0, f"{item['title']} ({item['impact']} impact)")
        ws.write(row, 1, item["impact"])
        ws.write(row, 2, item["detail"])
        row += 1


def _add_descriptive_bundle(wb: xlsxwriter.Workbook, data: dict[str, Any], f: dict[str, Any]) -> None:
    _add_kpis(wb, data, f)
    tc = data["descriptive"]["trendComparison"]
    _add_trend_sheet(
        wb,
        "Trend_Sales",
        "Sales trend - CP vs PP by month",
        tc["sales"],
        "Sales (USD)",
        "$#,##0",
    )
    _add_trend_sheet(
        wb,
        "Trend_Profit",
        "Profit ratio trend - CP vs PP by month",
        tc["profitRatio"],
        "Profit ratio %",
        "0.00",
    )
    _add_trend_sheet(
        wb,
        "Trend_Ship",
        "Days to ship trend - CP vs PP by month",
        tc["daysToShip"],
        "Days",
        "0.00",
    )
    _add_bullets(wb, data, f)
    _add_region_cmp(wb, data, f)


def _add_prescriptive_bundle(
    wb: xlsxwriter.Workbook, data: dict[str, Any], f: dict[str, Any], playbook_heading: str
) -> None:
    _add_presc_scatter(wb, data, f)
    _add_presc_region(wb, data, f)
    _add_playbook(wb, data, f, playbook_heading)


def build_workbook(data: dict[str, Any]) -> bytes:
    out = io.BytesIO()
    wb = xlsxwriter.Workbook(out, {"in_memory": True})
    f = _fmts(wb)
    _add_cover(wb, data, f)
    tab = data["tab"]

    if tab == "descriptive":
        _add_descriptive_bundle(wb, data, f)
    elif tab == "prescriptive":
        _add_prescriptive_bundle(wb, data, f, "Playbook")
    else:
        _add_storyline(wb, data, f)
        _add_descriptive_bundle(wb, data, f)
        _add_prescriptive_bundle(wb, data, f, "Action callouts")

    wb.close()
    return out.getvalue()
