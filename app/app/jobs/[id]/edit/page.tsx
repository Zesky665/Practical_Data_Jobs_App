import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { EditJobForm } from "./edit-form";

type Params = Promise<{ id: string }>;

/**
 * Edit job page — gated: owner only.
 * Server component fetches the job, passes it to the client form.
 */
export default async function EditJobPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    redirect("/auth/login");
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, company, description, status, employer_id")
    .eq("id", id)
    .single();

  if (!job || job.employer_id !== user.id) {
    return notFound();
  }

  return <EditJobForm job={job} />;
}
