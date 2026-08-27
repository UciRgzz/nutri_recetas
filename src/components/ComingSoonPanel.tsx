import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function ComingSoonPanel({ icon, title, description }: Props) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-10 flex flex-col items-center text-center gap-3">
        {icon}
        <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
        <p className="text-sm text-gray-400 max-w-sm">{description}</p>
        <span className="mt-1 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Próximamente</span>
      </div>
    </div>
  );
}
