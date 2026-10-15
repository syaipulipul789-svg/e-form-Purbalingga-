import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  note?: string;
  icon: LucideIcon;
  accent?: string;
  valueClassName?: string;
}

export default function StatCard({
  label,
  value,
  note,
  icon: Icon,
  accent = 'bg-[#FFE600]',
  valueClassName,
}: StatCardProps) {
  return (
    <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-[5px_5px_0px_#0F172A] flex flex-col gap-3 hover:translate-y-[-2px] transition-transform">
      <div className="flex items-center justify-between">
        <span className={`w-10 h-10 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0F172A] ${accent}`}>
          <Icon className="w-5 h-5 text-slate-900" />
        </span>
        <span className="text-[9px] font-black bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 uppercase tracking-wider text-slate-500">
          Statistik
        </span>
      </div>
      <div>
        <p className={`font-black text-3xl text-slate-900 leading-none ${valueClassName ?? ''}`}>{value}</p>
        <p className="text-sm font-extrabold text-slate-700 mt-1.5">{label}</p>
        {note && <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{note}</p>}
      </div>
    </div>
  );
}