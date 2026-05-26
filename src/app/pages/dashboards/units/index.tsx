// src/app/pages/dashboards/units/index.tsx

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@/components/shared/Page";
import { Button } from "@/components/ui/Button";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Form/Input";
import { Switch } from "@/components/ui/Form/Switch";
import {
  getUnits,
  deleteUnit,
  UnitItem,
  createUnit,
  updateUnit,
  getUnitById,
  CreateUnitPayload,
  UpdateUnitPayload,
} from "@/app/services/endpoints/units";
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

type UnitFormData = CreateUnitPayload;
type UnitFormErrors = Partial<Record<keyof CreateUnitPayload, string>>;

export default function Units() {
  const { t } = useTranslation();

  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>("pending");
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<ModalMode>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UnitFormData>({
    name: "",
    shortName: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<UnitFormErrors>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formModalState, setFormModalState] = useState<ModalState>("pending");

  const resetForm = () => {
    setFormMode(null);
    setEditingUnitId(null);
    setFormData({
      name: "",
      shortName: "",
      isActive: true,
    });
    setFormErrors({});
    setFormModalState("pending");
  };

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const data = await getUnits();
      setUnits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch units:", error);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleDeleteClick = (id: string) => {
    setDeletingUnitId(id);
    setModalState("pending");
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUnitId) return;

    setConfirmLoading(true);

    try {
      await deleteUnit(deletingUnitId);
      setModalState("success");
      await fetchUnits();
    } catch (error) {
      console.error("Failed to delete unit:", error);
      setModalState("error");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingUnitId(null);
    setModalState("pending");
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setFormMode("create");
    setFormModalState("pending");
    setFormModalOpen(true);
  };

  const handleOpenEditModal = async (id: string) => {
    setEditingUnitId(id);
    setFormMode("edit");
    setFormModalState("pending");
    setFormErrors({});
    setFormLoading(true);

    try {
      const unit = await getUnitById(id);

      setFormData({
        name: unit.name ?? "",
        shortName: unit.shortName ?? "",
        isActive: unit.isActive,
      });

      setFormModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch unit:", error);
      setEditingUnitId(null);
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

  const handleShortNameChange = (shortName: string) => {
    setFormData((prev) => ({
      ...prev,
      shortName,
    }));

    if (formErrors.shortName) {
      setFormErrors((prev) => ({
        ...prev,
        shortName: undefined,
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
    const errors: UnitFormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "نام واحد الزامی است";
    }

    if (!formData.shortName.trim()) {
      errors.shortName = "نام کوتاه واحد الزامی است";
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
        await createUnit(formData);
      }

      if (formMode === "edit") {
        if (!editingUnitId) {
          throw new Error("Editing unit id is missing.");
        }

        await updateUnit(editingUnitId, formData as UpdateUnitPayload);
      }

      setFormModalState("success");
      await fetchUnits();

      window.setTimeout(() => {
        setFormModalOpen(false);
        resetForm();
      }, 700);
    } catch (error) {
      console.error("Failed to save unit:", error);
      setFormModalState("error");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Page title="Units">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            واحدها
          </h2>
          <Button color="primary" onClick={handleOpenCreateModal}>افزودن واحد جدید</Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-700">
          <Table>
            <THead>
              <Tr>
                <Th>نام</Th>
                <Th>نام کوتاه</Th>
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
              ) : units.length === 0 ? (
                <Tr>
                  <Td colSpan={5} className="text-center py-4">
                    هیچ واحدی یافت نشد
                  </Td>
                </Tr>
              ) : (
                units.map((unit) => (
                  <Tr key={unit.id}>
                    <Td>{unit.name}</Td>
                    <Td>{unit.shortName}</Td>
                    <Td>
                      <Badge color={unit.isActive ? "success" : "error"}>
                        {unit.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </Td>
                    <Td>
                      {new Date(unit.createdAt).toLocaleDateString("fa-IR")}
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button
                          variant="flat"
                          color="primary"
                          className="h-8 px-3 text-sm"
                          onClick={() => handleOpenEditModal(unit.id)}
                        >
                          ویرایش
                        </Button>
                        <Button
                          variant="flat"
                          color="error"
                          className="h-8 px-3 text-sm"
                          onClick={() => handleDeleteClick(unit.id)}
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
            description: "آیا از حذف این واحد مطمئن هستید؟ این عملیات قابل بازگشت نیست.",
            actionText: "حذف",
          },
          success: {
            title: "واحد حذف شد",
            description: "واحد با موفقیت از پایگاه داده حذف شد.",
            actionText: "انجام شد",
          },
          error: {
            title: "خطا در حذف",
            description: "مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.",
            actionText: "تلاش مجدد",
          },
        }}
      />

      {/* Create/Edit Modal */}
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
              {formMode === "create" && "افزودن واحد جدید"}
              {formMode === "edit" && "ویرایش واحد"}
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
              label="نام واحد"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              error={formErrors.name}
              disabled={formLoading}
            />

            <Input
              label="نام کوتاه"
              value={formData.shortName}
              onChange={(e) => handleShortNameChange(e.target.value)}
              error={formErrors.shortName}
              disabled={formLoading}
            />

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
                      ? "واحد با موفقیت ایجاد شد!"
                      : "واحد با موفقیت به‌روزرسانی شد!"}
                  </p>
                </div>
              )}

              {formModalState === "error" && (
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    خطا در ذخیره واحد. لطفاً دوباره تلاش کنید.
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
