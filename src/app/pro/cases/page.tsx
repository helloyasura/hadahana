import Protected from "@/components/pro/Protected";
import CaseWorkspace from "@/components/pro/CaseWorkspace";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <Protected>
      <CaseWorkspace initialId={id} />
    </Protected>
  );
}
