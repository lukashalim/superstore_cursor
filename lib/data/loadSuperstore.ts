import fs from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
import { superstoreRowSchema, type SuperstoreRow } from "./superstoreSchema";

const workbookPath = path.join(process.cwd(), "sample_-_superstore.xls");

let superstoreCache: SuperstoreRow[] | null = null;

function normalizeValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined) return record[key];
  }
  return "";
}

function toCleanString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const cleaned = String(value).trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

function isDataRow(record: Record<string, unknown>): boolean {
  const orderId = toCleanString(normalizeValue(record, ["Order ID"]));
  const productId = toCleanString(normalizeValue(record, ["Product ID"]));
  const orderDate = toCleanString(normalizeValue(record, ["Order Date"]));
  return orderId.length > 0 && productId.length > 0 && orderDate.length > 0;
}

function normalizeRecord(record: Record<string, unknown>): SuperstoreRow {
  return superstoreRowSchema.parse({
    rowId: toCleanString(normalizeValue(record, ["Row ID"]), "0"),
    orderId: toCleanString(normalizeValue(record, ["Order ID"])),
    orderDate: normalizeValue(record, ["Order Date"]),
    shipDate: normalizeValue(record, ["Ship Date"]),
    shipMode: toCleanString(normalizeValue(record, ["Ship Mode"]), "Standard Class"),
    customerId: toCleanString(normalizeValue(record, ["Customer ID"]), "UNKNOWN-CUSTOMER"),
    customerName: toCleanString(normalizeValue(record, ["Customer Name"]), "Unknown Customer"),
    segment: toCleanString(normalizeValue(record, ["Segment"]), "Consumer"),
    country: toCleanString(normalizeValue(record, ["Country", "Country/Region"]), "United States"),
    city: toCleanString(normalizeValue(record, ["City"]), "Unknown City"),
    state: toCleanString(normalizeValue(record, ["State", "State/Province"]), "Unknown State"),
    postalCode: toCleanString(normalizeValue(record, ["Postal Code"])),
    region: toCleanString(normalizeValue(record, ["Region"]), "Unknown Region"),
    productId: toCleanString(normalizeValue(record, ["Product ID"])),
    category: toCleanString(normalizeValue(record, ["Category"]), "Unknown Category"),
    subCategory: toCleanString(
      normalizeValue(record, ["Sub-Category"]),
      "Unknown Sub-Category"
    ),
    productName: toCleanString(normalizeValue(record, ["Product Name"]), "Unknown Product"),
    sales: normalizeValue(record, ["Sales"]),
    quantity: normalizeValue(record, ["Quantity"]),
    discount: normalizeValue(record, ["Discount"]),
    profit: normalizeValue(record, ["Profit"]),
  });
}

export async function loadSuperstore(): Promise<SuperstoreRow[]> {
  if (superstoreCache) return superstoreCache;

  const file = await fs.readFile(workbookPath);
  const workbook = XLSX.read(file, { type: "buffer", cellDates: true });
  const worksheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[worksheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  superstoreCache = records.filter(isDataRow).map(normalizeRecord);
  return superstoreCache;
}
