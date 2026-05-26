// src/app/pages/dashboards/companies/index.tsx
import {
  Fragment,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Button as HeadlessButton,
  Dialog,
  DialogPanel,
  DialogTitle,
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  CloudArrowUpIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { rankItem } from "@tanstack/match-sorter-utils";
import {
  PaginationState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";

import {
  CompanyItem,
  CompanyListResponse,
  CreateCompanyPayload,
  ImportCompaniesResponse,
  UpdateCompanyPayload,
  createCompany,
  deleteCompany,
  getCompanies,
  getCompanyById,
  importCompanies,
  updateCompany,
} from "@/app/services/endpoints/companies";
import { CollapsibleSearch } from "@/components/shared/CollapsibleSearch";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Page } from "@/components/shared/Page";
import { PaginationSection } from "@/components/shared/table/PaginationSection";
import { SelectedRowsActions } from "@/components/shared/table/SelectedRowsActions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Form/Checkbox";
import { Input } from "@/components/ui/Form/Input";
import { Switch } from "@/components/ui/Form/Switch";
import { Upload } from "@/components/ui/Form/Upload";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { useDisclosure } from "@/hooks";

// ----------------------------------------------------------------------

const fuzzyFilter = (
  row: any,
  columnId: string,
  value: string,
  addMeta: any,
): boolean => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

const columnHelper = createColumnHelper<CompanyItem>();

const DEFAULT_COMPANY_LIST_RESPONSE: CompanyListResponse = {
  data: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

type ModalMode = "create" | "edit" | "import" | null;
type RequestState = "pending" | "success" | "error";

export default function Companies() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);

  const [serverPagination, setServerPagination] = useState<CompanyListResponse>(
    DEFAULT_COMPANY_LIST_RESPONSE,
  );

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );
  const [modalState, setModalState] = useState<RequestState>("pending");
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [isFormDrawerOpen, formDrawer] = useDisclosure(false);

  const [formMode, setFormMode] = useState<ModalMode>(null);
  const [formData, setFormData] = useState<CreateCompanyPayload>({
    name: "",
    code: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof CreateCompanyPayload, string>>
  >({});
  const [formLoading, setFormLoading] = useState(false);
  const [formModalState, setFormModalState] = useState<RequestState>("pending");
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] =
    useState<ImportCompaniesResponse | null>(null);

  const [globalFilter, setGlobalFilter] = useState("");
  const deferredGlobalFilter = useDeferredValue(globalFilter);

  const [statusFilter, setStatusFilter] = useState<string>("همه");

  const DEBUG_COMPANIES = true;

  const debugLog = (...args: any[]) => {
    if (DEBUG_COMPANIES) {
      console.log("[Companies Debug]", ...args);
    }
  };

  const debugError = (...args: any[]) => {
    if (DEBUG_COMPANIES) {
      console.error("[Companies Debug Error]", ...args);
    }
  };

  const isActiveFilter = useMemo<boolean | undefined>(() => {
    if (statusFilter === "فعال") return true;
    if (statusFilter === "غیرفعال") return false;
    return undefined;
  }, [statusFilter]);

  const safeCompanies = companies ?? [];

  const handleDeleteClick = (id: string) => {
    debugLog("handleDeleteClick called with id:", id);
    setSelectedCompanyId(id);
    setModalState("pending");
    setDeleteModalOpen(true);
  };

  const handleOpenEditModal = async (id: string) => {
    debugLog("handleOpenEditModal called with id:", id);

    setSelectedCompanyId(id);
    setFormMode("edit");
    setFormData({ name: "", code: "", isActive: true });
    setFormErrors({});
    setImportFile(null);
    setImportResult(null);
    setFormModalState("pending");
    setFormErrorMessage(null);
    formDrawer.open();
    setFormLoading(true);

    try {
      debugLog("getCompanyById request id:", id);

      const company = await getCompanyById(id);

      debugLog("getCompanyById response:", company);

      setFormData({
        name: company?.name ?? "",
        code: company?.code ?? "",
        isActive: company?.isActive ?? true,
      });
    } catch (error: any) {
      debugError("getCompanyById failed:", error);
      debugError("getCompanyById error response:", error?.response);
      debugError("getCompanyById error response data:", error?.response?.data);
      debugError("getCompanyById error status:", error?.response?.status);

      setFormModalState("error");
      setFormErrorMessage("دریافت اطلاعات شرکت با خطا مواجه شد.");
    } finally {
      setFormLoading(false);
      debugLog("handleOpenEditModal finished");
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              className="size-4.5"
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              className="size-4.5"
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              indeterminate={row.getIsSomeSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      }),
      columnHelper.accessor("name", {
        header: "نام شرکت",
        cell: ({ getValue }) => getValue(),
      }),
      columnHelper.accessor("code", {
        header: "شناسه ملی",
        cell: ({ getValue }) => getValue() || "-",
      }),
      columnHelper.accessor("isActive", {
        header: "وضعیت",
        cell: ({ getValue }) => {
          const active = getValue();

          return (
            <Badge color={active ? "success" : "error"}>
              {active ? "فعال" : "غیرفعال"}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "تاریخ ایجاد",
        cell: ({ getValue }) => {
          const date = getValue();
          return new Date(date).toLocaleDateString("fa-IR");
        },
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: "actions",
        header: "عملیات",
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <HeadlessButton as={Fragment}>
              {({ hover, active }) => (
                <Button
                  variant="flat"
                  color="primary"
                  className="h-8 px-3 text-sm"
                  isGlow={hover && !active}
                  onClick={() => {
                    debugLog("Edit button clicked:", row.original);
                    handleOpenEditModal(row.original.id);
                  }}
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
                  className="h-8 px-3 text-sm"
                  isGlow={hover && !active}
                  onClick={() => {
                    debugLog("Delete button clicked:", row.original);
                    handleDeleteClick(row.original.id);
                  }}
                >
                  حذف
                </Button>
              )}
            </HeadlessButton>
          </div>
        ),
      }),
    ],
    [],
  );

  const fetchCompanies = async () => {
    const params = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: deferredGlobalFilter || undefined,
      isActive: isActiveFilter,
    };

    debugLog("fetchCompanies started");
    debugLog("getCompanies params:", params);

    try {
      setLoading(true);
      setTableError(null);

      const response = await getCompanies(params);

      debugLog("getCompanies raw response:", response);
      debugLog("getCompanies response type:", typeof response);
      debugLog("getCompanies response is array:", Array.isArray(response));
      debugLog("getCompanies response.data:", response?.data);
      debugLog(
        "getCompanies response.data is array:",
        Array.isArray(response?.data),
      );
      debugLog("getCompanies total:", response?.total);
      debugLog("getCompanies totalPages:", response?.totalPages);

      const responseIsArray = Array.isArray(response);

      const safeData = responseIsArray
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const safeResponse: CompanyListResponse = {
        data: safeData,
        total: responseIsArray
          ? safeData.length
          : (response?.total ?? safeData.length),
        page: responseIsArray
          ? pagination.pageIndex + 1
          : (response?.page ?? pagination.pageIndex + 1),
        limit: responseIsArray
          ? pagination.pageSize
          : (response?.limit ?? pagination.pageSize),
        totalPages: responseIsArray
          ? Math.ceil(safeData.length / pagination.pageSize)
          : (response?.totalPages ??
            Math.ceil(safeData.length / pagination.pageSize)),
      };

      debugLog("safeResponse:", safeResponse);

      setServerPagination(safeResponse);
      setCompanies(safeResponse.data ?? []);

      debugLog("companies state will be set to:", safeResponse.data);
    } catch (error: any) {
      debugError("fetchCompanies failed:", error);
      debugError("fetchCompanies error message:", error?.message);
      debugError("fetchCompanies error response:", error?.response);
      debugError("fetchCompanies error response data:", error?.response?.data);
      debugError("fetchCompanies error status:", error?.response?.status);

      setCompanies([]);
      setServerPagination(DEFAULT_COMPANY_LIST_RESPONSE);
      setTableError("مشکلی در دریافت لیست شرکت‌ها پیش آمده است.");
    } finally {
      setLoading(false);
      debugLog("fetchCompanies finished");
    }
  };

  useEffect(() => {
    debugLog("State changed:", {
      pagination,
      globalFilter,
      deferredGlobalFilter,
      statusFilter,
      isActiveFilter,
    });
  }, [
    pagination,
    globalFilter,
    deferredGlobalFilter,
    statusFilter,
    isActiveFilter,
  ]);

  useEffect(() => {
    fetchCompanies();
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    deferredGlobalFilter,
    isActiveFilter,
  ]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [deferredGlobalFilter, statusFilter]);

  const table = useReactTable<CompanyItem>({
    data: safeCompanies,
    columns,
    state: {
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: serverPagination?.totalPages ?? 0,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      deleteRows: async (rows) => {
        try {
          setLoading(true);

          for (const row of rows ?? []) {
            debugLog("bulk delete row:", row.original);
            await deleteCompany(row.original.id);
          }

          await fetchCompanies();
        } catch (error: any) {
          debugError("Failed to delete selected companies:", error);
          debugError("bulk delete error response:", error?.response);
          debugError("bulk delete error response data:", error?.response?.data);
          setTableError("حذف برخی از شرکت‌ها با خطا مواجه شد.");
        } finally {
          setLoading(false);
        }
      },
    },
  });

  const safeTableRows = table.getRowModel()?.rows ?? [];

  useEffect(() => {
    debugLog("Render data snapshot:", {
      companies,
      companiesLength: safeCompanies.length,
      tableRows: safeTableRows,
      tableRowsLength: safeTableRows.length,
      serverPagination,
      loading,
      tableError,
    });
  }, [
    companies,
    safeCompanies.length,
    safeTableRows.length,
    serverPagination,
    loading,
    tableError,
  ]);

  const handleDeleteConfirm = async () => {
    debugLog("handleDeleteConfirm called");
    debugLog("selectedCompanyId:", selectedCompanyId);

    if (!selectedCompanyId) {
      debugLog("delete skipped because selectedCompanyId is empty");
      return;
    }

    setConfirmLoading(true);

    try {
      debugLog("deleteCompany request id:", selectedCompanyId);

      const deleteResponse = await deleteCompany(selectedCompanyId);

      debugLog("deleteCompany response:", deleteResponse);

      setModalState("success");

      debugLog("calling fetchCompanies after delete");
      await fetchCompanies();
      debugLog("fetchCompanies after delete finished");
    } catch (error: any) {
      debugError("deleteCompany failed:", error);
      debugError("delete error message:", error?.message);
      debugError("delete error response:", error?.response);
      debugError("delete error response data:", error?.response?.data);
      debugError("delete error status:", error?.response?.status);

      setModalState("error");
    } finally {
      setConfirmLoading(false);
      debugLog("handleDeleteConfirm finished");
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedCompanyId(null);
    setModalState("pending");
  };

  const resetFormState = () => {
    setFormMode(null);
    setSelectedCompanyId(null);
    setFormData({ name: "", code: "", isActive: true });
    setFormErrors({});
    setImportFile(null);
    setImportResult(null);
    setFormModalState("pending");
    setFormLoading(false);
    setFormErrorMessage(null);
  };

  const handleCloseFormDrawer = () => {
    formDrawer.close();
    resetFormState();
  };

  const handleOpenCreateModal = () => {
    debugLog("handleOpenCreateModal called");

    setSelectedCompanyId(null);
    setFormMode("create");
    setFormData({ name: "", code: "", isActive: true });
    setFormErrors({});
    setImportFile(null);
    setImportResult(null);
    setFormModalState("pending");
    setFormErrorMessage(null);
    formDrawer.open();

    debugLog("create drawer opened");
  };

  const handleOpenImportModal = () => {
    debugLog("handleOpenImportModal called");

    setSelectedCompanyId(null);
    setFormMode("import");
    setFormErrors({});
    setImportFile(null);
    setImportResult(null);
    setFormModalState("pending");
    setFormErrorMessage(null);
    formDrawer.open();

    debugLog("import drawer opened");
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CreateCompanyPayload, string>> = {};

    if (!formData.name?.trim()) errors.name = "نام شرکت الزامی است";
    if (!formData.code?.trim()) errors.code = "کد شرکت الزامی است";

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async () => {
    debugLog("handleSubmitForm called");
    debugLog("formMode:", formMode);
    debugLog("selectedCompanyId:", selectedCompanyId);
    debugLog("formData before validation:", formData);

    const isValid = validateForm();

    debugLog("form validation result:", isValid);
    debugLog("formErrors after validation may update async:", formErrors);

    if (!isValid) return;

    setFormLoading(true);
    setFormModalState("pending");
    setFormErrorMessage(null);

    try {
      if (formMode === "create") {
        const payload: CreateCompanyPayload = {
          name: formData.name.trim(),
          code: formData.code.trim(),
          isActive: formData.isActive ?? true,
        };

        debugLog("createCompany payload:", payload);

        const createResponse = await createCompany(payload);

        debugLog("createCompany response:", createResponse);
      } else if (formMode === "edit" && selectedCompanyId) {
        const payload: UpdateCompanyPayload = {
          name: formData.name.trim(),
          code: formData.code.trim(),
          isActive: formData.isActive ?? true,
        };

        debugLog("updateCompany id:", selectedCompanyId);
        debugLog("updateCompany payload:", payload);

        const updateResponse = await updateCompany(selectedCompanyId, payload);

        debugLog("updateCompany response:", updateResponse);
      } else {
        debugLog("handleSubmitForm skipped because mode/id is invalid:", {
          formMode,
          selectedCompanyId,
        });
      }

      setFormModalState("success");

      debugLog("calling fetchCompanies after save");
      await fetchCompanies();
      debugLog("fetchCompanies after save finished");
    } catch (error: any) {
      debugError("handleSubmitForm failed:", error);
      debugError("save error message:", error?.message);
      debugError("save error response:", error?.response);
      debugError("save error response data:", error?.response?.data);
      debugError("save error status:", error?.response?.status);

      setFormModalState("error");
      setFormErrorMessage("ذخیره اطلاعات شرکت با خطا مواجه شد.");
    } finally {
      setFormLoading(false);
      debugLog("handleSubmitForm finished");
    }
  };

  const handleFileChange = (files: File[]) => {
    debugLog("handleFileChange called:", files);

    if ((files?.length ?? 0) > 0) {
      setImportFile(files[0]);
      setImportResult(null);
      setFormModalState("pending");
      setFormErrorMessage(null);

      debugLog("selected import file:", {
        name: files[0].name,
        size: files[0].size,
        type: files[0].type,
      });
    }
  };

  const handleImportSubmit = async () => {
    debugLog("handleImportSubmit called");
    debugLog("importFile:", importFile);

    if (!importFile) {
      debugLog("import skipped because importFile is empty");
      return;
    }

    setFormLoading(true);
    setFormModalState("pending");
    setFormErrorMessage(null);

    try {
      debugLog("importCompanies request file:", {
        name: importFile.name,
        size: importFile.size,
        type: importFile.type,
      });

      const result = await importCompanies(importFile);

      debugLog("importCompanies raw response:", result);

      const safeImportResult: ImportCompaniesResponse = {
        imported: result?.imported ?? 0,
        skipped: result?.skipped ?? 0,
        errors: result?.errors ?? [],
      };

      debugLog("safeImportResult:", safeImportResult);

      setImportResult(safeImportResult);
      setFormModalState("success");

      debugLog("calling fetchCompanies after import");
      await fetchCompanies();
      debugLog("fetchCompanies after import finished");
    } catch (error: any) {
      debugError("importCompanies failed:", error);
      debugError("import error message:", error?.message);
      debugError("import error response:", error?.response);
      debugError("import error response data:", error?.response?.data);
      debugError("import error status:", error?.response?.status);

      setFormModalState("error");
      setFormErrorMessage(
        "مشکلی در واردات اطلاعات پیش آمده است. لطفاً دوباره تلاش کنید.",
      );
    } finally {
      setFormLoading(false);
      debugLog("handleImportSubmit finished");
    }
  };

  return (
    <Page title="شرکت‌ها">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="dark:text-dark-50 truncate text-xl font-medium tracking-wide text-gray-800">
            شرکت‌ها
          </h2>

          <div className="flex flex-wrap gap-2">
            <div className="max-w-xl">
              <Popover className="relative w-full">
                <PopoverButton as={Button} variant="outlined" color="info">
                  <QuestionMarkCircleIcon className="size-4.5" />
                  <span>راهنمای اکسل</span>
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
                    className="ring-primary-500/50 dark:border-dark-500 dark:bg-dark-750 z-100 w-80 rounded-md border border-gray-300 bg-white px-4 py-3 shadow-lg shadow-gray-200/50 outline-hidden focus-visible:ring-3 focus-visible:outline-hidden dark:shadow-none"
                  >
                    <h3 className="dark:text-dark-100 text-base font-medium tracking-wide text-gray-800">
                      راهنمای واردات اکسل
                    </h3>

                    <div className="dark:text-dark-100 mt-3 space-y-4 text-sm text-gray-600">
                      <div>
                        <p className="dark:text-dark-100 font-medium text-gray-800">
                          ستون‌های پشتیبانی‌شده
                        </p>

                        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-6">
                          <li>
                            <code className="text-primary-600 dark:bg-dark-600 dark:text-primary-400 rounded bg-gray-100 px-1 py-0.5">
                              name
                            </code>{" "}
                            <span className="font-medium">(اجباری):</span> نام
                            قانونی شرکت.
                          </li>

                          <li>
                            <code className="text-primary-600 dark:bg-dark-600 dark:text-primary-400 rounded bg-gray-100 px-1 py-0.5">
                              code
                            </code>{" "}
                            <span className="font-medium">(اختیاری):</span> کد
                            شناسه منحصر‌به‌فرد.
                          </li>
                        </ul>
                      </div>

                      <div>
                        <p className="dark:text-dark-100 font-medium text-gray-800">
                          قوانین داده‌ها
                        </p>

                        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-6">
                          <li>
                            نام‌ها و کدها باید در کل سیستم و فایل یکتا باشند.
                          </li>

                          <li>
                            هدر ستون‌ها حساس به کوچک/بزرگی حروف نیستند و
                            می‌توانند شامل فاصله یا خط تیره باشند؛ مانند{" "}
                            <code className="text-primary-600 dark:bg-dark-600 dark:text-primary-400 rounded bg-gray-100 px-1 py-0.5">
                              Company Name
                            </code>
                            .
                          </li>
                        </ul>
                      </div>

                      <div>
                        <p className="dark:text-dark-100 font-medium text-gray-800">
                          رفتار سیستم
                        </p>

                        <p className="mt-2 text-xs leading-6">
                          رکوردهای تکراری نادیده گرفته می‌شوند{" "}
                          <span className="font-medium">(Skipped)</span> و در
                          نهایت گزارشی از تعداد موفقیت‌ها و خطاها نمایش داده
                          می‌شود.
                        </p>
                      </div>
                    </div>
                  </PopoverPanel>
                </Transition>
              </Popover>
            </div>

            <HeadlessButton as={Fragment}>
              {({ hover, active }) => (
                <Button
                  variant="outlined"
                  color="primary"
                  isGlow={hover && !active}
                  onClick={() => {
                    debugLog("Import button clicked");
                    handleOpenImportModal();
                  }}
                >
                  واردات از اکسل
                </Button>
              )}
            </HeadlessButton>

            <HeadlessButton as={Fragment}>
              {({ hover, active }) => (
                <Button
                  color="primary"
                  isGlow={hover && !active}
                  onClick={() => {
                    debugLog("Create button clicked");
                    handleOpenCreateModal();
                  }}
                >
                  افزودن شرکت جدید
                </Button>
              )}
            </HeadlessButton>
          </div>
        </div>

        <Card skin="bordered" className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <CollapsibleSearch
              value={globalFilter}
              onChange={(event: any) => setGlobalFilter(event.target.value)}
              placeholder="جستجوی شرکت‌ها..."
              className="placeholder:font-light placeholder:text-gray-600"
            />

            <div className="flex items-center gap-1.5">
              {["همه", "فعال", "غیرفعال"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={clsx(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    statusFilter === status
                      ? "bg-primary-500 text-white"
                      : "dark:bg-dark-600 dark:text-dark-200 dark:hover:bg-dark-500 bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <SelectedRowsActions table={table} />
            </div>
          </div>

          {tableError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-200">
                {tableError}
              </p>
            </div>
          )}

          <div className="dark:border-dark-500 dark:bg-dark-700 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <Table>
              <THead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <Th key={header.id} className="text-start">
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
                ) : safeCompanies.length === 0 ? (
                  <Tr>
                    <Td colSpan={columns.length} className="py-4 text-center">
                      هیچ شرکتی یافت نشد
                    </Td>
                  </Tr>
                ) : safeTableRows.length === 0 ? (
                  <Tr>
                    <Td colSpan={columns.length} className="py-4 text-center">
                      هیچ ردیفی برای نمایش وجود ندارد
                    </Td>
                  </Tr>
                ) : (
                  safeTableRows.map((row) => (
                    <Tr
                      key={row.id}
                      className={clsx(
                        row.getIsSelected() && "bg-primary-500/10",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <Td key={cell.id} className="text-start">
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

          {!loading && safeCompanies.length > 0 && (
            <div className="mt-4">
              <PaginationSection table={table} />
            </div>
          )}

          {!loading && (serverPagination?.total ?? 0) > 0 && (
            <div className="dark:text-dark-300 mt-2 text-xs text-gray-500">
              نمایش {safeCompanies.length} مورد از{" "}
              {serverPagination?.total ?? 0} شرکت
            </div>
          )}
        </Card>
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
              "آیا از حذف این شرکت مطمئن هستید؟ این عملیات قابل بازگشت نیست.",
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

      <Transition appear show={isFormDrawerOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-100"
          onClose={handleCloseFormDrawer}
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
            <DialogPanel className="dark:bg-dark-700 fixed top-0 left-0 flex max-h-[90vh] w-full transform-gpu flex-col overflow-hidden bg-white transition-transform duration-200">
              <div className="dark:bg-dark-800 flex items-center justify-between bg-gray-200 px-4 py-3 sm:px-5">
                <DialogTitle
                  as="h3"
                  className="dark:text-dark-100 text-base font-medium text-gray-800"
                >
                  {formMode === "create" && "افزودن شرکت جدید"}
                  {formMode === "edit" && "ویرایش شرکت"}
                  {formMode === "import" && "واردات شرکت‌ها از اکسل"}
                </DialogTitle>

                <Button
                  onClick={handleCloseFormDrawer}
                  variant="flat"
                  className="size-7 shrink-0 rounded-full p-0 ltr:-mr-1.5 rtl:-ml-1.5"
                >
                  <XMarkIcon className="size-4.5" />
                </Button>
              </div>

              <div className="overflow-y-auto p-4 sm:p-5">
                <div
                  className={clsx(
                    "mx-auto w-full",
                    formMode === "import" ? "max-w-2xl" : "max-w-3xl",
                  )}
                >
                  {formMode === "import" ? (
                    <div className="space-y-4">
                      {!importResult ? (
                        <>
                          <Upload
                            onChange={handleFileChange}
                            accept=".xlsx,.xls"
                          >
                            {({ onClick }) => (
                              <div
                                onClick={onClick}
                                className={clsx(
                                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                                  importFile
                                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                    : "dark:border-dark-500 dark:hover:border-dark-400 border-gray-300 hover:border-gray-400",
                                )}
                              >
                                <CloudArrowUpIcon className="size-12 text-gray-400" />

                                <p className="dark:text-dark-300 mt-2 text-sm text-gray-600">
                                  {importFile
                                    ? `فایل انتخاب شده: ${importFile.name}`
                                    : "برای انتخاب فایل کلیک کنید یا فایل را اینجا رها کنید"}
                                </p>

                                <p className="dark:text-dark-400 mt-1 text-xs text-gray-400">
                                  فرمت‌های مجاز: .xlsx, .xls
                                </p>
                              </div>
                            )}
                          </Upload>

                          {formModalState === "error" && (
                            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                              <p className="text-sm text-red-800 dark:text-red-200">
                                {formErrorMessage ??
                                  "مشکلی در واردات اطلاعات پیش آمده است. لطفاً دوباره تلاش کنید."}
                              </p>
                            </div>
                          )}

                          <div className="mt-6 flex justify-end gap-2">
                            <Button
                              variant="outlined"
                              onClick={handleCloseFormDrawer}
                              disabled={formLoading}
                            >
                              لغو
                            </Button>

                            <HeadlessButton as={Fragment}>
                              {({ hover, active }) => (
                                <Button
                                  color="primary"
                                  isGlow={hover && !active}
                                  onClick={handleImportSubmit}
                                  disabled={!importFile || formLoading}
                                >
                                  {formLoading
                                    ? "در حال واردات..."
                                    : "شروع واردات"}
                                </Button>
                              )}
                            </HeadlessButton>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                            <p className="text-sm text-green-800 dark:text-green-200">
                              واردات با موفقیت انجام شد!
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="dark:bg-dark-600 rounded-lg bg-gray-50 p-3">
                              <p className="dark:text-dark-400 text-xs text-gray-500">
                                تعداد وارد شده
                              </p>
                              <p className="dark:text-dark-50 text-lg font-medium text-gray-800">
                                {importResult?.imported ?? 0}
                              </p>
                            </div>

                            <div className="dark:bg-dark-600 rounded-lg bg-gray-50 p-3">
                              <p className="dark:text-dark-400 text-xs text-gray-500">
                                تعداد رد شده
                              </p>
                              <p className="dark:text-dark-50 text-lg font-medium text-gray-800">
                                {importResult?.skipped ?? 0}
                              </p>
                            </div>
                          </div>

                          {importResult?.errors &&
                            importResult.errors.length > 0 && (
                              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                                <p className="mb-2 text-sm font-medium text-red-800 dark:text-red-200">
                                  خطاها:
                                </p>

                                <ul className="list-inside list-disc space-y-1 text-sm text-red-700 dark:text-red-300">
                                  {(importResult.errors ?? []).map(
                                    (error, index) => (
                                      <li key={index}>{error}</li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}

                          <div className="mt-4 flex justify-end">
                            <HeadlessButton as={Fragment}>
                              {({ hover, active }) => (
                                <Button
                                  color="success"
                                  isGlow={hover && !active}
                                  onClick={handleCloseFormDrawer}
                                >
                                  بستن
                                </Button>
                              )}
                            </HeadlessButton>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleSubmitForm();
                      }}
                      className="space-y-4"
                    >
                      {formLoading && formMode === "edit" ? (
                        <div className="dark:bg-dark-600 dark:text-dark-200 rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-600">
                          در حال دریافت اطلاعات شرکت...
                        </div>
                      ) : null}

                      <Input
                        label="نام شرکت"
                        value={formData.name}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            name: event.target.value,
                          })
                        }
                        error={formErrors.name}
                        placeholder="مثال: گل نقش"
                        disabled={formLoading || formModalState === "success"}
                      />

                      <Input
                        label="کد شرکت"
                        value={formData.code}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            code: event.target.value,
                          })
                        }
                        error={formErrors.code}
                        placeholder="مثال: 120005"
                        disabled={formLoading || formModalState === "success"}
                      />

                      <Switch
                        label="فعال"
                        checked={!!formData.isActive}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            isActive: event.target.checked,
                          })
                        }
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
                            {formErrorMessage ??
                              "مشکلی پیش آمده است. لطفاً دوباره تلاش کنید."}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outlined"
                          onClick={handleCloseFormDrawer}
                          disabled={formLoading}
                        >
                          {formModalState === "success" ? "بستن" : "لغو"}
                        </Button>

                        {formModalState !== "success" && (
                          <HeadlessButton as={Fragment}>
                            {({ hover, active }) => (
                              <Button
                                type="submit"
                                color="primary"
                                isGlow={hover && !active}
                                disabled={formLoading}
                              >
                                {formLoading
                                  ? "در حال ذخیره..."
                                  : formMode === "create"
                                    ? "ایجاد"
                                    : "ذخیره تغییرات"}
                              </Button>
                            )}
                          </HeadlessButton>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </Page>
  );
}
