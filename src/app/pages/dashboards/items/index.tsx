// src/app/pages/dashboards/items/index.tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Select } from "@/components/ui/Form";

type ModalMode = "create" | "edit" | null;

export default function Items() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ItemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<"pending" | "success" | "error">("pending");
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Form modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<ModalMode>(null);
  const [formData, setFormData] = useState<CreateItemPayload>({
    name: "",
    unitId: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<CreateItemPayload>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formModalState, setFormModalState] = useState<"pending" | "success" | "error">("pending");
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  const fetchUnits = async () => {
    try {
      setUnitsLoading(true);
      const response = await getUnits();
      const data = Array.isArray(response) ? response : response.data || [];
      setUnits(data);
    } catch (error) {
      console.error("Failed to fetch units:", error);
    } finally {
      setUnitsLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await getItems();
      const data = Array.isArray(response) ? response : response.data || [];
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchUnits();
  }, []);

  const handleDeleteClick = (id: string) => {
    setSelectedItemId(id);
    setModalState("pending");
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItemId) return;

    setConfirmLoading(true);
    try {
      await deleteItem(selectedItemId);
      setModalState("success");
      fetchItems();
    } catch (error) {
      console.error("Failed to delete item:", error);
      setModalState("error");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedItemId(null);
    setModalState("pending");
  };

  // Form handlers
  const handleOpenCreateModal = () => {
    setFormMode("create");
    setFormData({ name: "", unitId: "", isActive: true });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleOpenEditModal = async (id: string) => {
    setFormMode("edit");
    setFormLoading(true);
    try {
      const item = await getItemById(id);
      setFormData({
        name: item.name,
        unitId: item.unit.id,
        isActive: item.isActive,
      });
      setFormErrors({});
      setFormModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch item:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setFormMode(null);
    setFormData({ name: "", unitId: "", isActive: true });
    setFormErrors({});
  };

  const handleUnitChange = (unitId: string) => {
    setFormData({ ...formData, unitId });
  };

  const validateForm = (): boolean => {
    const errors: Partial<CreateItemPayload> = {};
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
    try {
      if (formMode === "create") {
        await createItem(formData);
      } else if (formMode === "edit" && selectedItemId) {
        await updateItem(selectedItemId, formData as UpdateItemPayload);
      }
      setFormModalState("success");
      fetchItems();
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
          <Button color="primary" onClick={handleOpenCreateModal}>افزودن آیتم جدید</Button>
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
                  <Td colSpan={5} className="text-center py-4">
                    در حال بارگذاری...
                  </Td>
                </Tr>
              ) : items.length === 0 ? (
                <Tr>
                  <Td colSpan={5} className="text-center py-4">
                    هیچ آیتمی یافت نشد
                  </Td>
                </Tr>
              ) : (
                items.map((item) => (
                  <Tr key={item.id}>
                    <Td>{item.name}</Td>
                    <Td>{item.unit.name}</Td>
                    <Td>
                      <Badge color={item.isActive ? "success" : "error"}>
                        {item.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </Td>
                    <Td>
                      {new Date(item.createdAt).toLocaleDateString("fa-IR")}
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
            description: "آیا از حذف این آیتم مطمئن هستید؟ این عملیات قابل بازگشت نیست.",
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-dark-50">
              {formMode === "create" && "افزودن آیتم جدید"}
              {formMode === "edit" && "ویرایش آیتم"}
            </h3>
            <button
              onClick={handleCloseFormModal}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              disabled={formLoading}
            />

            <Select
              label="واحد"
              value={formData.unitId}
              onChange={handleUnitChange}
              options={[
                { value: "", label: unitsLoading ? "در حال بارگذاری..." : "انتخاب واحد..." },
                ...units.map((unit) => ({
                  value: unit.id,
                  label: `${unit.name} (${unit.shortName})`,
                })),
              ]}
              error={formErrors.unitId}
              disabled={formLoading || unitsLoading}
            />

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isActive}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                disabled={formLoading}
              />
              <span className="text-sm text-gray-700 dark:text-dark-300">فعال</span>
            </div>

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
                type="submit"
                loading={formLoading}
              >
                ذخیره
              </Button>
            </div>
          </form>

          {/* Success/Error State */}
          {formModalState !== "pending" && formModalState !== "error" && (
            <div className="mt-4">
              {formModalState === "success" && (
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {formMode === "create" ? "آیتم با موفقیت ایجاد شد!" : "آیتم با موفقیت به‌روزرسانی شد!"}
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
