// src/app/pages/dashboards/imports/index.tsx

import { useEffect, useMemo, useState } from "react";
import { Page } from "@/components/shared/Page";
import { FilePond } from "@/components/shared/form/Filepond";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui";
import {
  importPeriodRecipients,
  ImportPeriodRecipientsResponse,
} from "@/app/services/endpoints/imports";
import { getPeriods, PeriodItem } from "@/app/services/endpoints/periods";

type FilePondFileItem = {
  file?: File | Blob;
  filename?: string;
};

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

export default function Imports() {
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [periodsError, setPeriodsError] = useState("");

  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [pondKey, setPondKey] = useState(0);

  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] =
    useState<ImportPeriodRecipientsResponse | null>(null);
  const [importError, setImportError] = useState("");

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

  useEffect(() => {
    fetchPeriods();
  }, []);

  const resetSelectedFile = () => {
    setSelectedFile(null);
    setSelectedFileName("");
    setPondKey((prev) => prev + 1);
  };

  const handlePeriodChange = (periodId: string) => {
    setSelectedPeriodId(periodId);
    setImportResult(null);
    setImportError("");
  };

  const handleFilePondUpdate = (fileItems: FilePondFileItem[]) => {
    const fileItem = fileItems?.[0];

    if (!fileItem?.file) {
      setSelectedFile(null);
      setSelectedFileName("");
      return;
    }

    const file = fileItem.file as File;

    setSelectedFile(file);
    setSelectedFileName(file.name || fileItem.filename || "");
    setImportResult(null);
    setImportError("");
  };

  const handleImportSubmit = async () => {
    if (!selectedPeriodId) {
      setImportResult(null);
      setImportError("لطفاً ابتدا یک دوره را انتخاب کنید.");
      return;
    }

    if (!selectedFile) {
      setImportResult(null);
      setImportError("لطفاً ابتدا فایل اکسل را انتخاب کنید.");
      return;
    }

    setImportLoading(true);
    setImportResult(null);
    setImportError("");

    try {
      const result = await importPeriodRecipients(
        selectedPeriodId,
        selectedFile
      );

      setImportResult(result);
      resetSelectedFile();
    } catch (error) {
      console.error("Failed to import period recipients:", error);
      setImportError(
        "خطا در ایمپورت فایل دریافت‌کنندگان دوره. لطفاً دوباره تلاش کنید."
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleClearFile = () => {
    if (importLoading) return;

    resetSelectedFile();
    setImportError("");
    setImportResult(null);
  };

  const importButtonDisabled =
    importLoading || !selectedPeriodId || !selectedFile;

  return (
    <Page title="Imports">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              ایمپورت دریافت‌کنندگان دوره
            </h2>
          </div>

          <p className="text-sm text-gray-500 dark:text-dark-300">
            برای ایمپورت دریافت‌کنندگان، ابتدا دوره را انتخاب کرده و سپس فایل
            اکسل را بارگذاری کنید.
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
                onChange={(e) => handlePeriodChange(e.target.value)}
                disabled={periodsLoading || !!periodsError || importLoading}
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-dark-100">
                فایل اکسل
              </label>

              <div
                className={
                  !selectedPeriodId || importLoading
                    ? "pointer-events-none opacity-60"
                    : ""
                }
              >
                <div className="max-w-xl">
                  <FilePond
                    key={pondKey}
                    allowMultiple={false}
                    grid={2}
                    acceptedFileTypes={[
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                      "application/vnd.ms-excel",
                    ]}
                    labelIdle='فایل اکسل را اینجا رها کنید یا <span class="filepond--label-action">انتخاب کنید</span>'
                    onupdatefiles={handleFilePondUpdate}
                  />
                </div>
              </div>

              {!selectedPeriodId && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  برای فعال شدن آپلود، ابتدا یک دوره انتخاب کنید.
                </p>
              )}

              {selectedFileName && (
                <p className="mt-2 text-xs text-gray-500 dark:text-dark-300">
                  فایل انتخاب‌شده: {selectedFileName}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outlined"
              color="neutral"
              onClick={handleClearFile}
              disabled={importLoading || !selectedFile}
              aria-disabled={importLoading || !selectedFile}
            >
              پاک کردن فایل
            </Button>

            <Button
              color="primary"
              isGlow
              onClick={handleImportSubmit}
              disabled={importButtonDisabled}
              aria-disabled={importButtonDisabled}
              aria-busy={importLoading}
            >
              <span className="inline-flex items-center gap-2">
                {importLoading && (
                  <span
                    aria-hidden="true"
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                )}

                <span>
                  {importLoading
                    ? "در حال ایمپورت..."
                    : "شروع ایمپورت دریافت‌کنندگان"}
                </span>
              </span>
            </Button>
          </div>
        </div>

        {(importResult || importError) && (
          <div className="space-y-2">
            {importResult && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-900/20">
                <p className="mb-2 text-sm font-medium text-green-800 dark:text-green-200">
                  ایمپورت با موفقیت انجام شد.
                </p>

                <div className="grid grid-cols-1 gap-2 text-sm text-green-700 dark:text-green-300 sm:grid-cols-3">
                  <div>شناسه دوره: {importResult.periodId}</div>
                  <div>ایمپورت شده: {importResult.imported}</div>
                  <div>رد شده: {importResult.skipped}</div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 text-sm font-medium text-red-700 dark:text-red-300">
                      خطاها:
                    </p>

                    <ul className="list-disc space-y-1 pr-5 text-sm text-red-700 dark:text-red-300">
                      {importResult.errors.map((error, index) => (
                        <li key={`${error}-${index}`}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {importError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {importError}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Page>
  );
}
