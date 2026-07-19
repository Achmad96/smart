import { getCorrespondences } from "@/actions/correspondence.actions";
import { getTemplates } from "@/actions/template.actions";
import { getRecentActivities } from "@/actions/activity.actions";
import HeroSection from "./_components/HeroSection";
import StatsSection from "./_components/StatsSection";
import TemplatesSection from "./_components/TemplatesSection";
import RecentActivitySection from "./_components/RecentActivitySection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const correspondences = await getCorrespondences();
  const templates = await getTemplates();

  const statValues: Record<string, number> = {
    correspondences: correspondences.total,
    templates: templates.total
  };
  const recentActivity = await getRecentActivities(5);

  return (
    <div className="space-y-8 animate-fade-up">
      <HeroSection />
      <StatsSection statValues={statValues} />
      <TemplatesSection templates={templates.data as any} />
      <RecentActivitySection recentActivity={recentActivity as any} />
    </div>
  );
}
