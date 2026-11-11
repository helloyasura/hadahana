import Protected from "@/components/pro/Protected";
import Studio from "@/components/pro/Studio";
export default function Page() {
  return (
    <Protected>
      <Studio />
    </Protected>
  );
}
