// app/(dashboard)/dashboard/new-analysis/page.tsx
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AnalysisWizard } from "@/components/dashboard/AnalysisWizard";

export default async function NewAnalysisPage() {
	const user = await requireAuth();

	const { prebuilt, custom } = await (async () => {
		const [p, c] = await Promise.all([
			db.persona.findMany({
				where: { isPrebuilt: true, isActive: true },
				orderBy: { label: "asc" },
				select: {
					id: true,
					label: true,
					name: true,
					age: true,
					occupation: true,
					technicalLevel: true,
					goals: true,
					frustrations: true,
					tags: true,
				},
			}),
			db.persona.findMany({
				where: { ownerId: user.id, isPrebuilt: false },
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					label: true,
					name: true,
					age: true,
					occupation: true,
					technicalLevel: true,
					goals: true,
					frustrations: true,
					tags: true,
				},
			}),
		]);
		return { prebuilt: p, custom: c };
	})();

	return (
		<div className="space-y-6">
			<PageHeader
				title="New Analysis"
				description="Set up an AI-powered UX analysis for any URL"
			/>
			<AnalysisWizard prebuiltPersonas={prebuilt} customPersonas={custom} />
		</div>
	);
}
