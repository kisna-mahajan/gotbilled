<script>
  import "../app.css";
</script>

<div class="min-h-screen flex flex-col">
  <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl">
    <nav class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="/" class="text-base font-bold text-ink-900 hover:text-pop-red transition-colors tracking-tight">
        gotbilled<span class="text-pop-red">.</span>in
      </a>
      <div class="flex items-center gap-6 text-sm">
        <a href="/explore" class="text-ink-300 hover:text-ink-900 transition-colors">Explore</a>
        <a href="/donate" class="text-ink-300 hover:text-ink-900 transition-colors">Support</a>
        <a href="/submit" class="bg-ink-900 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-ink-700 transition-colors">
          Share a bill
        </a>
      </div>
    </nav>
  </header>

  <main class="flex-1">
    <slot />
  </main>

  <footer class="border-t border-ink-50 mt-auto">
    <div class="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-ink-200">
      <span>gotbilled.in</span>
      <span>anonymous &middot; no login &middot; no tracking &middot; <a href="/donate" class="hover:text-ink-500 transition-colors">support us</a></span>
    </div>
  </footer>
</div>
