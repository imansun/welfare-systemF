// src/app/pages/dashboards/employees/index.tsx

import { ChangeEvent, useEffect, useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@/components/shared/Page";
import { Button } from "@/components/ui/Button";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Form/Input";
import { Switch } from "@/components/ui/Form/Switch";
import {
  getEmployees,
  deleteEmployee,
  EmployeeItem,
  createEmployee,
  updateEmployee,
  getEmployeeById,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  importEmployees,
  ImportEmployeesResponse,
} from "@/app/services/endpoints/employees";
import { getCompanies, CompanyItem } from "@/app/services/endpoints/companies";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
  Popover,
  PopoverButton,
  PopoverPanel,
  Button as HeadlessButton,
} from "@headlessui/react";
import {
  XMarkIcon,
  QuestionMarkCircleIcon,
  ArrowUpIcon,
  CalendarIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";

type ModalMode = "create" | "edit" | null;
type ModalState = "pending" | "success" | "error";

type EmployeeFormData = CreateEmployeePayload;
type EmployeeFormErrors = Partial<Record<keyof CreateEmployeePayload, string>>;

export default function Employees() {
  const { t } = useTranslation();

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState<string>("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(
    null
  );
  const [modalState, setModalState] = useState<ModalState>("pending");
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<ModalMode>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState<EmployeeFormData>({
    personnelCode: "",
    fullName: "",
    companyId: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<EmployeeFormErrors>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formModalState, setFormModalState] =
    useState<ModalState>("pending");

  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] =
    useState<ImportEmployeesResponse | null>(null);
  const [importError, setImportError] = useState<string>("");

  const resetForm = () => {
    setFormMode(null);
    setEditingEmployeeId(null);
    setFormData({
      personnelCode: "",
      fullName: "",
      companyId: "",
      isActive: true,
    });
    setFormErrors({});
    setFormModalState("pending");
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      setCompaniesError("");

      const data = await getCompanies();

      if (Array.isArray(data)) {
        setCompanies(data);
      } else {
        setCompanies([]);
        setCompaniesError("فرمت داده‌های شرکت‌ها نامعتبر است.");
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      setCompanies([]);
      setCompaniesError("دریافت لیست شرکت‌ها با خطا مواجه شد.");
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchCompanies();
  }, []);

  const handleDeleteClick = (id: string) => {
    setDeletingEmployeeId(id);
    setModalState("pending");
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmployeeId) return;

    setConfirmLoading(true);

    try {
      await deleteEmployee(deletingEmployeeId);
      setModalState("success");
      await fetchEmployees();
    } catch (error) {
      console.error("Failed to delete employee:", error);
      setModalState("error");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingEmployeeId(null);
    setModalState("pending");
  };

  const handleOpenCreateModal = async () => {
    resetForm();
    setFormMode("create");
    setFormModalState("pending");

    if (!companiesLoading && companies.length === 0) {
      await fetchCompanies();
    }

    setFormModalOpen(true);
  };

  const handleOpenEditModal = async (id: string) => {
    setEditingEmployeeId(id);
    setFormMode("edit");
    setFormModalState("pending");
    setFormErrors({});
    setFormLoading(true);

    if (!companiesLoading && companies.length === 0) {
      await fetchCompanies();
    }

    try {
      const employee = await getEmployeeById(id);

      setFormData({
        personnelCode: employee.personnelCode ?? "",
        fullName: employee.fullName ?? "",
        companyId: employee.company?.id ?? "",
        isActive: employee.isActive,
      });

      setFormModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch employee:", error);
      setEditingEmployeeId(null);
      setFormMode(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseFormModal = () => {
    if (formLoading) return;

    setFormModalOpen(false);
    resetForm();
  };

  const handlePersonnelCodeChange = (personnelCode: string) => {
    setFormData((prev) => ({
      ...prev,
      personnelCode,
    }));

    if (formErrors.personnelCode) {
      setFormErrors((prev) => ({
        ...prev,
        personnelCode: undefined,
      }));
    }
  };

  const handleFullNameChange = (fullName: string) => {
    setFormData((prev) => ({
      ...prev,
      fullName,
    }));

    if (formErrors.fullName) {
      setFormErrors((prev) => ({
        ...prev,
        fullName: undefined,
      }));
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setFormData((prev) => ({
      ...prev,
      companyId,
    }));

    if (formErrors.companyId) {
      setFormErrors((prev) => ({
        ...prev,
        companyId: undefined,
      }));
    }
  };

  const handleCompanySelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    handleCompanyChange(e.target.value);
  };

  const handleActiveChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isActive: checked,
    }));
  };

  const validateForm = (): boolean => {
    const errors: EmployeeFormErrors = {};

    if (!formData.personnelCode.trim()) {
      errors.personnelCode = "کد پرسنلی الزامی است";
    }

    if (!formData.fullName.trim()) {
      errors.fullName = "نام و نام خانوادگی الزامی است";
    }

    if (!formData.companyId.trim()) {
      errors.companyId = "انتخاب شرکت الزامی است";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async () => {
    if (!validateForm()) return;

    setFormLoading(true);
    setFormModalState("pending");

    try {
      if (formMode === "create") {
        await createEmployee(formData);
      }

      if (formMode === "edit") {
        if (!editingEmployeeId) {
          throw new Error("Editing employee id is missing.");
        }

        await updateEmployee(
          editingEmployeeId,
          formData as UpdateEmployeePayload
        );
      }

      setFormModalState("success");
      await fetchEmployees();

      window.setTimeout(() => {
        setFormModalOpen(false);
        resetForm();
      }, 700);
    } catch (error) {
      console.error("Failed to save employee:", error);
      setFormModalState("error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleImportChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImportLoading(true);
    setImportResult(null);
    setImportError("");

    try {
      const result = await importEmployees(file);
      setImportResult(result);
      await fetchEmployees();
    } catch (error) {
      console.error("Failed to import employees:", error);
      setImportError("خطا در ایمپورت فایل کارکنان. لطفاً دوباره تلاش کنید.");
    } finally {
      setImportLoading(false);
      e.target.value = "";
    }
  };

  return (
    <Page title="Employees">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            کارکنان
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <Popover className="relative">
              <PopoverButton as={Fragment}>
                {({ hover, active }) => (
                  <Button color="info" isGlow={hover && !active} isIcon>
                    <QuestionMarkCircleIcon className="size-5" />
                  </Button>
                )}
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
                  className="z-100 w-[28rem] max-w-[90vw] rounded-md border border-gray-300 bg-white px-4 py-3 shadow-lg shadow-gray-200/50 outline-hidden ring-primary-500/50 focus-visible:outline-hidden focus-visible:ring-3 dark:border-dark-500 dark:bg-dark-750 dark:shadow-none"
                >
                  <h3 className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">
                    راهنمای وارد کردن کارمندان از فایل اکسل
                  </h3>

                  <div className="mt-3 space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-dark-200">
                        هدف
                      </h4>
                      <p className="mt-1 text-xs text-gray-600 dark:text-dark-300">
                        این امکان به شما اجازه می‌دهد تا اطلاعات کارمندان را به
                        صورت دسته‌ای و از طریق یک فایل اکسل وارد سیستم کنید. با
                        این روش می‌توانید در زمان خود صرفه‌جویی کرده و از ورود
                        تکراری اطلاعات جلوگیری کنید.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-dark-200">
                        فرمت فایل
                      </h4>
                      <ul className="mt-1 list-inside list-disc text-xs text-gray-600 dark:text-dark-300">
                        <li>نوع فایل: اکسل با پسوند .xlsx یا .xls</li>
                        <li>برگه (Sheet): فقط اولین برگه فایل خوانده می‌شود</li>
                        <li>سطر اول: باید شامل نام ستون‌ها (هدر) باشد</li>
                        <li>
                          نام ستون‌ها: حساس به حروف بزرگ/کوچک نیستند و فاصله،
                          زیرخط (_) و خط تیره (-) در آن‌ها نادیده گرفته می‌شود
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-dark-200">
                        ستون‌های مورد نیاز
                      </h4>
                      <div className="mt-1 overflow-x-auto">
                        <table className="min-w-full text-xs text-gray-600 dark:text-dark-300">
                          <thead className="bg-gray-50 dark:bg-dark-700">
                            <tr>
                              <th className="border px-2 py-1 text-right font-medium dark:border-dark-500">
                                نام ستون (انگلیسی)
                              </th>
                              <th className="border px-2 py-1 text-right font-medium dark:border-dark-500">
                                معادل فارسی
                              </th>
                              <th className="border px-2 py-1 text-right font-medium dark:border-dark-500">
                                الزامی/اختیاری
                              </th>
                              <th className="border px-2 py-1 text-right font-medium dark:border-dark-500">
                                توضیحات
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                personnelCode
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                کد پرسنلی
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                الزامی
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                کد یکتای هر کارمند
                              </td>
                            </tr>
                            <tr>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                fullName
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                نام و نام خانوادگی
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                الزامی
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                نام کامل کارمند
                              </td>
                            </tr>
                            <tr>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                isActive
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                فعال، وضعیت
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                اختیاری
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                پیش‌فرض: true (فعال)
                              </td>
                            </tr>
                            <tr>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                companyCode
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                کد شرکت
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                اختیاری
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                کد شرکت مربوطه
                              </td>
                            </tr>
                            <tr>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                companyName
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                نام شرکت
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                اختیاری
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                نام شرکت مربوطه
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-dark-200">
                        مقادیر مجاز برای ستون isActive
                      </h4>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded bg-green-50 p-2 dark:bg-green-900/20">
                          <p className="font-medium text-green-800 dark:text-green-200">
                            مقادیر فعال (true):
                          </p>
                          <p className="mt-1 text-gray-600 dark:text-dark-300">
                            انگلیسی: true, 1, yes, y, active
                            <br />
                            فارسی: فعال, بلی, بله
                          </p>
                        </div>
                        <div className="rounded bg-red-50 p-2 dark:bg-red-900/20">
                          <p className="font-medium text-red-800 dark:text-red-200">
                            مقادیر غیرفعال (false):
                          </p>
                          <p className="mt-1 text-gray-600 dark:text-dark-300">
                            انگلیسی: false, 0, no, n, inactive
                            <br />
                            فارسی: غیرفعال, خیر, نه
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded bg-amber-50 p-2 dark:bg-amber-900/20">
                      <p className="flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                        <ExclamationTriangleIcon className="size-4" />
                        توجه: استفاده از مقادیر دیگر باعث ایجاد خطا می‌شود.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-dark-200">
                        رفتار سیستم در شرایط مختلف
                      </h4>
                      <div className="mt-1 space-y-2 text-xs text-gray-600 dark:text-dark-300">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-dark-200">
                            ۱. شرکت‌ها (Companies)
                          </p>
                          <ul className="mt-1 list-inside list-disc space-y-1">
                            <li>
                              اگر کد شرکت ارائه شده باشد، سیستم ابتدا شرکت را
                              بر اساس کد جستجو می‌کند
                            </li>
                            <li>
                              اگر شرکت با کد مورد نظر یافت نشد، سیستم بر اساس
                              نام شرکت جستجو می‌کند
                            </li>
                            <li>
                              اگر هیچ شرکتی یافت نشد، یک شرکت جدید به صورت
                              خودکار ایجاد می‌شود
                            </li>
                            <li>
                              اگر neither کد شرکت و neither نام شرکت ارائه نشده
                              باشد، فیلد شرکت برای آن کارمند خالی (null)
                              می‌ماند
                            </li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 dark:text-dark-200">
                            ۲. کارمندان جدید در مقابل به‌روزرسانی
                          </p>
                          <ul className="mt-1 list-inside list-disc space-y-1">
                            <li>
                              اگر کد پرسنلی در فایل تکراری باشد → آن سطر نادیده
                              گرفته می‌شود و خطا ثبت می‌گردد
                            </li>
                            <li>
                              اگر کد پرسنلی قبلاً در پایگاه داده وجود داشته
                              باشد → رکورد به‌روزرسانی می‌شود
                            </li>
                            <li>
                              اگر کد پرسنلی جدید باشد → یک رکورد کارمند جدید
                              ایجاد می‌شود
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-dark-200">
                        خروجی عملیات وارد کردن
                      </h4>
                      <div className="mt-1 overflow-x-auto">
                        <table className="min-w-full text-xs text-gray-600 dark:text-dark-300">
                          <thead className="bg-gray-50 dark:bg-dark-700">
                            <tr>
                              <th className="border px-2 py-1 text-right font-medium dark:border-dark-500">
                                فیلد
                              </th>
                              <th className="border px-2 py-1 text-right font-medium dark:border-dark-500">
                                توضیحات
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                totalRows
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                تعداد کل سطرها processed شده
                              </td>
                            </tr>
                            <tr>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                imported
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                تعداد کارمندان جدید ایجاد شده
                              </td>
                            </tr>
                            <tr>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                updated
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                تعداد کارمندان موجود که به‌روزرسانی شدند
                              </td>
                            </tr>
                            <tr>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                skipped
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                تعداد سطرهایی که به دلیل خطا نادیده گرفته شدند
                              </td>
                            </tr>
                            <tr>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                errors
                              </td>
                              <td className="border px-2 py-1 dark:border-dark-500">
                                آرایه‌ای از پیام‌های خطا
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="rounded bg-blue-50 p-2 dark:bg-blue-900/20">
                        <p className="flex items-center gap-1 text-xs font-medium text-blue-800 dark:text-blue-200">
                          <CheckCircleIcon className="size-4" />
                          نکات کلیدی:
                        </p>
                        <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-gray-600 dark:text-dark-300">
                          <li>
                            حداقل یکی از ستون‌های personnelCode یا fullName باید
                            پر باشد
                          </li>
                          <li>کد پرسنلی تکراری در داخل یک فایل مجاز نیست</li>
                          <li>
                            نام ستون‌ها حساس به حروف بزرگ/کوچک نیست
                          </li>
                          <li>
                            فاصله، زیرخط و خط تیره در نام ستون‌ها نادیده گرفته
                            می‌شود
                          </li>
                          <li>
                            اگر شرکت یافت نشود، به صورت خودکار ایجاد می‌شود
                          </li>
                          <li>سطر هدر (سطر اول) جزو داده‌ها محسوب نمی‌شود</li>
                        </ul>
                      </div>

                      <div className="rounded bg-red-50 p-2 dark:bg-red-900/20">
                        <p className="flex items-center gap-1 text-xs font-medium text-red-800 dark:text-red-200">
                          <ExclamationTriangleIcon className="size-4" />
                          خطاهای رایج:
                        </p>
                        <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-gray-600 dark:text-dark-300">
                          <li>خالی بودن کد پرسنلی یا نام کامل</li>
                          <li>تکراری بودن کد پرسنلی در فایل</li>
                          <li>مقدار نامعتبر برای ستون وضعیت (isActive)</li>
                        </ul>
                      </div>

                      <div className="rounded bg-amber-50 p-2 dark:bg-amber-900/20">
                        <p className="flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                          <LightBulbIcon className="size-4" />
                          پیشنهاد:
                        </p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-dark-300">
                          قبل از ارسال فایل نهایی، یک فایل تستی با چند سطر آماده
                          کنید و نتیجه را بررسی نمایید.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-dark-500">
                    <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-400">
                      <CalendarIcon className="size-4" />
                      <span>آخرین به‌روزرسانی: ۱۴۰۳</span>
                    </p>
                    <HeadlessButton as={Fragment}>
                      {({ hover, active }) => (
                        <Button
                          isIcon
                          className="h-7 w-7 rounded-full"
                          color={hover && !active ? "primary" : undefined}
                          isGlow={hover && !active}
                        >
                          <ArrowUpIcon className="size-4 rotate-45" />
                        </Button>
                      )}
                    </HeadlessButton>
                  </div>
                </PopoverPanel>
              </Transition>
            </Popover>

            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 dark:hover:bg-dark-700">
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportChange}
                disabled={importLoading}
              />
              {importLoading ? "در حال ایمپورت..." : "ایمپورت اکسل"}
            </label>

            <HeadlessButton as={Fragment}>
              {({ hover, active }) => (
                <Button color="primary" isGlow={hover && !active} onClick={handleOpenCreateModal}>
                  افزودن کارمند جدید
                </Button>
              )}
            </HeadlessButton>
          </div>
        </div>

        {(importResult || importError) && (
          <div className="mb-4 space-y-2">
            {importResult && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-900/20">
                <p className="mb-2 text-sm font-medium text-green-800 dark:text-green-200">
                  ایمپورت با موفقیت انجام شد.
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-green-700 dark:text-green-300 sm:grid-cols-4">
                  <div>تعداد ردیف‌ها: {importResult.totalRows}</div>
                  <div>ایجاد شده: {importResult.imported}</div>
                  <div>به‌روزرسانی شده: {importResult.updated}</div>
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

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-700">
          <Table>
            <THead>
              <Tr>
                <Th>کد پرسنلی</Th>
                <Th>نام و نام خانوادگی</Th>
                <Th>شرکت</Th>
                <Th>وضعیت</Th>
                <Th>تاریخ ایجاد</Th>
                <Th>عملیات</Th>
              </Tr>
            </THead>

            <TBody>
              {loading ? (
                <Tr>
                  <Td colSpan={6} className="py-4 text-center">
                    در حال بارگذاری...
                  </Td>
                </Tr>
              ) : employees.length === 0 ? (
                <Tr>
                  <Td colSpan={6} className="py-4 text-center">
                    هیچ کارمندی یافت نشد
                  </Td>
                </Tr>
              ) : (
                employees.map((employee) => (
                  <Tr key={employee.id}>
                    <Td>{employee.personnelCode}</Td>
                    <Td>{employee.fullName}</Td>
                    <Td>{employee.company?.name ?? "-"}</Td>
                    <Td>
                      <Badge color={employee.isActive ? "success" : "error"}>
                        {employee.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </Td>
                    <Td>
                      {employee.createdAt
                        ? new Date(employee.createdAt).toLocaleDateString(
                            "fa-IR"
                          )
                        : "-"}
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <HeadlessButton as={Fragment}>
                          {({ hover, active }) => (
                            <Button
                              variant="flat"
                              color="primary"
                              isGlow={hover && !active}
                              className="h-8 px-3 text-sm"
                              onClick={() => handleOpenEditModal(employee.id)}
                            >
                              ویرایش
                            </Button>
                          )}
                        </HeadlessButton>

                        <HeadlessButton as={Fragment}>
                          {({ hover, active }) => (
                            <Button
                              variant="flat"
                              color="error"
                              isGlow={hover && !active}
                              className="h-8 px-3 text-sm"
                              onClick={() => handleDeleteClick(employee.id)}
                            >
                              حذف
                            </Button>
                          )}
                        </HeadlessButton>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </TBody>
          </Table>
        </div>
      </div>

      <ConfirmModal
        show={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onOk={handleDeleteConfirm}
        state={modalState}
        confirmLoading={confirmLoading}
        messages={{
          pending: {
            title: "آیا مطمئن هستید؟",
            description:
              "آیا از حذف این کارمند مطمئن هستید؟ این عملیات قابل بازگشت نیست.",
            actionText: "حذف",
          },
          success: {
            title: "کارمند حذف شد",
            description: "کارمند با موفقیت از پایگاه داده حذف شد.",
            actionText: "انجام شد",
          },
          error: {
            title: "خطا در حذف",
            description: "مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.",
            actionText: "تلاش مجدد",
          },
        }}
      />

      <Transition
        appear
        show={formModalOpen}
        as={Dialog}
        onClose={handleCloseFormModal}
        className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
      >
        <TransitionChild
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="absolute inset-0 bg-gray-900/50 transition-opacity dark:bg-black/40"
        />

        <TransitionChild
          as={DialogPanel}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
          className="relative w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl transition-all dark:bg-dark-700"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800 dark:text-dark-50">
              {formMode === "create" && "افزودن کارمند جدید"}
              {formMode === "edit" && "ویرایش کارمند"}
            </h3>

            <button
              type="button"
              onClick={handleCloseFormModal}
              disabled={formLoading}
              aria-disabled={formLoading}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitForm();
            }}
            className="space-y-4"
          >
            <Input
              label="کد پرسنلی"
              value={formData.personnelCode}
              onChange={(e) => handlePersonnelCodeChange(e.target.value)}
              error={formErrors.personnelCode}
              disabled={formLoading}
            />

            <Input
              label="نام و نام خانوادگی"
              value={formData.fullName}
              onChange={(e) => handleFullNameChange(e.target.value)}
              error={formErrors.fullName}
              disabled={formLoading}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-dark-100">
                شرکت
              </label>

              <select
                value={formData.companyId}
                onChange={handleCompanySelectChange}
                disabled={formLoading || companiesLoading || !!companiesError}
                aria-disabled={
                  formLoading || companiesLoading || !!companiesError
                }
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-dark-800 dark:text-dark-50 ${
                  formErrors.companyId
                    ? "border-red-500"
                    : "border-gray-300 dark:border-dark-500"
                }`}
              >
                <option value="">
                  {companiesLoading
                    ? "در حال بارگذاری شرکت‌ها..."
                    : companiesError
                    ? "خطا در دریافت شرکت‌ها"
                    : companies.length === 0
                    ? "هیچ شرکتی یافت نشد"
                    : "انتخاب شرکت..."}
                </option>

                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>

              {formErrors.companyId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {formErrors.companyId}
                </p>
              )}

              {companiesError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {companiesError}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isActive ?? true}
                onChange={handleActiveChange}
                disabled={formLoading}
              />
              <span className="text-sm text-gray-700 dark:text-dark-300">
                فعال
              </span>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <HeadlessButton as={Fragment}>
                {({ hover, active }) => (
                  <Button
                    type="button"
                    variant="outlined"
                    isGlow={hover && !active}
                    onClick={handleCloseFormModal}
                    disabled={formLoading}
                    aria-disabled={formLoading}
                  >
                    لغو
                  </Button>
                )}
              </HeadlessButton>

              <HeadlessButton as={Fragment}>
                {({ hover, active }) => (
                  <Button
                    color="primary"
                    type="submit"
                    isGlow={hover && !active}
                    disabled={formLoading}
                    aria-busy={formLoading}
                  >
                    <span className="inline-flex items-center gap-2">
                      {formLoading && (
                        <span
                          aria-hidden="true"
                          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        />
                      )}
                      <span>{formLoading ? "در حال ذخیره..." : "ذخیره"}</span>
                    </span>
                  </Button>
                )}
              </HeadlessButton>
            </div>
          </form>

          {formModalState !== "pending" && (
            <div className="mt-4">
              {formModalState === "success" && (
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {formMode === "create"
                      ? "کارمند با موفقیت ایجاد شد!"
                      : "کارمند با موفقیت به‌روزرسانی شد!"}
                  </p>
                </div>
              )}

              {formModalState === "error" && (
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    خطا در ذخیره کارمند. لطفاً دوباره تلاش کنید.
                  </p>
                </div>
              )}
            </div>
          )}
        </TransitionChild>
      </Transition>
    </Page>
  );
}
