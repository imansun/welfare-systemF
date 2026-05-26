// Import Dependencies
import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@/components/shared/Page";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";

// Local Imports
import { CollapsibleSearch } from "@/components/shared/CollapsibleSearch";
import {
  Button,
  Card,
  Table,
  THead,
  TBody,
  Th,
  Tr,
  Td,
} from "@/components/ui";
import { useDisclosure } from "@/hooks";
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

// ----------------------------------------------------------------------

type ModalMode = "create" | "edit" | null;
type ModalState = "pending" | "success" | "error";

type UnitFormData = CreateUnitPayload;
type UnitFormErrors = Partial<Record<keyof CreateUnitPayload, string>>;

const defaultColumns: ColumnDef<UnitItem>[] = [
  {
    accessorKey: "name",
    id: "name",
    header: "نام",
  },
  {
    accessorKey: "shortName",
    id: "shortName",
    header: "نام کوتاه",
  },
  {
    accessorKey: "isActive",
    id: "isActive",
    header: "وضعیت",
    cell: ({ row }) => (
      <Badge color={row.original.isActive ? "success" : "error"}>
        {row.original.isActive ? "فعال" : "غیرفعال"}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    id: "createdAt",
    header: "تاریخ ایجاد",
    cell: ({ row }) =>
      row.original.createdAt
        ? new Date(row.original.createdAt).toLocaleDateString("fa-IR")
        : "-",
  },
  {
    id: "actions",
    header: "عملیات",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button
          variant="flat"
          color="primary"
          className="h-8 px-3 text-sm"
          onClick={() => handleOpenEditModal(row.original.id)}
        >
          ویرایش
        </Button>
        <Button
          variant="flat"
          color="error"
          className="h-8 px-3 text-sm"
          onClick={() => handleDeleteClick(row.original.id)}
        >
          حذف
        </Button>
      </div>
    ),
  },
];

let handleDeleteClick: (id: string) => void;
let handleOpenEditModal: (id: string) => void;

