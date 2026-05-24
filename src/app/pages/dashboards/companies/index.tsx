// src/app/pages/dashboards/companies/index.tsx
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@/components/shared/Page";
import { Button } from "@/components/ui/Button";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Form/Input";
import { Switch } from "@/components/ui/Form/Switch";
import { Upload } from "@/components/ui/Form/Upload";
import {
  getCompanies,
  deleteCompany,
  CompanyItem,
  createCompany,
  updateCompany,
  getCompanyById,
  importCompanies,
  CreateCompanyPayload,
  UpdateCompanyPayload,
  ImportCompaniesResponse,
} from "@/app/services/endpoints/companies";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { CloudArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

type ModalMode = "create" | "edit" | "import" | null;

export default function Companies() {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<"pending" | "success" | "error">("pending");
  const [confirmLoading, setConfirmLoading] = useState(false);
  
  // Form modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<ModalMode>(null);
  const [formData, setFormData] = useState<CreateCompanyPayload>({
    name: "",
    code: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<CreateCompanyPayload>>({});
  const [formLoading, setFormLoading] = useState(false);
  
  // Import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportCompaniesResponse | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await getCompanies({ limit: 100 });
      // API returns array directly based on the example
      const data = Array.isArray(response) ? response : response.data || [];
      setCompanies(data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDeleteClick = (id: string) => {
    setSelectedCompanyId(id);
    setModalState("pending");
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCompanyId) return;

    setConfirmLoading(true);
    try {
      await deleteCompany(selectedCompanyId);
      setModalState("success");
      fetchCompanies();
    } catch (error) {
      console.error("Failed to delete company:", error);
      setModalState("error");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedCompanyId(null);
    setModalState("pending");
  };

  // Form handlers
  const handleOpenCreateModal = () => {
    setFormMode("create");
    setFormData({ name: "", code: "", isActive: true });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleOpenEditModal = async (id: string) => {
    setFormMode("edit");
    setFormLoading(true);
    try {
      const company = await getCompanyById(id);
      setFormData({
        name: company.name,
        code: company.code,
        isActive: company.isActive,
      });
      setFormErrors({});
      setFormModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch company:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setFormMode(null);
    setFormData({ name: "", code: "", isActive: true });
    setFormErrors({});
    setImportFile(null);
    setImportResult(null);
  };

  const validateForm = (): boolean => {
    const errors: Partial<CreateCompanyPayload> = {};
    if (!formData.name.trim()) {
      errors.name = "نام شرکت الزامی است";
    }
    if (!formData.code.trim()) {
      errors.code = "کد شرکت الزامی است";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async () => {
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      if (formMode === "create") {
        await createCompany(formData);
      } else if (formMode === "edit" && selectedCompanyId) {
        await updateCompany(selectedCompanyId, formData as UpdateCompanyPayload);
      }
      setFormModalState("success");
      fetchCompanies();
    } catch (error) {
      console.error("Failed to save company:", error);
      setFormModalState("error");
    } finally {
      setFormLoading(false);
    }
  };

  const [formModalState, setFormModalState] = useState<"pending" | "success" | "error">("pending");

  // Import handlers
  const handleOpenImportModal = () => {
    setFormMode("import");
    setImportFile(null);
    setImportResult(null);
    setFormModalOpen(true);
  };

  const handleFileChange = (files: File[]) => {
    if (files.length > 0) {
      setImportFile(files[0]);
      setImportResult(null);
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;

    setFormLoading(true);
    try {
      const result = await importCompanies(importFile);
      setImportResult(result);
      setFormModalState("success");
      fetchCompanies();
    } catch (error) {
      console.error("Failed to import companies:", error);
      setFormModalState("error");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Page title="Companies">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            شرکت‌ها
          </h2>
          <div className="flex gap-2">
            <Button variant="outlined" color="primary" onClick={handleOpenImportModal}>
              واردات از اکسل
            </Button>
            <Button color="primary" onClick={handleOpenCreateModal}>افزودن شرکت جدید</Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-700">
          <Table>
            <THead>
              <Tr>
                <Th>نام</Th>
                <Th>کد</Th>
                <Th>وضعیت</Th>
                <Th>تاریخ ایجاد</Th>
                <Th>عملیات</Th>
              </Tr>
            </THead>
            <TBody>
              {loading ? (
                <Tr>
                  <Td colSpan={5} className="text-center py-4">
                    در حال بارگذاری...
                  </Td>
                </Tr>
              ) : companies.length === 0 ? (
                <Tr>
                  <Td colSpan={5} className="text-center py-4">
                    هیچ شرکتی یافت نشد
                  </Td>
                </Tr>
              ) : (
                companies.map((company) => (
                  <Tr key={company.id}>
                    <Td>{company.name}</Td>
                    <Td>{company.code}</Td>
                    <Td>
                      <Badge color={company.isActive ? "success" : "error"}>
                        {company.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </Td>
                    <Td>
                      {new Date(company.createdAt).toLocaleDateString("fa-IR")}
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button
                          variant="flat"
                          color="primary"
                          className="h-8 px-3 text-sm"
                          onClick={() => handleOpenEditModal(company.id)}
                        >
                          ویرایش
                        </Button>
                        <Button
                          variant="flat"
                          color="error"
                          className="h-8 px-3 text-sm"
                          onClick={() => handleDeleteClick(company.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </TBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        show={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onOk={handleDeleteConfirm}
        state={modalState}
        confirmLoading={confirmLoading}
        messages={{
          pending: {
            title: "آیا مطمئن هستید؟",
            description: "آیا از حذف این شرکت مطمئن هستید؟ این عملیات قابل بازگشت نیست.",
            actionText: "حذف",
          },
          success: {
            title: "شرکت حذف شد",
            description: "شرکت با موفقیت از پایگاه داده حذف شد.",
            actionText: "انجام شد",
          },
          error: {
            title: "خطا در حذف",
            description: "مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.",
            actionText: "تلاش مجدد",
          },
        }}
      />

      {/* Create/Edit/Import Modal */}
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
          className={clsx(
            "relative w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl transition-all dark:bg-dark-700",
            formMode === "import" ? "max-w-md" : "max-w-lg"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-dark-50">
              {formMode === "create" && "افزودن شرکت جدید"}
              {formMode === "edit" && "ویرایش شرکت"}
              {formMode === "import" && "واردات شرکت‌ها از اکسل"}
            </h3>
            <button
              onClick={handleCloseFormModal}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {formMode === "import" ? (
            // Import Form
            <div className="space-y-4">
              {!importResult ? (
                <>
                  <Upload onChange={handleFileChange} accept=".xlsx,.xls">
                    {({ onClick }) => (
                      <div
                        onClick={onClick}
                        className={clsx(
                          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                          importFile
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                            : "border-gray-300 hover:border-gray-400 dark:border-dark-500 dark:hover:border-dark-400"
                        )}
                      >
                        <CloudArrowUpIcon className="w-12 h-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-dark-300">
                          {importFile
                            ? `فایل انتخاب شده: ${importFile.name}`
                            : "برای انتخاب فایل کلیک کنید یا فایل را اینجا رها کنید"}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-dark-400">
                          فرمت‌های مجاز: .xlsx, .xls
                        </p>
                      </div>
                    )}
                  </Upload>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outlined"
                      onClick={handleCloseFormModal}
                      disabled={formLoading}
                    >
                      لغو
                    </Button>
                    <Button
                      color="primary"
                      onClick={handleImportSubmit}
                      disabled={!importFile || formLoading}
                      loading={formLoading}
                    >
                      شروع واردات
                    </Button>
                  </div>
                </>
              ) : (
                // Import Result
                <div className="space-y-3">
                  <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      واردات با موفقیت انجام شد!
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-dark-600">
                      <p className="text-xs text-gray-500 dark:text-dark-400">تعداد وارد شده</p>
                      <p className="text-lg font-medium text-gray-800 dark:text-dark-50">
                        {importResult.imported}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-dark-600">
                      <p className="text-xs text-gray-500 dark:text-dark-400">تعداد رد شده</p>
                      <p className="text-lg font-medium text-gray-800 dark:text-dark-50">
                        {importResult.skipped}
                      </p>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                        خطاها:
                      </p>
                      <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex justify-end mt-4">
                    <Button color="success" onClick={handleCloseFormModal}>
                      بستن
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Create/Edit Form
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitForm();
              }}
              className="space-y-4"
            >
              <Input
                label="نام شرکت"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                placeholder="مثال: گل نقش"
                disabled={formLoading || formModalState === "success"}
              />

              <Input
                label="کد شرکت"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                error={formErrors.code}
                placeholder="مثال: 120005"
                disabled={formLoading || formModalState === "success"}
              />

              <Switch
                label="فعال"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={formLoading || formModalState === "success"}
                classNames={{ label: "text-sm" }}
              />

              {formModalState === "success" && (
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {formMode === "create"
                      ? "شرکت با موفقیت ایجاد شد!"
                      : "شرکت با موفقیت به‌روزرسانی شد!"}
                  </p>
                </div>
              )}

              {formModalState === "error" && (
                <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleCloseFormModal}
                  disabled={formLoading}
                >
                  {formModalState === "success" ? "بستن" : "لغو"}
                </Button>
                {formModalState !== "success" && (
                  <Button
                    type="submit"
                    color="primary"
                    loading={formLoading}
                  >
                    {formMode === "create" ? "ایجاد" : "ذخیره تغییرات"}
                  </Button>
                )}
              </div>
            </form>
          )}
        </TransitionChild>
      </Transition>
    </Page>
  );
}
