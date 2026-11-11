import Protected from "@/components/pro/Protected";
import ClientArchive from "@/components/pro/ClientArchive";
export default function Page() {
  return (
    <Protected>
      <ClientArchive />
    </Protected>
  );
}
