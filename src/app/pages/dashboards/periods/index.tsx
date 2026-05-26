// src/app/pages/dashboards/periods/index.tsx

import { ChangeEvent, useEffect, useState } from "react";
import { Page } from "@/components/shared/Page";
import { Button } from "@/components/ui/Button";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Form/Input";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  archivePeriod,
  cancelPeriod,
  createPeriod,
  createPeriodPackageItem,
  deletePeriod,
  deletePeriodPackageItem,
  DistributionPeriod,
  getPeriodById,
  getPeriodPackageItems,
  getPeriods,
  PeriodPackageItem,
  PeriodStatus,
  updatePeriod,
  updatePeriodPackageItem,
  CreatePeriodPayload,
  UpdatePeriodPayload,
  CreatePeriodPackageItemPayload,
  UpdatePeriodPackageItemPayload,
} from "@/app/services/endpoints/periods";

type ModalMode = "create" | "edit" | null;
type ModalState = "pending" | "success" | "error";

type PeriodFormData = CreatePeriodPayload;
type PeriodFormErrors = Partial<Record<keyof CreatePeriodPayload, string>>;

type PackageItemFormData = CreatePeriodPackageItemPayload;
type PackageItemFormErrors = Partial<
  Record<keyof CreatePeriodPackageItemPayload, string>
>;

const getStatusLabel = (status: PeriodStatus) => {
  switch (status) {
    case "DRAFT":
      return "پیش‌نویس";
    case "ACTIVE":
      return "فعال";
    case "CANCELLED":
      return "لغو شده";
    case "ARCHIVED":
      return "آرشیو شده";
    default:
      return status || "-";
  }
};

const getStatusBadgeColor = (
  status: PeriodStatus
): "primary" | "success" | "error" => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "CANCELLED":
      return "error";
    case "ARCHIVED":
      return "primary";
    case "DRAFT":
    default:
      return "primary";
  }
};

const getMonthLabel = (month: number) => {
  const months: Record<number, string> = {
    1: "فروردین",
    2: "اردیبهشت",
    3: "خرداد",
    4: "تیر",
    5: "مرداد",
    6: "شهریور",
    7: "مهر",
    8: "آبان",
    9: "آذر",
    10: "دی",
    11: "بهمن",
    12: "اسفند",
  };

  return months[month] ?? String(month);
};

const getCurrentJalaliYear = () => {
  const formatter = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
    year: "numeric",
  });

  const year = Number(formatter.format(new Date()));

  return Number.isFinite(year) ? year : 1405;
};

const getCurrentJalaliMonth = () => {
  const formatter = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
    month: "numeric",
  });

  const month = Number(formatter.format(new Date()));

  return Number.isFinite(month) ? month : 1;
};

