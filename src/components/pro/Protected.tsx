import { redirect } from "next/navigation";
import { authenticatedOwner } from "@/lib/pro/http";
import { ProError } from "@/lib/pro/store";
import Shell from "./Shell";
export default async function Protected({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await authenticatedOwner();
  } catch (e) {
    if (e instanceof ProError && e.status === 401)
      // next/navigation redirect() already prefixes basePath; adding it again gives /hadahana/hadahana/...
      redirect("/pro/login");
    return (
      <Shell>
        <section className="pro-card">
          <h1>Pro සේවාව තවම සකසා නැත</h1>
          <p>
            පරිපාලකයාගේ සහාය අවශ්‍යයි. ඔබගේ Hadahana ගිණුම මෙයට බලපාන්නේ නැත.
          </p>
        </section>
      </Shell>
    );
  }
  return children;
}
