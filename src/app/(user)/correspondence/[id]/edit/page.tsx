import { getCorrespondenceById } from "@/actions/correspondence.actions";
import { notFound } from "next/navigation";
import EditCorrespondenceClient from "./EditCorrespondenceClient";

export const dynamic = "force-dynamic";

export default async function EditCorrespondencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const correspondence = await getCorrespondenceById(id);
  
  if (!correspondence) {
    notFound();
  }

  return <EditCorrespondenceClient correspondence={correspondence} />;
}
