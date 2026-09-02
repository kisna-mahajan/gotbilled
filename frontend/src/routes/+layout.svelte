<script>
  import "../app.css";
</script>

<div class="min-h-screen flex flex-col">
  <header class="bg-white border-b border-gray-200">
    <nav class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-brand-600 transition-colors">
        <span class="text-2xl">🧾</span>
        gotbilled.in
      </a>
      <div class="flex items-center gap-6 text-sm font-medium">
        <a href="/absurd" class="text-gray-600 hover:text-brand-600 transition-colors">Absurd Bills</a>
        <a href="/calculator" class="text-gray-600 hover:text-brand-600 transition-colors">Calculator</a>
        <a href="/submit" class="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
          Share Your Bill
        </a>
      </div>
    </nav>
  </header>

  <main class="flex-1">
    <slot />
  </main>

  <footer class="bg-gray-900 text-gray-400 mt-auto">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="text-sm">
          <span class="text-white font-semibold">gotbilled.in</span> — Crowdsourced hospital billing transparency for India
        </div>
        <div class="text-xs">
          100% anonymous. No login. No tracking. Just the truth about medical bills.
        </div>
      </div>
    </div>
  </footer>
</div>
