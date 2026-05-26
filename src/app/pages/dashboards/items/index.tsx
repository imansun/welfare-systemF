// src/app/pages/dashboards/items/index.tsx

import { ChangeEvent, useEffect, useState } from "react";
import { Page } from "@/components/shared/Page";
import { Button } from "@/components/ui/Button";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Form/Input";
import { Switch } from "@/components/ui/Form/Switch";
import {
  getItems,
  deleteItem,
  ItemItem,
  createItem,
  updateItem,
  getItemById,
  CreateItemPayload,
  UpdateItemPayload,
} from "@/app/services/endpoints/items";
import { getUnits, UnitItem } from "@/app/services/endpoints/units";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type ModalMode = "create" | "edit" | null;
type ModalState = "pending" | "success" | "error";

type ItemFormData = CreateItemPayload;
type ItemFormErrors = Partial<Record<keyof CreateItemPayload, string>>;

export default function Items() {
  const [items, setItems] = useState<ItemItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [units, setUnits] = useState<UnitItem[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState<string>("");

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>("pending");
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Form modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<ModalMode>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    name: "",
    unitId: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<ItemFormErrors>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formModalState, setFormModalState] =
    useState<ModalState>("pending");

  const resetForm = () => {
    setFormMode(null);
    setEditingItemId(null);
    setFormData({
      name: "",
      unitId: "",
      isActive: true,
    });
    setFormErrors({});
    setFormModalState("pending");
  };

  const fetchUnits = async () => {
    try {
      setUnitsLoading(true);
      setUnitsError("");

      const data = await getUnits();

      if (Array.isArray(data)) {
        setUnits(data);
      } else {
        setUnits([]);
        setUnitsError("فرمت داده‌های واحدها نامعتبر است.");
      }
    } catch (error) {
      console.error("Failed to fetch units:", error);
      setUnits([]);
      setUnitsError("دریافت لیست واحدها با خطا مواجه شد.");
    } finally {
      setUnitsLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchUnits();
  }, []);

  const handleDeleteClick = (id: string) => {
    setDeletingItemId(id);
    setModalState("pending");
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItemId) return;

    setConfirmLoading(true);

    try {
      await deleteItem(deletingItemId);
      setModalState("success");
      await fetchItems();
    } catch (error) {
      console.error("Failed to delete item:", error);
      setModalState("error");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingItemId(null);
    setModalState("pending");
  };

  const handleOpenCreateModal = async () => {
    resetForm();
    setFormMode("create");
    setFormModalState("pending");

    if (!unitsLoading && units.length === 0) {
      await fetchUnits();
    }

    setFormModalOpen(true);
  };

  const handleOpenEditModal = async (id: string) => {
    setEditingItemId(id);
    setFormMode("edit");
    setFormModalState("pending");
    setFormErrors({});
    setFormLoading(true);

    if (!unitsLoading && units.length === 0) {
      await fetchUnits();
    }

    try {
      const item = await getItemById(id);

      setFormData({
        name: item.name ?? "",
        unitId: item.unit?.id ?? "",
        isActive: item.isActive,
      });

      setFormModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch item:", error);
      setEditingItemId(null);
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

  const handleUnitChange = (unitId: string) => {
    setFormData((prev) => ({
      ...prev,
      unitId,
    }));

    if (formErrors.unitId) {
      setFormErrors((prev) => ({
        ...prev,
        unitId: undefined,
      }));
    }
  };

  const handleUnitSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    handleUnitChange(e.target.value);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
    }));

    if (formErrors.name) {
      setFormErrors((prev) => ({
        ...prev,
        name: undefined,
      }));
    }
  };

  const handleActiveChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isActive: checked,
    }));
  };

  const validateForm = (): boolean => {
    const errors: ItemFormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "نام آیتم الزامی است";
    }

    if (!formData.unitId.trim()) {
      errors.unitId = "انتخاب واحد الزامی است";
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
        await createItem(formData);
      }

      if (formMode === "edit") {
        if (!editingItemId) {
          throw new Error("Editing item id is missing.");
        }

        await updateItem(editingItemId, formData as UpdateItemPayload);
      }

      setFormModalState("success");
      await fetchItems();

      window.setTimeout(() => {
        setFormModalOpen(false);
        resetForm();
      }, 700);
    } catch (error) {
      console.error("Failed to save item:", error);
      setFormModalState("error");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Page title="Items">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            آیتم‌ها
          </h2>

          <Button color="primary" onClick={handleOpenCreateModal}>
            افزودن آیتم جدید
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-700">
          <Table>
            <THead>
              <Tr>
                <Th>نام</Th>
                <Th>واحد</Th>
                <Th>وضعیت</Th>
                <Th>تاریخ ایجاد</Th>
                <Th>عملیات</Th>
              </Tr>
            </THead>

            <TBody>
              {loading ? (
                <Tr>
                  <Td colSpan={5} className="py-4 text-center">
                    در حال بارگذاری...
                  </Td>
                </Tr>
              ) : items.length === 0 ? (
                <Tr>
                  <Td colSpan={5} className="py-4 text-center">
                    هیچ آیتمی یافت نشد
                  </Td>
                </Tr>
              ) : (
                items.map((item) => (
                  <Tr key={item.id}>
                    <Td>{item.name}</Td>
                    <Td>{item.unit?.name ?? "-"}</Td>
                    <Td>
                      <Badge color={item.isActive ? "success" : "error"}>
                        {item.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </Td>
                    <Td>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("fa-IR")
                        : "-"}
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button
                          variant="flat"
                          color="primary"
                          className="h-8 px-3 text-sm"
                          onClick={() => handleOpenEditModal(item.id)}
                        >
                          ویرایش
                        </Button>

                        <Button
                          variant="flat"
                          color="error"
                          className="h-8 px-3 text-sm"
                          onClick={() => handleDeleteClick(item.id)}
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
        state={modalState}
        confirmLoading={confirmLoading}
        messages={{
          pending: {
            title: "آیا مطمئن هستید؟",
            description:
              "آیا از حذف این آیتم مطمئن هستید؟ این عملیات قابل بازگشت نیست.",
            actionText: "حذف",
          },
          success: {
            title: "آیتم حذف شد",
            description: "آیتم با موفقیت از پایگاه داده حذف شد.",
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
              {formMode === "create" && "افزودن آیتم جدید"}
              {formMode === "edit" && "ویرایش آیتم"}
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
              label="نام آیتم"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              error={formErrors.name}
              disabled={formLoading}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-dark-100">
                واحد
              </label>

              <select
                value={formData.unitId}
                onChange={handleUnitSelectChange}
                disabled={formLoading || unitsLoading || !!unitsError}
                aria-disabled={formLoading || unitsLoading || !!unitsError}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-dark-800 dark:text-dark-50 ${
                  formErrors.unitId
                    ? "border-red-500"
                    : "border-gray-300 dark:border-dark-500"
                }`}
              >
                <option value="">
                  {unitsLoading
                    ? "در حال بارگذاری واحدها..."
                    : unitsError
                    ? "خطا در دریافت واحدها"
                    : units.length === 0
                    ? "هیچ واحدی یافت نشد"
                    : "انتخاب واحد..."}
                </option>

                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                    {unit.shortName ? ` (${unit.shortName})` : ""}
                  </option>
                ))}
              </select>

              {formErrors.unitId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {formErrors.unitId}
                </p>
              )}

              {unitsError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {unitsError}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isActive}
                onChange={handleActiveChange}
                disabled={formLoading}
              />
              <span className="text-sm text-gray-700 dark:text-dark-300">
                فعال
              </span>
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
                      ? "آیتم با موفقیت ایجاد شد!"
                      : "آیتم با موفقیت به‌روزرسانی شد!"}
                  </p>
                </div>
              )}

              {formModalState === "error" && (
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    خطا در ذخیره آیتم. لطفاً دوباره تلاش کنید.
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
