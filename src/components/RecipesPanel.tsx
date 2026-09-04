import {
  Apple, ArrowRight, ChefHat, Cherry, Citrus, Leaf, Plus, Sprout, Wheat,
} from 'lucide-react';

interface Props {
  onStart: () => void;
}

export default function RecipesPanel({ onStart }: Props) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <section className="recipe-stage relative isolate overflow-hidden rounded-[2rem] border border-white/80 bg-[#fffdf8] px-6 py-14 shadow-[0_20px_60px_-30px_rgba(16,87,62,0.35)] sm:px-12 sm:py-20">
        <div className="recipe-grid absolute inset-0 -z-10 opacity-60" />
        <div className="absolute -left-24 -top-32 -z-10 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 -z-10 h-96 w-96 rounded-full bg-amber-200/45 blur-3xl" />

        <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden" aria-hidden="true">
          <Apple className="recipe-fruit absolute left-[8%] top-[18%] text-rose-400" size={28} style={{ '--fruit-delay': '0s', '--fruit-x': '-12px' } as React.CSSProperties} />
          <Citrus className="recipe-fruit absolute right-[12%] top-[16%] text-amber-500" size={34} style={{ '--fruit-delay': '1.4s', '--fruit-x': '14px' } as React.CSSProperties} />
          <Wheat className="recipe-fruit absolute bottom-[18%] left-[15%] text-amber-600" size={32} style={{ '--fruit-delay': '2.2s', '--fruit-x': '10px' } as React.CSSProperties} />
          <Cherry className="recipe-fruit absolute bottom-[20%] right-[17%] text-rose-500" size={27} style={{ '--fruit-delay': '0.8s', '--fruit-x': '-10px' } as React.CSSProperties} />
          <Leaf className="recipe-fruit absolute left-[26%] top-[10%] text-emerald-500" size={23} style={{ '--fruit-delay': '2.8s', '--fruit-x': '-8px' } as React.CSSProperties} />
          <Sprout className="recipe-fruit absolute bottom-[12%] right-[30%] text-lime-600" size={25} style={{ '--fruit-delay': '1.9s', '--fruit-x': '8px' } as React.CSSProperties} />
        </div>

        <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="relative mb-6 grid h-20 w-20 place-items-center rounded-[1.75rem] bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
            <div className="absolute inset-2 rounded-2xl border border-white/25" />
            <ChefHat size={38} strokeWidth={1.7} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700">Nueva creación</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-slate-800 sm:text-5xl">Crea una receta con intención</h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
            Diseña un plan a la medida de cada paciente, desde las calorías hasta el último ingrediente.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="group mt-8 flex items-center gap-3 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-700/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15"><Plus size={15} /></span>
            Comenzar receta
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <div className="mt-8 flex items-center gap-3 text-[11px] font-medium text-slate-400">
            <span className="h-px w-8 bg-slate-200" />
            Paciente · energía · equilibrio · sabor
            <span className="h-px w-8 bg-slate-200" />
          </div>
        </div>
      </section>
    </div>
  );
}
