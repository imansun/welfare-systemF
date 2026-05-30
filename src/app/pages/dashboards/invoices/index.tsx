// src/app/pages/dashboards/invoices/index.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useReactToPrint } from "react-to-print";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { Page } from "@/components/shared/Page";
import { Badge } from "@/components/ui/Badge";
import { Button, Card } from "@/components/ui";
import {
  generateInvoicesByPeriod,
  getInvoicesByPeriod,
  GenerateInvoicesResponse,
  InvoiceItem,
} from "@/app/services/endpoints/invoices";
import { getPeriods, PeriodItem } from "@/app/services/endpoints/periods";

type PeriodWithDisplayFields = PeriodItem & {
  title?: string;
  name?: string;
  code?: string;
};

const getPeriodLabel = (period: PeriodItem): string => {
  const currentPeriod = period as PeriodWithDisplayFields;

  return (
    currentPeriod.title ||
    currentPeriod.name ||
    currentPeriod.code ||
    currentPeriod.id
  );
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("fa-IR");
};

const formatCurrency = (value?: string | number | null): string => {
  if (value === null || value === undefined || value === "") return "0";

  const amount = Number(value);

  return Number.isNaN(amount)
    ? String(value)
    : `${amount.toLocaleString("fa-IR")} ریال`;
};

const getCompanyName = (invoice: InvoiceItem): string => {
  return invoice.companyName || invoice.employee?.company?.name || "-";
};