export default function Periods() {
  const [periods, setPeriods] = useState<DistributionPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPeriodId, setDeletingPeriodId] = useState<string | null>(null);
  const [deleteModalState, setDeleteModalState] =
    useState<ModalState>("pending");
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<ModalMode>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PeriodFormData>({
    code: "",
    title: "",
    year: getCurrentJalaliYear(),
    month: getCurrentJalaliMonth(),
    description: "",
    createdById: "",
  });
  const [formErrors, setFormErrors] = useState<PeriodFormErrors>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formModalState, setFormModalState] =
    useState<ModalState>("pending");

  const [periodActionLoadingId, setPeriodActionLoadingId] = useState<
    string | null
  >(null);

  const [packageItemsModalOpen, setPackageItemsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] =
    useState<DistributionPeriod | null>(null);
  const [packageItems, setPackageItems] = useState<PeriodPackageItem[]>([]);
  const [packageItemsLoading, setPackageItemsLoading] = useState(false);

  const [packageItemFormMode, setPackageItemFormMode] =
    useState<ModalMode>(null);
  const [editingPackageItemId, setEditingPackageItemId] = useState<
    string | null
  >(null);
  const [packageItemFormData, setPackageItemFormData] =
    useState<PackageItemFormData>({
      itemId: "",
      quantity: "",
      note: "",
    });
  const [packageItemFormErrors, setPackageItemFormErrors] =
    useState<PackageItemFormErrors>({});
  const [packageItemFormLoading, setPackageItemFormLoading] = useState(false);
  const [packageItemFormState, setPackageItemFormState] =
    useState<ModalState>("pending");

  const resetPeriodForm = () => {
    setFormMode(null);
    setEditingPeriodId(null);
    setFormData({
      code: "",
      title: "",
      year: getCurrentJalaliYear(),
      month: getCurrentJalaliMonth(),
      description: "",
      createdById: "",
    });
    setFormErrors({});
    setFormModalState("pending");
  };

  const resetPackageItemForm = () => {
    setPackageItemFormMode(null);
    setEditingPackageItemId(null);
    setPackageItemFormData({
      itemId: "",
      quantity: "",
      note: "",
    });
    setPackageItemFormErrors({});
    setPackageItemFormState("pending");
  };

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const data = await getPeriods();
      setPeriods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch periods:", error);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackageItems = async (periodId: string) => {
    try {
      setPackageItemsLoading(true);
      const data = await getPeriodPackageItems(periodId);
      setPackageItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch period package items:", error);
      setPackageItems([]);
    } finally {
      setPackageItemsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleOpenCreateModal = () => {
    resetPeriodForm();
    setFormMode("create");
    setFormModalState("pending");
    setFormModalOpen(true);
  };

  const handleOpenEditModal = async (id: string) => {
    setEditingPeriodId(id);
    setFormMode("edit");
    setFormModalState("pending");
    setFormErrors({});
    setFormLoading(true);

    try {
      const period = await getPeriodById(id);

      setFormData({
        code: period.code ?? "",
        title: period.title ?? "",
        year: period.year,
        month: period.month,
        description: period.description ?? "",
        createdById: period.createdBy?.id ?? "",
      });

      setFormModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch period:", error);
      setEditingPeriodId(null);
      setFormMode(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseFormModal = () => {
    if (formLoading) return;

    setFormModalOpen(false);
    resetPeriodForm();
  };

  const handleDeleteClick = (id: string) => {
    setDeletingPeriodId(id);
    setDeleteModalState("pending");
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingPeriodId(null);
    setDeleteModalState("pending");
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPeriodId) return;

    setConfirmLoading(true);

    try {
      await deletePeriod(deletingPeriodId);
      setDeleteModalState("success");
      await fetchPeriods();
    } catch (error) {
      console.error("Failed to delete period:", error);
      setDeleteModalState("error");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleArchivePeriod = async (id: string) => {
    setPeriodActionLoadingId(id);

    try {
      await archivePeriod(id);
      await fetchPeriods();
    } catch (error) {
      console.error("Failed to archive period:", error);
    } finally {
      setPeriodActionLoadingId(null);
    }
  };

  const handleCancelPeriod = async (id: string) => {
    setPeriodActionLoadingId(id);

    try {
      await cancelPeriod(id);
      await fetchPeriods();
    } catch (error) {
      console.error("Failed to cancel period:", error);
    } finally {
      setPeriodActionLoadingId(null);
    }
  };

  const handlePeriodInputChange = (
    field: keyof PeriodFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleMonthChange = (e: ChangeEvent<HTMLSelectElement>) => {
    handlePeriodInputChange("month", Number(e.target.value));
  };

  const validatePeriodForm = (): boolean => {
    const errors: PeriodFormErrors = {};

    if (!formData.code.trim()) {
      errors.code = "کد دوره الزامی است";
    }

    if (!formData.title.trim()) {
      errors.title = "عنوان دوره الزامی است";
    }

    if (!formData.year || formData.year < 1300 || formData.year > 9999) {
      errors.year = "سال معتبر وارد کنید";
    }

    if (!formData.month || formData.month < 1 || formData.month > 12) {
      errors.month = "ماه معتبر انتخاب کنید";
    }

    if (!formData.createdById.trim()) {
      errors.createdById = "شناسه ایجادکننده الزامی است";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmitPeriodForm = async () => {
    if (!validatePeriodForm()) return;

    setFormLoading(true);
    setFormModalState("pending");

    try {
      const payload: CreatePeriodPayload = {
        code: formData.code.trim(),
        title: formData.title.trim(),
        year: Number(formData.year),
        month: Number(formData.month),
        description: formData.description?.trim() || undefined,
        createdById: formData.createdById.trim(),
      };

      if (formMode === "create") {
        await createPeriod(payload);
      }

      if (formMode === "edit") {
        if (!editingPeriodId) {
          throw new Error("Editing period id is missing.");
        }

        await updatePeriod(editingPeriodId, payload as UpdatePeriodPayload);
      }

      setFormModalState("success");
      await fetchPeriods();

      window.setTimeout(() => {
        setFormModalOpen(false);
        resetPeriodForm();
      }, 700);
    } catch (error) {
      console.error("Failed to save period:", error);
      setFormModalState("error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenPackageItemsModal = async (period: DistributionPeriod) => {
    setSelectedPeriod(period);
    resetPackageItemForm();
    setPackageItems([]);
    setPackageItemsModalOpen(true);
    await fetchPackageItems(period.id);
  };

  const handleClosePackageItemsModal = () => {
    if (packageItemsLoading || packageItemFormLoading) return;

    setPackageItemsModalOpen(false);
    setSelectedPeriod(null);
    setPackageItems([]);
    resetPackageItemForm();
  };

  const handleOpenCreatePackageItemForm = () => {
    resetPackageItemForm();
    setPackageItemFormMode("create");
  };

  const handleOpenEditPackageItemForm = (packageItem: PeriodPackageItem) => {
    setPackageItemFormMode("edit");
    setEditingPackageItemId(packageItem.id);
    setPackageItemFormState("pending");
    setPackageItemFormErrors({});
    setPackageItemFormData({
      itemId: packageItem.item?.id ?? "",
      quantity: packageItem.quantity ?? "",
      note: packageItem.note ?? "",
    });
  };

  const handleCancelPackageItemForm = () => {
    if (packageItemFormLoading) return;

    resetPackageItemForm();
  };

  const handlePackageItemInputChange = (
    field: keyof PackageItemFormData,
    value: string
  ) => {
    setPackageItemFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (packageItemFormErrors[field]) {
      setPackageItemFormErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validatePackageItemForm = (): boolean => {
    const errors: PackageItemFormErrors = {};

    if (!packageItemFormData.itemId.trim()) {
      errors.itemId = "شناسه کالا الزامی است";
    }

    if (!packageItemFormData.quantity.trim()) {
      errors.quantity = "مقدار الزامی است";
    }

    setPackageItemFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmitPackageItemForm = async () => {
    if (!selectedPeriod) return;
    if (!validatePackageItemForm()) return;

    setPackageItemFormLoading(true);
    setPackageItemFormState("pending");

    try {
      const payload: CreatePeriodPackageItemPayload = {
        itemId: packageItemFormData.itemId.trim(),
        quantity: packageItemFormData.quantity.trim(),
        note: packageItemFormData.note?.trim() || undefined,
      };

      if (packageItemFormMode === "create") {
        await createPeriodPackageItem(selectedPeriod.id, payload);
      }

      if (packageItemFormMode === "edit") {
        if (!editingPackageItemId) {
          throw new Error("Editing package item id is missing.");
        }

        await updatePeriodPackageItem(
          selectedPeriod.id,
          editingPackageItemId,
          payload as UpdatePeriodPackageItemPayload
        );
      }

      setPackageItemFormState("success");
      await fetchPackageItems(selectedPeriod.id);
      resetPackageItemForm();
    } catch (error) {
      console.error("Failed to save package item:", error);
      setPackageItemFormState("error");
    } finally {
      setPackageItemFormLoading(false);
    }
  };

  const handleDeletePackageItem = async (packageItemId: string) => {
    if (!selectedPeriod) return;

    const confirmed = window.confirm(
      "آیا از حذف این آیتم از بسته دوره مطمئن هستید؟"
    );

    if (!confirmed) return;

    try {
      await deletePeriodPackageItem(selectedPeriod.id, packageItemId);
      await fetchPackageItems(selectedPeriod.id);
    } catch (error) {
      console.error("Failed to delete package item:", error);
    }
  };

  return (
    <Page title="Periods">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              دوره‌های توزیع
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              مدیریت دوره‌ها و اقلام بسته هر دوره
            </p>
          </div>

          <Button color="primary" onClick={handleOpenCreateModal}>
            افزودن دوره جدید
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-700">
          <Table>
            <THead>
              <Tr>
                <Th>کد</Th>
                <Th>عنوان</Th>
                <Th>سال</Th>
                <Th>ماه</Th>
                <Th>وضعیت</Th>
                <Th>ایجادکننده</Th>
                <Th>تاریخ ایجاد</Th>
                <Th>عملیات</Th>
              </Tr>
            </THead>

            <TBody>
              {loading ? (
                <Tr>
                  <Td colSpan={8} className="py-4 text-center">
                    در حال بارگذاری...
                  </Td>
                </Tr>
              ) : periods.length === 0 ? (
                <Tr>
                  <Td colSpan={8} className="py-4 text-center">
                    هیچ دوره‌ای یافت نشد
                  </Td>
                </Tr>
              ) : (
                periods.map((period) => (
                  <Tr key={period.id}>
                    <Td>{period.code}</Td>
                    <Td>{period.title}</Td>
                    <Td>{period.year}</Td>
                    <Td>{getMonthLabel(period.month)}</Td>
                    <Td>
                      <Badge color={getStatusBadgeColor(period.status)}>
                        {getStatusLabel(period.status)}
                      </Badge>
                    </Td>
                    <Td>{period.createdBy?.displayName ?? "-"}</Td>
                    <Td>
                      {period.createdAt
                        ? new Date(period.createdAt).toLocaleDateString(
                            "fa-IR"
                          )
                        : "-"}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="flat"
                          color="primary"
                          className="h-8 px-3 text-sm"
                          onClick={() => handleOpenPackageItemsModal(period)}
                        >
                          اقلام بسته
                        </Button>

                        <Button
                          variant="flat"
                          color="primary"
                          className="h-8 px-3 text-sm"
                          onClick={() => handleOpenEditModal(period.id)}
                        >
                          ویرایش
                        </Button>

                        <Button
                          variant="flat"
                          color="primary"
                          className="h-8 px-3 text-sm"
                          disabled={periodActionLoadingId === period.id}
                          aria-disabled={periodActionLoadingId === period.id}
                          onClick={() => handleArchivePeriod(period.id)}
                        >
                          آرشیو
                        </Button>

                        <Button
                          variant="flat"
                          color="error"
                          className="h-8 px-3 text-sm"
                          disabled={periodActionLoadingId === period.id}
                          aria-disabled={periodActionLoadingId === period.id}
                          onClick={() => handleCancelPeriod(period.id)}
                        >
                          لغو
                        </Button>

                        <Button
                          variant="flat"
                          color="error"
                          className="h-8 px-3 text-sm"
                          onClick={() => handleDeleteClick(period.id)}
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

      <ConfirmModal
        show={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onOk={handleDeleteConfirm}
        state={deleteModalState}
        confirmLoading={confirmLoading}
        messages={{
          pending: {
            title: "آیا مطمئن هستید؟",
            description:
              "آیا از حذف این دوره مطمئن هستید؟ این عملیات قابل بازگشت نیست.",
            actionText: "حذف",
          },
          success: {
            title: "دوره حذف شد",
            description: "دوره با موفقیت از پایگاه داده حذف شد.",
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
          className="relative w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl transition-all dark:bg-dark-700"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800 dark:text-dark-50">
              {formMode === "create" && "افزودن دوره جدید"}
              {formMode === "edit" && "ویرایش دوره"}
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
              handleSubmitPeriodForm();
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="کد دوره"
                value={formData.code}
                onChange={(e) =>
                  handlePeriodInputChange("code", e.target.value)
                }
                error={formErrors.code}
                disabled={formLoading}
              />

              <Input
                label="عنوان دوره"
                value={formData.title}
                onChange={(e) =>
                  handlePeriodInputChange("title", e.target.value)
                }
                error={formErrors.title}
                disabled={formLoading}
              />

              <Input
                label="سال"
                type="number"
                value={String(formData.year)}
                onChange={(e) =>
                  handlePeriodInputChange("year", Number(e.target.value))
                }
                error={formErrors.year}
                disabled={formLoading}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-dark-100">
                  ماه
                </label>

                <select
                  value={formData.month}
                  onChange={handleMonthChange}
                  disabled={formLoading}
                  aria-disabled={formLoading}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-dark-800 dark:text-dark-50 ${
                    formErrors.month
                      ? "border-red-500"
                      : "border-gray-300 dark:border-dark-500"
                  }`}
                >
                  {Array.from({ length: 12 }).map((_, index) => {
                    const month = index + 1;

                    return (
                      <option key={month} value={month}>
                        {getMonthLabel(month)}
                      </option>
                    );
                  })}
                </select>

                {formErrors.month && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formErrors.month}
                  </p>
                )}
              </div>

              <Input
                label="شناسه ایجادکننده"
                value={formData.createdById}
                onChange={(e) =>
                  handlePeriodInputChange("createdById", e.target.value)
                }
                error={formErrors.createdById}
                disabled={formLoading}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-dark-100">
                توضیحات
              </label>

              <textarea
                value={formData.description ?? ""}
                onChange={(e) =>
                  handlePeriodInputChange("description", e.target.value)
                }
                disabled={formLoading}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-50"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outlined"
                onClick={handleCloseFormModal}
                disabled={formLoading}
                aria-disabled={formLoading}
              >
                لغو
              </Button>

              <Button
                color="primary"
                type="submit"
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
            </div>
          </form>

          {formModalState !== "pending" && (
            <div className="mt-4">
              {formModalState === "success" && (
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {formMode === "create"
                      ? "دوره با موفقیت ایجاد شد."
                      : "دوره با موفقیت به‌روزرسانی شد."}
                  </p>
                </div>
              )}

              {formModalState === "error" && (
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    خطا در ذخیره دوره. لطفاً دوباره تلاش کنید.
                  </p>
                </div>
              )}
            </div>
          )}
        </TransitionChild>
      </Transition>

      <Transition
        appear
        show={packageItemsModalOpen}
        as={Dialog}
        onClose={handleClosePackageItemsModal}
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
          className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl transition-all dark:bg-dark-700"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-dark-50">
                اقلام بسته دوره
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                {selectedPeriod
                  ? `${selectedPeriod.title} - ${selectedPeriod.code}`
                  : "-"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClosePackageItemsModal}
              disabled={packageItemsLoading || packageItemFormLoading}
              aria-disabled={packageItemsLoading || packageItemFormLoading}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {packageItemFormMode ? (
            <div className="mb-5 rounded-lg border border-gray-200 p-4 dark:border-dark-500">
              <h4 className="mb-4 text-sm font-medium text-gray-800 dark:text-dark-50">
                {packageItemFormMode === "create"
                  ? "افزودن آیتم بسته"
                  : "ویرایش آیتم بسته"}
              </h4>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitPackageItemForm();
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label="شناسه کالا"
                    value={packageItemFormData.itemId}
                    onChange={(e) =>
                      handlePackageItemInputChange("itemId", e.target.value)
                    }
                    error={packageItemFormErrors.itemId}
                    disabled={packageItemFormLoading}
                  />

                  <Input
                    label="مقدار"
                    value={packageItemFormData.quantity}
                    onChange={(e) =>
                      handlePackageItemInputChange("quantity", e.target.value)
                    }
                    error={packageItemFormErrors.quantity}
                    disabled={packageItemFormLoading}
                  />

                  <Input
                    label="یادداشت"
                    value={packageItemFormData.note ?? ""}
                    onChange={(e) =>
                      handlePackageItemInputChange("note", e.target.value)
                    }
                    error={packageItemFormErrors.note}
                    disabled={packageItemFormLoading}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleCancelPackageItemForm}
                    disabled={packageItemFormLoading}
                    aria-disabled={packageItemFormLoading}
                  >
                    انصراف
                  </Button>

                  <Button
                    color="primary"
                    type="submit"
                    disabled={packageItemFormLoading}
                    aria-busy={packageItemFormLoading}
                  >
                    {packageItemFormLoading ? "در حال ذخیره..." : "ذخیره آیتم"}
                  </Button>
                </div>
              </form>

              {packageItemFormState === "error" && (
                <div className="mt-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    خطا در ذخیره آیتم بسته. لطفاً دوباره تلاش کنید.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4 flex justify-end">
              <Button color="primary" onClick={handleOpenCreatePackageItemForm}>
                افزودن آیتم بسته
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-dark-500">
            <Table>
              <THead>
                <Tr>
                  <Th>نام کالا</Th>
                  <Th>واحد</Th>
                  <Th>مقدار</Th>
                  <Th>یادداشت</Th>
                  <Th>تاریخ ایجاد</Th>
                  <Th>عملیات</Th>
                </Tr>
              </THead>

              <TBody>
                {packageItemsLoading ? (
                  <Tr>
                    <Td colSpan={6} className="py-4 text-center">
                      در حال بارگذاری...
                    </Td>
                  </Tr>
                ) : packageItems.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} className="py-4 text-center">
                      هیچ آیتمی برای این دوره ثبت نشده است
                    </Td>
                  </Tr>
                ) : (
                  packageItems.map((packageItem) => (
                    <Tr key={packageItem.id}>
                      <Td>{packageItem.item?.name ?? "-"}</Td>
                      <Td>{packageItem.item?.unit?.shortName ?? "-"}</Td>
                      <Td>{packageItem.quantity}</Td>
                      <Td>{packageItem.note ?? "-"}</Td>
                      <Td>
                        {packageItem.createdAt
                          ? new Date(packageItem.createdAt).toLocaleDateString(
                              "fa-IR"
                            )
                          : "-"}
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <Button
                            variant="flat"
                            color="primary"
                            className="h-8 px-3 text-sm"
                            onClick={() =>
                              handleOpenEditPackageItemForm(packageItem)
                            }
                          >
                            ویرایش
                          </Button>

                          <Button
                            variant="flat"
                            color="error"
                            className="h-8 px-3 text-sm"
                            onClick={() =>
                              handleDeletePackageItem(packageItem.id)
                            }
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

          <div className="mt-6 flex justify-end">
            <Button
              variant="outlined"
              onClick={handleClosePackageItemsModal}
              disabled={packageItemsLoading || packageItemFormLoading}
              aria-disabled={packageItemsLoading || packageItemFormLoading}
            >
              بستن
            </Button>
          </div>
        </TransitionChild>
      </Transition>
    </Page>
  );
}
