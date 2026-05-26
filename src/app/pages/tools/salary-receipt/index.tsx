// src/app/pages/tools/salary-receipt/index.tsx

import { useEffect, useMemo, useState } from "react";
import { Page } from "@/components/shared/Page";
import { FilePond } from "@/components/shared/form/Filepond";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui";
import {
  generateSalaryReceiptReport,
  parseSalaryReceipt,
  ParseSalaryReceiptResponse,
  SalaryReceiptEmployee,
  SalaryReceiptReportFormat,
} from "@/app/services/endpoints/tools";

type FilePondFileItem = {
  file?: File | Blob;
  filename?: string;
};

type ReportField = {
  key: keyof SalaryReceiptEmployee;
  label: string;
};

const reportFields: ReportField[] = [
  {
    key: "companyName",
    label: "نام شرکت",
  },
  {
    key: "year",
    label: "سال",
  },
  {
    key: "monthTitle",
    label: "ماه",
  },
  {
    key: "receiptType",
    label: "نوع فیش",
  },
  {
    key: "fullName",
    label: "نام و نام خانوادگی",
  },
  {
    key: "personnelCode",
    label: "کد پرسنلی",
  },
  {
    key: "organizationUnit",
    label: "واحد سازمانی",
  },
  {
    key: "jobTitle",
    label: "عنوان شغلی",
  },
  {
    key: "periodTitle",
    label: "عنوان دوره",
  },
  {
    key: "totalLoanInstallments",
    label: "جمع اقساط وام",
  },
  {
    key: "totalBenefits",
    label: "جمع مزایا",
  },
  {
    key: "totalDeductions",
    label: "جمع کسورات",
  },
  {
    key: "accountNumber",
    label: "شماره حساب",
  },
  {
    key: "netPayment",
    label: "خالص پرداختی",
  },
];

const downloadBlobFile = (blob: Blob, filename: string): void => {
  console.groupCollapsed("[salary-receipt page] downloadBlobFile");
  console.log("Blob:", blob);
  console.log("Blob size:", blob.size);
  console.log("Blob type:", blob.type);
  console.log("Filename:", filename);
  console.groupEnd();

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
};

const getReportFilename = (format: SalaryReceiptReportFormat): string => {
  if (format === "pdf") {
    return "salary-receipts.pdf";
  }

  return "salary-receipts.xlsx";
};

