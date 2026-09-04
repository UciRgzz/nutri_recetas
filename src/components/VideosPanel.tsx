import { ExternalLink, PlayCircle, Video } from 'lucide-react';

const VIDEO_URL = 'https://www.youtube.com/watch?v=weff4Zhc8IY';
const EMBED_URL = 'https://www.youtube-nocookie.com/embed/weff4Zhc8IY?rel=0';

export default function VideosPanel() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-[#fffdf8] shadow-[0_20px_60px_-30px_rgba(16,87,62,0.35)]">
        <div className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50 via-white to-amber-50 px-6 py-7 sm:px-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700">Inspiración para tu cocina</p>
              <h1 className="mt-2 flex items-center gap-2 font-serif text-3xl font-semibold tracking-tight text-slate-800">
                <PlayCircle className="text-emerald-600" size={28} strokeWidth={1.8} />
                Preparación de alimentos
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Aprende nuevas ideas de preparación para enriquecer tus recetas y planes alimenticios.
              </p>
            </div>
            <a
              href={VIDEO_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <Video size={16} /> Ver en YouTube <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <div className="bg-slate-950 p-3 sm:p-6">
          <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10">
            <iframe
              className="h-full w-full"
              src={EMBED_URL}
              title="Preparación de alimentos"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </div>
  );
}
