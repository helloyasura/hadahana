import Protected from "@/components/pro/Protected";
import ReferenceLibrary from "@/components/pro/ReferenceLibrary";
export default function Page() {
  return (
    <Protected>
      <ReferenceLibrary />
    </Protected>
  );
}
