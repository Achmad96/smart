import { Suspense } from "react";
import NewCorrespondenceForm from "./_components/NewCorrespondenceForm";

export default function NewCorrespondencePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        </div>
      }>
      <NewCorrespondenceForm />
    </Suspense>
  );
}
