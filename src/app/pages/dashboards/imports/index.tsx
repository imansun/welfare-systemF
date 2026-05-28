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
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { Fragment } from "react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

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

            <Popover className="relative">
              <PopoverButton as={Button} variant="outlined" color="neutral" isIcon className="h-8 w-8">
                <QuestionMarkCircleIcon className="size-5" />
              </PopoverButton>
              <Transition
                as={Fragment}
                enter="transition ease-out"
                enterFrom="opacity-0 translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-2"
              >
                <PopoverPanel
                  anchor={{ to: "bottom end", gap: 8 }}
                  className="z-100 w-96 rounded-md border border-gray-300 bg-white px-4 py-3 shadow-lg shadow-gray-200/50 outline-hidden ring-primary-500/50 focus-visible:outline-hidden focus-visible:ring-3 dark:border-dark-500 dark:bg-dark-750 dark:shadow-none"
                >
                  <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">
                    راهنمای ایمپورت دریافت‌کنندگان
                  </h3>
                  
                  <div className="mt-3">
                    <p className="text-sm text-gray-700 dark:text-dark-200">
                      این اندپوینت برای ایمپورت دریافت‌کنندگان یک دوره توزیع از فایل اکسل استفاده می‌شود.
                    </p>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-dark-100">
                      فیلدهای اجباری در اکسل:
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-dark-200">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary-500"></span>
                        <span><strong>personnelCode</strong> (یا personnel_code): کد پرسنلی - اجباری</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary-500"></span>
                        <span><strong>fullName</strong> (یا full_name): نام و نام خانوادگی - اجباری</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-dark-100">
                      فیلدهای اختیاری:
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-dark-200">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gray-400"></span>
                        <span><strong>companyCode/companyName</strong>: کد یا نام شرکت</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gray-400"></span>
                        <span><strong>status</strong>: وضعیت (ACTIVE, INACTIVE, CANCELED) - پیش‌فرض: ACTIVE</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gray-400"></span>
                        <span><strong>note</strong>: یادداشت</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 rounded-md bg-amber-50 p-3 dark:bg-amber-900/20">
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      نکات مهم:
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500"></span>
                        <span>کد پرسنلی تکراری در فایل مجاز نیست</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500"></span>
                        <span>کارمند نباید قبلاً در این دوره ثبت شده باشد</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500"></span>
                        <span>دوره باید در وضعیت DRAFT یا RECIPIENTS_IMPORTED باشد</span>
                      </li>
                    </ul>
                  </div>
                </PopoverPanel>
              </Transition>
            </Popover>
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
