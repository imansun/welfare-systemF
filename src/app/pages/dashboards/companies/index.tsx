// src/app/pages/dashboards/companies/index.tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@/components/shared/Page";
import { Button } from "@/components/ui/Button";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import {
  getCompanies,
  deleteCompany,
  CompanyItem,
} from "@/app/services/endpoints/companies";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

export default function Companies() {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<"pending" | "success" | "error">("pending");
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  const handleCloseModal = () => {
    setDeleteModalOpen(false);
    setSelectedCompanyId(null);
    setModalState("pending");
  };

  return (
    <Page title="Companies">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            شرکت‌ها
          </h2>
          <Button color="primary">افزودن شرکت جدید</Button>
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
                        <Button variant="flat" color="primary" className="h-8 px-3 text-sm">
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

      <ConfirmModal
        show={deleteModalOpen}
        onClose={handleCloseModal}
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
    </Page>
  );
}
