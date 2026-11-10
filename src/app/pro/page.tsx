import Protected from "@/components/pro/Protected";
import Workspace from "@/components/pro/Workspace";
export default function Page() {
  return (
    <Protected>
      <Workspace section="dashboard" />
    </Protected>
  );
}
