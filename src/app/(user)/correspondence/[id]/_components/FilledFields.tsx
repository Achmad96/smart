import Card from "@/components/ui/Card";

interface FilledFieldsProps {
  fields: any[];
  fieldValues: Record<string, string>;
}

export default function FilledFields({ fields, fieldValues }: FilledFieldsProps) {
  return (
    <Card glass>
      <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Kolom Terisi
      </h3>
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.name} className="py-2 border-b border-slate-200 last:border-0">
            <p className="text-xs text-slate-500 mb-1">{field.label}</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{fieldValues[field.name] || <span className="text-slate-600 italic">Tidak diisi</span>}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
