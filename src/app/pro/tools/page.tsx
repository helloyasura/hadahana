import Protected from "@/components/pro/Protected";
import ConsultationDesk from "@/components/pro/ConsultationDesk";
export default function Page() {
  return (
    <Protected>
      <ConsultationDesk />
    </Protected>
  );
}
