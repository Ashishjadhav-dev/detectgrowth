import { CompanyDetail } from "@/features/companies/company-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CompanyDetail id={id} />;
}