export default function SalaryReceiptTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [pondKey, setPondKey] = useState(0);

  const [parseLoading, setParseLoading] = useState(false);
  const [parseResult, setParseResult] =
    useState<ParseSalaryReceiptResponse | null>(null);
  const [parseError, setParseError] = useState("");

  const [reportFormat, setReportFormat] =
    useState<SalaryReceiptReportFormat>("excel");
  const [selectedFields, setSelectedFields] = useState<string[]>(
    reportFields.map((field) => field.key)
  );

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");

  const employees = useMemo(() => {
    const list = parseResult?.data || [];

    console.groupCollapsed("[salary-receipt page] useMemo employees");
    console.log("parseResult:", parseResult);
    console.log("employees:", list);
    console.log("employees length:", list.length);
    console.groupEnd();

    return list;
  }, [parseResult]);

  useEffect(() => {
    console.groupCollapsed("[salary-receipt page] state changed: selectedFile");
    console.log("selectedFile:", selectedFile);
    console.log("selectedFile name:", selectedFile?.name);
    console.log("selectedFile size:", selectedFile?.size);
    console.log("selectedFile type:", selectedFile?.type);
    console.groupEnd();
  }, [selectedFile]);

  useEffect(() => {
    console.groupCollapsed("[salary-receipt page] state changed: selectedFileName");
    console.log("selectedFileName:", selectedFileName);
    console.groupEnd();
  }, [selectedFileName]);

  useEffect(() => {
    console.groupCollapsed("[salary-receipt page] state changed: parseResult");
    console.log("parseResult:", parseResult);
    console.log("parseResult count:", parseResult?.count);
    console.log("parseResult data:", parseResult?.data);
    console.log("parseResult data length:", parseResult?.data?.length);
    console.groupEnd();
  }, [parseResult]);

  useEffect(() => {
    console.groupCollapsed("[salary-receipt page] state changed: parseLoading");
    console.log("parseLoading:", parseLoading);
    console.groupEnd();
  }, [parseLoading]);

  useEffect(() => {
    console.groupCollapsed("[salary-receipt page] state changed: parseError");
    console.log("parseError:", parseError);
    console.groupEnd();
  }, [parseError]);

  useEffect(() => {
    console.groupCollapsed("[salary-receipt page] state changed: reportFormat");
    console.log("reportFormat:", reportFormat);
    console.groupEnd();
  }, [reportFormat]);

  useEffect(() => {
    console.groupCollapsed("[salary-receipt page] state changed: selectedFields");
    console.log("selectedFields:", selectedFields);
    console.log("selectedFields length:", selectedFields.length);
    console.groupEnd();
  }, [selectedFields]);

  useEffect(() => {
    console.groupCollapsed("[salary-receipt page] state changed: reportLoading");
    console.log("reportLoading:", reportLoading);
    console.groupEnd();
  }, [reportLoading]);

  useEffect(() => {
    console.groupCollapsed("[salary-receipt page] state changed: reportError");
    console.log("reportError:", reportError);
    console.groupEnd();
  }, [reportError]);

  useEffect(() => {
    console.groupCollapsed("[salary-receipt page] state changed: reportSuccess");
    console.log("reportSuccess:", reportSuccess);
    console.groupEnd();
  }, [reportSuccess]);

  const resetSelectedFile = () => {
    console.groupCollapsed("[salary-receipt page] resetSelectedFile");
    console.log("Reset selected file started");
    console.groupEnd();

    setSelectedFile(null);
    setSelectedFileName("");
    setPondKey((prev) => {
      console.log("[salary-receipt page] pondKey changed:", prev, "=>", prev + 1);
      return prev + 1;
    });
  };

  const resetResults = () => {
    console.groupCollapsed("[salary-receipt page] resetResults");
    console.log("Reset parse/report states started");
    console.groupEnd();

    setParseResult(null);
    setParseError("");
    setReportError("");
    setReportSuccess("");
  };

  const handleFilePondUpdate = (fileItems: FilePondFileItem[]) => {
    console.groupCollapsed("[salary-receipt page] handleFilePondUpdate");
    console.log("fileItems:", fileItems);
    console.log("first fileItem:", fileItems?.[0]);
    console.groupEnd();

    const fileItem = fileItems?.[0];

    if (!fileItem?.file) {
      console.groupCollapsed("[salary-receipt page] handleFilePondUpdate no file");
      console.log("No file selected, clearing state");
      console.groupEnd();

      setSelectedFile(null);
      setSelectedFileName("");
      resetResults();
      return;
    }

    const file = fileItem.file as File;

    console.groupCollapsed("[salary-receipt page] handleFilePondUpdate selected file");
    console.log("fileItem:", fileItem);
    console.log("file:", file);
    console.log("file name:", file.name);
    console.log("file size:", file.size);
    console.log("file type:", file.type);
    console.groupEnd();

    setSelectedFile(file);
    setSelectedFileName(file.name || fileItem.filename || "");
    resetResults();
  };

  const handleClearFile = () => {
    console.groupCollapsed("[salary-receipt page] handleClearFile");
    console.log("parseLoading:", parseLoading);
    console.log("reportLoading:", reportLoading);
    console.log("selectedFile:", selectedFile);
    console.groupEnd();

    if (parseLoading || reportLoading) return;

    resetSelectedFile();
    resetResults();
  };

  const handleParseSubmit = async () => {
    console.groupCollapsed("[salary-receipt page] handleParseSubmit START");
    console.log("selectedFile:", selectedFile);
    console.log("selectedFileName:", selectedFileName);
    console.log("parseLoading:", parseLoading);
    console.log("reportLoading:", reportLoading);
    console.groupEnd();

    if (!selectedFile) {
      console.groupCollapsed("[salary-receipt page] handleParseSubmit no file");
      console.log("No selected file");
      console.groupEnd();

      setParseResult(null);
      setParseError("لطفاً ابتدا فایل XML فیش حقوقی را انتخاب کنید.");
      return;
    }

    setParseLoading(true);
    setParseResult(null);
    setParseError("");
    setReportError("");
    setReportSuccess("");

    try {
      console.groupCollapsed("[salary-receipt page] calling parseSalaryReceipt");
      console.log("File:", selectedFile);
      console.log("File name:", selectedFile.name);
      console.log("File size:", selectedFile.size);
      console.log("File type:", selectedFile.type);
      console.groupEnd();

      const result = await parseSalaryReceipt({
        file: selectedFile,
      });

      console.groupCollapsed("[salary-receipt page] parseSalaryReceipt RESULT");
      console.log("Result:", result);
      console.log("Result count:", result?.count);
      console.log("Result data:", result?.data);
      console.log("Result data length:", result?.data?.length);
      console.groupEnd();

      setParseResult(result);
    } catch (error) {
      console.groupCollapsed("[salary-receipt page] handleParseSubmit ERROR");
      console.error("Failed to parse salary receipt XML:", error);
      console.groupEnd();

      setParseError(
        "خطا در پردازش فایل XML فیش حقوقی. لطفاً ساختار فایل را بررسی کنید."
      );
    } finally {
      console.groupCollapsed("[salary-receipt page] handleParseSubmit FINALLY");
      console.log("Set parseLoading false");
      console.groupEnd();

      setParseLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    console.groupCollapsed("[salary-receipt page] handleGenerateReport START");
    console.log("selectedFile:", selectedFile);
    console.log("reportFormat:", reportFormat);
    console.log("selectedFields:", selectedFields);
    console.log("selectedFields length:", selectedFields.length);
    console.groupEnd();

    if (!selectedFile) {
      console.groupCollapsed("[salary-receipt page] handleGenerateReport no file");
      console.log("No selected file");
      console.groupEnd();

      setReportSuccess("");
      setReportError("لطفاً ابتدا فایل XML فیش حقوقی را انتخاب کنید.");
      return;
    }

    if (selectedFields.length === 0) {
      console.groupCollapsed("[salary-receipt page] handleGenerateReport no fields");
      console.log("No selected fields");
      console.groupEnd();

      setReportSuccess("");
      setReportError("لطفاً حداقل یک فیلد برای گزارش انتخاب کنید.");
      return;
    }

    setReportLoading(true);
    setReportError("");
    setReportSuccess("");

    try {
      console.groupCollapsed("[salary-receipt page] calling generateSalaryReceiptReport");
      console.log("File:", selectedFile);
      console.log("Format:", reportFormat);
      console.log("Fields:", selectedFields);
      console.groupEnd();

      const blob = await generateSalaryReceiptReport({
        file: selectedFile,
        format: reportFormat,
        fields: selectedFields,
      });

      console.groupCollapsed("[salary-receipt page] generateSalaryReceiptReport RESULT");
      console.log("Blob:", blob);
      console.log("Blob size:", blob.size);
      console.log("Blob type:", blob.type);
      console.groupEnd();

      downloadBlobFile(blob, getReportFilename(reportFormat));

      setReportSuccess("گزارش با موفقیت تولید و دانلود شد.");
    } catch (error) {
      console.groupCollapsed("[salary-receipt page] handleGenerateReport ERROR");
      console.error("Failed to generate salary receipt report:", error);
      console.groupEnd();

      setReportError("خطا در تولید گزارش. لطفاً دوباره تلاش کنید.");
    } finally {
      console.groupCollapsed("[salary-receipt page] handleGenerateReport FINALLY");
      console.log("Set reportLoading false");
      console.groupEnd();

      setReportLoading(false);
    }
  };

  const handleFieldToggle = (fieldKey: string) => {
    console.groupCollapsed("[salary-receipt page] handleFieldToggle");
    console.log("fieldKey:", fieldKey);
    console.log("selectedFields before:", selectedFields);
    console.groupEnd();

    setSelectedFields((prev) => {
      const next = prev.includes(fieldKey)
        ? prev.filter((item) => item !== fieldKey)
        : [...prev, fieldKey];

      console.groupCollapsed("[salary-receipt page] handleFieldToggle state update");
      console.log("prev:", prev);
      console.log("next:", next);
      console.groupEnd();

      return next;
    });

    setReportError("");
    setReportSuccess("");
  };

  const handleSelectAllFields = () => {
    const allFields = reportFields.map((field) => field.key);

    console.groupCollapsed("[salary-receipt page] handleSelectAllFields");
    console.log("allFields:", allFields);
    console.groupEnd();

    setSelectedFields(allFields);
    setReportError("");
    setReportSuccess("");
  };

  const handleClearFields = () => {
    console.groupCollapsed("[salary-receipt page] handleClearFields");
    console.log("Clear all selected fields");
    console.groupEnd();

    setSelectedFields([]);
    setReportError("");
    setReportSuccess("");
  };

  const parseButtonDisabled = parseLoading || reportLoading || !selectedFile;
  const reportButtonDisabled =
    parseLoading ||
    reportLoading ||
    !selectedFile ||
    selectedFields.length === 0;

  console.groupCollapsed("[salary-receipt page] render");
  console.log("selectedFile:", selectedFile);
  console.log("selectedFileName:", selectedFileName);
  console.log("parseLoading:", parseLoading);
  console.log("parseResult:", parseResult);
  console.log("parseError:", parseError);
  console.log("employees:", employees);
  console.log("employees length:", employees.length);
  console.log("reportFormat:", reportFormat);
  console.log("selectedFields:", selectedFields);
  console.log("reportLoading:", reportLoading);
  console.log("reportError:", reportError);
  console.log("reportSuccess:", reportSuccess);
  console.log("parseButtonDisabled:", parseButtonDisabled);
  console.log("reportButtonDisabled:", reportButtonDisabled);
  console.groupEnd();

  return (
    <Page title="Salary Receipt Tools">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              ابزار فیش حقوقی
            </h2>
          </div>

          <p className="text-sm text-gray-500 dark:text-dark-300">
            فایل XML فیش حقوقی را بارگذاری کنید تا اطلاعات کارکنان استخراج شود
            یا گزارش Excel/PDF تولید کنید.
          </p>
        </div>

        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-500 dark:bg-dark-700">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-dark-100">
                فایل XML فیش حقوقی
              </label>

              <div
                className={
                  parseLoading || reportLoading
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
                      "text/xml",
                      "application/xml",
                      ".xml",
                    ]}
                    labelIdle='فایل XML را اینجا رها کنید یا <span class="filepond--label-action">انتخاب کنید</span>'
                    onupdatefiles={handleFilePondUpdate}
                  />
                </div>
              </div>

              {selectedFileName && (
                <p className="mt-2 text-xs text-gray-500 dark:text-dark-300">
                  فایل انتخاب‌شده: {selectedFileName}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button
                  variant="outlined"
                  color="neutral"
                  onClick={handleClearFile}
                  disabled={parseLoading || reportLoading || !selectedFile}
                  aria-disabled={parseLoading || reportLoading || !selectedFile}
                >
                  پاک کردن فایل
                </Button>

                <Button
                  color="primary"
                  isGlow
                  onClick={handleParseSubmit}
                  disabled={parseButtonDisabled}
                  aria-disabled={parseButtonDisabled}
                  aria-busy={parseLoading}
                >
                  <span className="inline-flex items-center gap-2">
                    {parseLoading && (
                      <span
                        aria-hidden="true"
                        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      />
                    )}

                    <span>
                      {parseLoading ? "در حال پردازش..." : "Parse فایل XML"}
                    </span>
                  </span>
                </Button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-dark-100">
                تنظیمات گزارش
              </label>

              <div className="mb-4">
                <select
                  value={reportFormat}
                  onChange={(e) => {
                    console.groupCollapsed("[salary-receipt page] reportFormat changed");
                    console.log("Previous reportFormat:", reportFormat);
                    console.log("New reportFormat:", e.target.value);
                    console.groupEnd();

                    setReportFormat(e.target.value as SalaryReceiptReportFormat);
                  }}
                  disabled={parseLoading || reportLoading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-50"
                >
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>

              <div className="rounded-lg border border-gray-200 p-3 dark:border-dark-500">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-dark-100">
                    فیلدهای خروجی گزارش
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outlined"
                      color="neutral"
                      onClick={handleSelectAllFields}
                      disabled={parseLoading || reportLoading}
                    >
                      انتخاب همه
                    </Button>

                    <Button
                      variant="outlined"
                      color="neutral"
                      onClick={handleClearFields}
                      disabled={parseLoading || reportLoading}
                    >
                      حذف انتخاب‌ها
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {reportFields.map((field) => (
                    <label
                      key={field.key}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-100 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-dark-600 dark:text-dark-100 dark:hover:bg-dark-600"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.key)}
                        onChange={() => handleFieldToggle(field.key)}
                        disabled={parseLoading || reportLoading}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />

                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  color="primary"
                  isGlow
                  onClick={handleGenerateReport}
                  disabled={reportButtonDisabled}
                  aria-disabled={reportButtonDisabled}
                  aria-busy={reportLoading}
                >
                  <span className="inline-flex items-center gap-2">
                    {reportLoading && (
                      <span
                        aria-hidden="true"
                        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      />
                    )}

                    <span>
                      {reportLoading
                        ? "در حال تولید گزارش..."
                        : "تولید و دانلود گزارش"}
                    </span>
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {(parseError || reportError || reportSuccess) && (
          <div className="mb-4 space-y-2">
            {parseError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {parseError}
                </p>
              </div>
            )}

            {reportError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {reportError}
                </p>
              </div>
            )}

            {reportSuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-900/20">
                <p className="text-sm text-green-800 dark:text-green-200">
                  {reportSuccess}
                </p>
              </div>
            )}
          </div>
        )}

        {parseResult && (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-900/20">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  فایل با موفقیت پردازش شد.
                </p>

                <Badge color="success">
                  تعداد کارکنان: {parseResult.count}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-700">
              <div className="border-b border-gray-200 p-4 dark:border-dark-500">
                <h3 className="text-base font-medium text-gray-800 dark:text-dark-50">
                  اطلاعات استخراج‌شده کارکنان
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-dark-500">
                  <thead className="bg-gray-50 dark:bg-dark-800">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-600 dark:text-dark-200">
                        نام و نام خانوادگی
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-600 dark:text-dark-200">
                        کد پرسنلی
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-600 dark:text-dark-200">
                        شرکت
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-600 dark:text-dark-200">
                        واحد
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-600 dark:text-dark-200">
                        شغل
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-600 dark:text-dark-200">
                        دوره
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-600 dark:text-dark-200">
                        خالص پرداختی
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-dark-600">
                    {employees.map((employee, index) => (
                      <tr
                        key={`${employee.personnelCode}-${index}`}
                        className="hover:bg-gray-50 dark:hover:bg-dark-600"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-gray-800 dark:text-dark-50">
                          {employee.fullName || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-dark-200">
                          {employee.personnelCode || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-dark-200">
                          {employee.companyName || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-dark-200">
                          {employee.organizationUnit || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-dark-200">
                          {employee.jobTitle || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-dark-200">
                          {employee.year} - {employee.monthTitle}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-800 dark:text-dark-50">
                          {employee.netPayment || "-"}
                        </td>
                      </tr>
                    ))}

                    {employees.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-gray-500 dark:text-dark-300"
                        >
                          هیچ داده‌ای برای نمایش وجود ندارد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
