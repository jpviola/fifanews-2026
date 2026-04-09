export function Footer() {
  return (
    <footer className="mt-10 border-t border-zinc-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Mundial 2026</span>
        <span className="text-zinc-500">
          Horarios en Argentina (America/Argentina/Buenos_Aires)
        </span>
      </div>
    </footer>
  );
}