export default function Units() {
  const { t } = useTranslation();

  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

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

  const [isFormOpen, { open: openForm, close: closeForm }] =
    useDisclosure(false);
  const [isDeleteOpen, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

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

  useMemo(() => {
    fetchUnits();
  }, []);

  handleDeleteClick = (id: string) => {
    setDeletingUnitId(id);
    setModalState("pending");
    openDelete();
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
    closeDelete();
    setDeletingUnitId(null);
    setModalState("pending");
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setFormMode("create");
    setFormModalState("pending");
    openForm();
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

      openForm();
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

    closeForm();
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
        closeForm();
        resetForm();
      }, 700);
    } catch (error) {
      console.error("Failed to save unit:", error);
      setFormModalState("error");
    } finally {
      setFormLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<UnitItem>[]>(
    () => [...defaultColumns],
    [],
  );

  const filteredData = useMemo(() => {
    if (!globalFilter) return units;
    return units.filter(
      (unit) =>
        unit.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        unit.shortName.toLowerCase().includes(globalFilter.toLowerCase()),
    );
  }, [units, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Page title="Units">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="dark:text-dark-100 truncate text-base font-medium tracking-wide text-gray-800">
            واحدها
          </h2>
          <div className="flex items-center gap-2">
            <CollapsibleSearch
              placeholder="اینجا جستجو کنید..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
            <Button color="primary" isGlow onClick={handleOpenCreateModal}>
              افزودن واحد جدید
            </Button>
          </div>
        </div>

        <Card>
          <div className="min-w-full overflow-x-auto">
            <Table className="w-full text-left rtl:text-right">
              <THead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <Th
                        key={header.id}
                        className="dark:bg-dark-800 dark:text-dark-100 bg-gray-200 font-semibold text-gray-800 uppercase first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </THead>
              <TBody>
                {loading ? (
                  <Tr>
                    <Td colSpan={columns.length} className="py-4 text-center">
                      در حال بارگذاری...
                    </Td>
                  </Tr>
                ) : filteredData.length === 0 ? (
                  <Tr>
                    <Td colSpan={columns.length} className="py-4 text-center">
                      هیچ واحدی یافت نشد
                    </Td>
                  </Tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <Tr
                      key={row.id}
                      className={clsx(
                        "dark:border-b-dark-500 relative border-y border-transparent border-b-gray-200 last:border-none",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <Td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Td>
                      ))}
                    </Tr>
                  ))
                )}
              </TBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal - Top Drawer Style */}
      <Transition appear show={isDeleteOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-100"
          onClose={handleCloseDeleteModal}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40" />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="ease-out transform-gpu transition-transform duration-200"
            enterFrom="-translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in transform-gpu transition-transform duration-200"
            leaveFrom="translate-y-0"
            leaveTo="-translate-y-full"
          >
            <DialogPanel className="fixed left-0 top-0 flex w-full transform-gpu flex-col bg-white transition-transform duration-200 dark:bg-dark-700">
              <div className="flex justify-between bg-gray-200 px-4 py-3 dark:bg-dark-800 sm:px-5">
                <DialogTitle
                  as="h3"
                  className="items-center text-base font-medium text-gray-800 dark:text-dark-100"
                >
                  {modalState === "pending" && "آیا مطمئن هستید؟"}
                  {modalState === "success" && "واحد حذف شد"}
                  {modalState === "error" && "خطا در حذف"}
                </DialogTitle>
                <Button
                  onClick={handleCloseDeleteModal}
                  variant="flat"
                  className="size-7 shrink-0 rounded-full p-0 ltr:-mr-1.5 rtl:-ml-1.5"
                  disabled={confirmLoading}
                >
                  <XMarkIcon className="size-4.5" />
                </Button>
              </div>
              <div className="p-4">
                {modalState === "pending" && (
                  <p className="text-gray-600 dark:text-dark-300">
                    آیا از حذف این واحد مطمئن هستید؟ این عملیات قابل بازگشت
                    نیست.
                  </p>
                )}
                {modalState === "success" && (
                  <p className="text-green-600 dark:text-green-400">
                    واحد با موفقیت از پایگاه داده حذف شد.
                  </p>
                )}
                {modalState === "error" && (
                  <p className="text-red-600 dark:text-red-400">
                    مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 bg-gray-50 px-4 py-3 dark:bg-dark-800 sm:px-5">
                {modalState === "pending" && (
                  <>
                    <Button
                      variant="outlined"
                      onClick={handleCloseDeleteModal}
                      disabled={confirmLoading}
                    >
                      لغو
                    </Button>
                    <Button
                      color="error"
                      onClick={handleDeleteConfirm}
                      disabled={confirmLoading}
                    >
                      {confirmLoading ? "در حال حذف..." : "حذف"}
                    </Button>
                  </>
                )}
                {modalState !== "pending" && (
                  <Button color="primary" onClick={handleCloseDeleteModal}>
                    انجام شد
                  </Button>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>

      {/* Form Modal - Top Drawer Style */}
      <Transition appear show={isFormOpen} as={Fragment}>
        <Dialog as="div" className="relative z-100" onClose={closeForm}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40" />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="ease-out transform-gpu transition-transform duration-200"
            enterFrom="-translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in transform-gpu transition-transform duration-200"
            leaveFrom="translate-y-0"
            leaveTo="-translate-y-full"
          >
            <DialogPanel className="fixed left-0 top-0 flex w-full transform-gpu flex-col bg-white transition-transform duration-200 dark:bg-dark-700">
              <div className="flex justify-between bg-gray-200 px-4 py-3 dark:bg-dark-800 sm:px-5">
                <DialogTitle
                  as="h3"
                  className="items-center text-base font-medium text-gray-800 dark:text-dark-100"
                >
                  {formMode === "create" && "افزودن واحد جدید"}
                  {formMode === "edit" && "ویرایش واحد"}
                </DialogTitle>
                <Button
                  onClick={handleCloseFormModal}
                  variant="flat"
                  className="size-7 shrink-0 rounded-full p-0 ltr:-mr-1.5 rtl:-ml-1.5"
                  disabled={formLoading}
                >
                  <XMarkIcon className="size-4.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
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

                  {formModalState !== "pending" && (
                    <div>
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
                </form>
              </div>
              <div className="flex justify-end gap-2 bg-gray-50 px-4 py-3 dark:bg-dark-800 sm:px-5">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleCloseFormModal}
                  disabled={formLoading}
                >
                  لغو
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmitForm();
                  }}
                  disabled={formLoading}
                  isGlow={!formLoading}
                >
                  {formLoading ? "در حال ذخیره..." : "ذخیره"}
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </Page>
  );
}