const waitForPaint = async (): Promise<void> => {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

const downloadBlobFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const sanitizeFilename = (value: string): string => {
  return value.replace(/[<>:"/\\|?*]/g, "-").trim();
};

const getInvoicePdfFilename = (
  invoice: InvoiceItem,
  usedFilenames: Map<string, number>
): string => {
  const baseFilename = sanitizeFilename(
    invoice.personnelCode || invoice.employee?.personnelCode || invoice.id
  );
  const filename = baseFilename || "invoice";
  const currentCount = usedFilenames.get(filename) || 0;

  usedFilenames.set(filename, currentCount + 1);

  return currentCount === 0
    ? `${filename}.pdf`
    : `${filename}-${currentCount + 1}.pdf`;
};

type PrintableInvoiceProps = {
  invoice: InvoiceItem | null;
};

function PrintableInvoice({ invoice }: PrintableInvoiceProps) {
  if (!invoice) return null;

  const items = invoice.items || [];

  return (
    <Card
      className="min-h-[297mm] w-[210mm] bg-white px-10 py-12 text-right text-gray-800 shadow-none"
      dir="rtl"
      skin="none"
    >
      <div className="flex items-start justify-between gap-8">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: "#2563eb" }}>
            فاکتور فروش
          </h2>
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p>شماره فاکتور: {invoice.invoiceNumber || "-"}</p>
            <p>تاریخ صدور: {formatDateTime(invoice.issuedAt)}</p>
            <p>دوره: {invoice.periodTitle || invoice.period?.title || "-"}</p>
          </div>
        </div>

        <div className="text-left">
          <p className="text-lg font-semibold text-gray-800">خدمات رفاهی</p>
          <p className="mt-2 text-sm text-gray-500">
            کد دوره: {invoice.periodCode || invoice.period?.code || "-"}
          </p>
        </div>
      </div>

      <div className="my-8 h-px bg-gray-200" />

      <div className="grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="mb-3 text-base font-medium text-gray-700">
            مشخصات خریدار
          </p>
          <div className="space-y-2 text-gray-600">
            <p>
              نام خریدار:{" "}
              <span className="font-semibold text-gray-800">
                {invoice.employeeName || invoice.employee?.fullName || "-"}
              </span>
            </p>
            <p>
              کد پرسنلی:{" "}
              <span className="font-semibold text-gray-800">
                {invoice.personnelCode ||
                  invoice.employee?.personnelCode ||
                  "-"}
              </span>
            </p>
            <p>
              نام شرکت:{" "}
              <span className="font-semibold text-gray-800">
                {getCompanyName(invoice)}
              </span>
            </p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-base font-medium text-gray-700">
            مشخصات فاکتور
          </p>
          <div className="space-y-2 text-gray-600">
            <p>
              عنوان دوره:{" "}
              <span className="font-semibold text-gray-800">
                {invoice.periodTitle || invoice.period?.title || "-"}
              </span>
            </p>
            <p>
              تعداد اقلام:{" "}
              <span className="font-semibold text-gray-800">
                {invoice.totalItems ?? items.length}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="my-8 h-px bg-gray-200" />

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="border border-gray-200 px-3 py-3 font-medium">
              ردیف
            </th>
            <th className="border border-gray-200 px-3 py-3 font-medium">
              نام کالا/خدمت
            </th>
            <th className="border border-gray-200 px-3 py-3 font-medium">
              واحد
            </th>
            <th className="border border-gray-200 px-3 py-3 font-medium">
              تعداد
            </th>
            <th className="border border-gray-200 px-3 py-3 font-medium">
              قیمت واحد
            </th>
            <th className="border border-gray-200 px-3 py-3 font-medium">
              جمع ردیف
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-gray-200 px-3 py-3 text-center">
                  {index + 1}
                </td>
                <td className="border border-gray-200 px-3 py-3">
                  {item.itemName || "-"}
                </td>
                <td className="border border-gray-200 px-3 py-3">
                  {item.unitName || "-"}
                </td>
                <td className="border border-gray-200 px-3 py-3">
                  {item.quantity || "0"}
                </td>
                <td className="border border-gray-200 px-3 py-3">
                  {formatCurrency(item.price)}
                </td>
                <td className="border border-gray-200 px-3 py-3 font-medium">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={6}
                className="border border-gray-200 px-3 py-6 text-center text-gray-500"
              >
                آیتمی برای این فاکتور ثبت نشده است.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-8 flex justify-end">
        <div className="w-72 rounded-lg bg-gray-50 p-5">
          <p className="text-sm text-gray-500">جمع کل فاکتور</p>
          <p className="mt-2 text-xl font-semibold" style={{ color: "#2563eb" }}>
            {formatCurrency(invoice.totalAmount)}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function Invoices() {
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [periodsError, setPeriodsError] = useState("");

  const [selectedPeriodId, setSelectedPeriodId] = useState("");

  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateResult, setGenerateResult] =
    useState<GenerateInvoicesResponse | null>(null);
  const [generateError, setGenerateError] = useState("");

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState("");
  const [printInvoice, setPrintInvoice] = useState<InvoiceItem | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState("");
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  const selectedPeriod = useMemo(() => {
    return periods.find((period) => period.id === selectedPeriodId);
  }, [periods, selectedPeriodId]);

  const handlePrint = useReactToPrint({
    contentRef: invoicePrintRef,
    documentTitle: printInvoice?.invoiceNumber
      ? `invoice-${printInvoice.invoiceNumber}`
      : "invoice",
  });

  const fetchPeriods = async () => {
    try {
      setPeriodsLoading(true);
      setPeriodsError("");

      const data = await getPeriods();

      if (Array.isArray(data)) {
        setPeriods(data);
      } else {
        setPeriods([]);
        setPeriodsError("فرمت داده‌های دوره‌ها نامعتبر است.");
      }
    } catch (error) {
      console.error("Failed to fetch periods:", error);
      setPeriods([]);
      setPeriodsError("دریافت لیست دوره‌ها با خطا مواجه شد.");
    } finally {
      setPeriodsLoading(false);
    }
  };

  const fetchInvoicesByPeriodData = async (periodId: string) => {
    try {
      setInvoicesLoading(true);
      setInvoicesError("");

      const data = await getInvoicesByPeriod(periodId);

      if (Array.isArray(data)) {
        setInvoices(data);
      } else {
        setInvoices([]);
        setInvoicesError("فرمت داده‌های فاکتورها نامعتبر است.");
      }
    } catch (error) {
      console.error("Failed to fetch invoices by period:", error);
      setInvoices([]);
      setInvoicesError("دریافت لیست فاکتورها با خطا مواجه شد.");
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    void fetchPeriods();
  }, []);

  const handlePeriodChange = async (periodId: string) => {
    setSelectedPeriodId(periodId);
    setGenerateResult(null);
    setGenerateError("");
    setInvoices([]);
    setInvoicesError("");

    if (!periodId) return;

    await fetchInvoicesByPeriodData(periodId);
  };

  const handleGenerateInvoices = async () => {
    if (!selectedPeriodId) {
      setGenerateResult(null);
      setGenerateError("لطفاً ابتدا یک دوره را انتخاب کنید.");
      return;
    }

    try {
      setGenerateLoading(true);
      setGenerateResult(null);
      setGenerateError("");

      const result = await generateInvoicesByPeriod(selectedPeriodId);

      setGenerateResult(result);
      await fetchInvoicesByPeriodData(selectedPeriodId);
    } catch (error) {
      console.error("Failed to generate invoices:", error);
      setGenerateError("تولید فاکتورها با خطا مواجه شد. لطفاً دوباره تلاش کنید.");
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleRefreshInvoices = async () => {
    if (!selectedPeriodId) {
      setInvoices([]);
      setInvoicesError("لطفاً ابتدا یک دوره را انتخاب کنید.");
      return;
    }

    await fetchInvoicesByPeriodData(selectedPeriodId);
  };

  const handleDownloadInvoice = (invoice: InvoiceItem) => {
    flushSync(() => {
      setPrintInvoice(invoice);
    });

    handlePrint();
  };

  const createInvoicePdfBlob = async (invoice: InvoiceItem): Promise<Blob> => {
    flushSync(() => {
      setPrintInvoice(invoice);
    });

    await waitForPaint();

    const invoiceElement = invoicePrintRef.current?.firstElementChild;

    if (!(invoiceElement instanceof HTMLElement)) {
      throw new Error("Printable invoice element was not found.");
    }

    const canvas = await html2canvas(invoiceElement, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      windowWidth: invoiceElement.scrollWidth,
      windowHeight: invoiceElement.scrollHeight,
    });
    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imageHeight;
    let position = 0;

    pdf.addImage(imageData, "PNG", 0, position, pageWidth, imageHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imageData, "PNG", 0, position, pageWidth, imageHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output("blob");
  };

  const handleExportPeriodInvoices = async () => {
    if (invoices.length === 0 || exportLoading) return;

    try {
      setExportLoading(true);
      setExportError("");

      const zip = new JSZip();
      const usedFilenames = new Map<string, number>();

      for (const invoice of invoices) {
        const pdfBlob = await createInvoicePdfBlob(invoice);
        zip.file(getInvoicePdfFilename(invoice, usedFilenames), pdfBlob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const periodCode =
        (selectedPeriod as PeriodWithDisplayFields | undefined)?.code ||
        invoices[0]?.periodCode ||
        invoices[0]?.period?.code ||
        selectedPeriodId;
      const zipFilename = sanitizeFilename(`invoices-${periodCode}`) || "invoices";

      downloadBlobFile(zipBlob, `${zipFilename}.zip`);
    } catch (error) {
      console.error("Failed to export period invoices:", error);
      setExportError("خروجی گرفتن فاکتورهای دوره با خطا مواجه شد.");
    } finally {
      setExportLoading(false);
    }
  };

  const generateButtonDisabled =
    generateLoading || periodsLoading || !!periodsError || !selectedPeriodId;
  const exportButtonDisabled =
    exportLoading || invoicesLoading || generateLoading || invoices.length === 0;

  return (
    <Page title="Invoices">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              مدیریت فاکتورها
            </h2>
          </div>

          <p className="text-sm text-gray-500 dark:text-dark-300">
            برای مشاهده یا تولید فاکتور، ابتدا دوره را انتخاب کنید. با انتخاب هر
            دوره، لیست فاکتورهای همان دوره نمایش داده می‌شود.
          </p>
        </div>

        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-500 dark:bg-dark-700">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-dark-100">
                انتخاب دوره
              </label>

              <select
                value={selectedPeriodId}
                onChange={(e) => void handlePeriodChange(e.target.value)}
                disabled={periodsLoading || !!periodsError || generateLoading}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-50"
              >
                <option value="">
                  {periodsLoading
                    ? "در حال بارگذاری دوره‌ها..."
                    : periodsError
                      ? "خطا در دریافت دوره‌ها"
                      : periods.length === 0
                        ? "هیچ دوره‌ای یافت نشد"
                        : "انتخاب دوره..."}
                </option>

                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {getPeriodLabel(period)}
                  </option>
                ))}
              </select>

              {periodsError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {periodsError}
                </p>
              )}

              {selectedPeriod && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-dark-300">
                    دوره انتخاب‌شده:
                  </span>
                  <Badge color="info">{getPeriodLabel(selectedPeriod)}</Badge>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-end">
              <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                <Button
                  variant="outlined"
                  color="neutral"
                  onClick={() => void handleRefreshInvoices()}
                  disabled={
                    !selectedPeriodId || invoicesLoading || generateLoading
                  }
                  aria-disabled={
                    !selectedPeriodId || invoicesLoading || generateLoading
                  }
                >
                  بروزرسانی لیست فاکتورها
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => void handleExportPeriodInvoices()}
                  disabled={exportButtonDisabled}
                  aria-disabled={exportButtonDisabled}
                  aria-busy={exportLoading}
                >
                  <span className="inline-flex items-center gap-2">
                    {exportLoading ? (
                      <span
                        aria-hidden="true"
                        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      />
                    ) : (
                      <ArrowDownTrayIcon className="size-4" />
                    )}

                    <span>
                      {exportLoading
                        ? "در حال ساخت خروجی..."
                        : "خروجی PDF دوره"}
                    </span>
                  </span>
                </Button>

                <Button
                  color="primary"
                  isGlow
                  onClick={() => void handleGenerateInvoices()}
                  disabled={generateButtonDisabled}
                  aria-disabled={generateButtonDisabled}
                  aria-busy={generateLoading}
                >
                  <span className="inline-flex items-center gap-2">
                    {generateLoading && (
                      <span
                        aria-hidden="true"
                        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      />
                    )}

                    <span>
                      {generateLoading
                        ? "در حال تولید فاکتورها..."
                        : "تولید فاکتورهای دوره"}
                    </span>
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {(generateResult || generateError) && (
          <div className="mb-4 space-y-2">
            {generateResult && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-900/20">
                <p className="mb-2 text-sm font-medium text-green-800 dark:text-green-200">
                  تولید فاکتورها با موفقیت انجام شد.
                </p>

                <div className="grid grid-cols-1 gap-2 text-sm text-green-700 dark:text-green-300 sm:grid-cols-3">
                  <div>شناسه دوره: {generateResult.periodId}</div>
                  <div>تولید شده: {generateResult.generated}</div>
                  <div>رد شده: {generateResult.skipped}</div>
                </div>
              </div>
            )}

            {generateError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {generateError}
                </p>
              </div>
            )}
          </div>
        )}

        {exportError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            {exportError}
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-500 dark:bg-dark-700">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-medium text-gray-800 dark:text-dark-50">
              لیست فاکتورها
            </h3>

            {selectedPeriodId && !invoicesLoading && !invoicesError && (
              <Badge color="primary">{invoices.length} فاکتور</Badge>
            )}
          </div>

          {!selectedPeriodId ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-dark-500 dark:text-dark-300">
              برای مشاهده فاکتورها، ابتدا یک دوره انتخاب کنید.
            </div>
          ) : invoicesLoading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-dark-500 dark:text-dark-300">
              در حال دریافت فاکتورها...
            </div>
          ) : invoicesError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
              {invoicesError}
            </div>
          ) : invoices.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-dark-500 dark:text-dark-300">
              هیچ فاکتوری برای این دوره یافت نشد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-right text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-500">
                    <th className="px-3 py-3 font-medium text-gray-700 dark:text-dark-100">
                      شماره فاکتور
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-700 dark:text-dark-100">
                      عنوان دوره
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-700 dark:text-dark-100">
                      نام خریدار
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-700 dark:text-dark-100">
                      کد پرسنلی
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-700 dark:text-dark-100">
                      نام شرکت
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-700 dark:text-dark-100">
                      نام کالا/خدمت
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-700 dark:text-dark-100">
                      واحد
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-700 dark:text-dark-100">
                      تعداد
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-700 dark:text-dark-100">
                      قیمت واحد
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-700 dark:text-dark-100">
                      جمع کل
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-700 dark:text-dark-100">
                      تاریخ صدور
                    </th>
                    <th className="px-3 py-3 font-medium text-gray-700 dark:text-dark-100">
                      دانلود
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => {
                    const items = invoice.items || [];
                    const hasItems = items.length > 0;

                    if (!hasItems) {
                      return (
                        <tr
                          key={invoice.id}
                          className="border-b border-gray-100 last:border-0 dark:border-dark-600"
                        >
                          <td className="px-3 py-3 text-gray-800 dark:text-dark-50">
                            {invoice.invoiceNumber || "-"}
                          </td>
                          <td className="px-3 py-3 text-gray-700 dark:text-dark-100">
                            {invoice.periodTitle || invoice.period?.title || "-"}
                          </td>
                          <td className="px-3 py-3 text-gray-700 dark:text-dark-100">
                            {invoice.employeeName ||
                              invoice.employee?.fullName ||
                              "-"}
                          </td>
                          <td className="px-3 py-3 text-gray-700 dark:text-dark-100">
                            {invoice.personnelCode ||
                              invoice.employee?.personnelCode ||
                              "-"}
                          </td>
                          <td className="px-3 py-3 text-gray-700 dark:text-dark-100">
                            {getCompanyName(invoice)}
                          </td>
                          <td className="px-3 py-3 text-gray-500 dark:text-dark-300 italic">
                            بدون آیتم
                          </td>
                          <td className="px-3 py-3 text-gray-500 dark:text-dark-300 italic">
                            -
                          </td>
                          <td className="px-3 py-3 text-gray-500 dark:text-dark-300 italic">
                            -
                          </td>
                          <td className="px-3 py-3 text-gray-500 dark:text-dark-300 italic">
                            -
                          </td>
                          <td className="px-3 py-3 text-gray-700 dark:text-dark-100">
                            {formatCurrency(invoice.totalAmount)}
                          </td>
                          <td className="px-3 py-3 text-gray-700 dark:text-dark-100">
                            {formatDateTime(invoice.issuedAt)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Button
                              className="size-8 rounded-full"
                              variant="flat"
                              isIcon
                              title="دانلود فاکتور"
                              aria-label="دانلود فاکتور"
                              onClick={() => handleDownloadInvoice(invoice)}
                            >
                              <ArrowDownTrayIcon className="size-5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    }

                    return items.map((item, index) => (
                      <tr
                        key={`${invoice.id}-${item.id}`}
                        className={`border-b border-gray-100 last:border-0 dark:border-dark-600 ${
                          index > 0 ? "bg-gray-50 dark:bg-dark-800/50" : ""
                        }`}
                      >
                        {index === 0 && (
                          <>
                            <td
                              rowSpan={items.length}
                              className="px-3 py-3 text-gray-800 dark:text-dark-50 align-top"
                            >
                              {invoice.invoiceNumber || "-"}
                            </td>
                            <td
                              rowSpan={items.length}
                              className="px-3 py-3 text-gray-700 dark:text-dark-100 align-top"
                            >
                              {invoice.periodTitle ||
                                invoice.period?.title ||
                                "-"}
                            </td>
                            <td
                              rowSpan={items.length}
                              className="px-3 py-3 text-gray-700 dark:text-dark-100 align-top"
                            >
                              {invoice.employeeName ||
                                invoice.employee?.fullName ||
                                "-"}
                            </td>
                            <td
                              rowSpan={items.length}
                              className="px-3 py-3 text-gray-700 dark:text-dark-100 align-top"
                            >
                              {invoice.personnelCode ||
                                invoice.employee?.personnelCode ||
                                "-"}
                            </td>
                            <td
                              rowSpan={items.length}
                              className="px-3 py-3 text-gray-700 dark:text-dark-100 align-top"
                            >
                              {getCompanyName(invoice)}
                            </td>
                          </>
                        )}

                        <td className="px-3 py-3 text-gray-700 dark:text-dark-100">
                          {item.itemName || "-"}
                        </td>
                        <td className="px-3 py-3 text-gray-700 dark:text-dark-100">
                          {item.unitName || "-"}
                        </td>
                        <td className="px-3 py-3 text-gray-700 dark:text-dark-100">
                          {item.quantity || "0"}
                        </td>
                        <td className="px-3 py-3 text-gray-700 dark:text-dark-100">
                          {formatCurrency(item.price)}
                        </td>

                        {index === 0 && (
                          <>
                            <td
                              rowSpan={items.length}
                              className="px-3 py-3 font-medium text-gray-800 dark:text-dark-50 align-top"
                            >
                              {formatCurrency(invoice.totalAmount)}
                            </td>
                            <td
                              rowSpan={items.length}
                              className="px-3 py-3 text-gray-700 dark:text-dark-100 align-top"
                            >
                              {formatDateTime(invoice.issuedAt)}
                            </td>
                            <td
                              rowSpan={items.length}
                              className="px-3 py-3 text-center align-top"
                            >
                              <Button
                                className="size-8 rounded-full"
                                variant="flat"
                                isIcon
                                title="دانلود فاکتور"
                                aria-label="دانلود فاکتور"
                                onClick={() => handleDownloadInvoice(invoice)}
                              >
                                <ArrowDownTrayIcon className="size-5" />
                              </Button>
                            </td>
                          </>
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none fixed -left-[10000px] top-0 bg-white">
        <div ref={invoicePrintRef}>
          <PrintableInvoice invoice={printInvoice} />
        </div>
      </div>
    </Page>
  );
}
