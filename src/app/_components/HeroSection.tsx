import Link from "next/link";

export default function HeroSection() {
  return (
    <div className="relative rounded-2xl border border-slate-200 overflow-hidden p-8 sm:p-10 bg-cover bg-center" style={{ backgroundImage: 'url("/hero-bg.png")' }}>
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] pointer-events-none"></div>

      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary-500/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-200 text-xs font-semibold tracking-wide mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          PEMERINTAH DESA SUMBERMALANG
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Selamat datang di <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-primary-300">SMART</span>
        </h2>
        <h3 className="text-lg sm:text-xl font-medium text-slate-200 mt-2">Sumbermalang Administrasi Terpadu</h3>
        <p className="text-slate-300 mt-4 max-w-2xl text-sm sm:text-base leading-relaxed">Sistem digitalisasi persuratan resmi dan pelayanan publik satu pintu. Mewujudkan tata kelola administrasi Desa Sumbermalang yang cepat, efisien, transparan, dan terintegrasi untuk melayani masyarakat.</p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link href="/templates/new-correspondence" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] active:scale-[0.98]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Surat Baru
          </Link>
          <Link href="/manage-templates" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium border border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Kelola Template
          </Link>
        </div>
      </div>
    </div>
  );
}
