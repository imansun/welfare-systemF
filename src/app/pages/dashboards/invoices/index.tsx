// src/app/pages/dashboards/invoices/index.tsx

import { useEffect, useMemo, useState } from "react";
import { Page } from "@/components/shared/Page";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui";
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

const getCompanyName = (invoice: InvoiceItem): string => {
  return (
    invoice.companyName ||
    invoice.employee?.company?.name ||
    "-"
  );
};

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

  const selectedPeriod = useMemo(() => {
    return periods.find((period) => period.id === selectedPeriodId);
  }, [periods, selectedPeriodId]);

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
    fetchPeriods();
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

  const generateButtonDisabled =
    generateLoading || periodsLoading || !!periodsError || !selectedPeriodId;

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
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-50"
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
                  disabled={!selectedPeriodId || invoicesLoading || generateLoading}
                  aria-disabled={!selectedPeriodId || invoicesLoading || generateLoading}
                >
                  بروزرسانی لیست فاکتورها
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
                            {invoice.employeeName || invoice.employee?.fullName || "-"}
                          </td>
                          <td className="px-3 py-3 text-gray-700 dark:text-dark-100">
                            {invoice.personnelCode ||
                              invoice.employee?.personnelCode ||
                              "-"}
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
                            {invoice.totalAmount || "0"}
                          </td>
                          <td className="px-3 py-3 text-gray-700 dark:text-dark-100">
                            {formatDateTime(invoice.issuedAt)}
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
                              {invoice.periodTitle || invoice.period?.title || "-"}
                            </td>
                            <td
                              rowSpan={items.length}
                              className="px-3 py-3 text-gray-700 dark:text-dark-100 align-top"
                            >
                              {invoice.employeeName || invoice.employee?.fullName || "-"}
                            </td>
                            <td
                              rowSpan={items.length}
                              className="px-3 py-3 text-gray-700 dark:text-dark-100 align-top"
                            >
                              {invoice.personnelCode ||
                                invoice.employee?.personnelCode ||
                                "-"}
                            </td>
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
                          {item.price ? `${Number(item.price).toLocaleString("fa-IR")} ریال` : "0"}
                        </td>
                        <td className="px-3 py-3 font-medium text-gray-800 dark:text-dark-50">
                          {item.lineTotal ? `${Number(item.lineTotal).toLocaleString("fa-IR")} ریال` : "0"}
                        </td>
                        {index === 0 && (
                          <td
                            rowSpan={items.length}
                            className="px-3 py-3 text-gray-700 dark:text-dark-100 align-top"
                          >
                            {formatDateTime(invoice.issuedAt)}
                          </td>
                        )}
                      </>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
