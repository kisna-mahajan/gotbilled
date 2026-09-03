<script lang="ts">
  import { onMount } from "svelte";
  import type { StatsData } from "$lib/api";

  export let data: { stats: StatsData | null };

  let mounted = false;
  let animatedReports = 0;
  let animatedSurprise = 0;
  let animatedOverbilled = 0;
  let animatedToday = 0;

  function animate(target: number, setter: (n: number) => void, duration = 1200) {
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setter(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function shortCurrency(n: number): string {
    if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)} Cr`;
    if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return `${n}`;
  }

  function cityName(slug: string): string {
    if (!slug) return "";
    return slug.split("_").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" ");
  }

  onMount(() => {
    mounted = true;
    if (data.stats) {
      animate(data.stats.total_reports, (n) => (animatedReports = n));
      animate(Math.round(data.stats.national_avg_surprise), (n) => (animatedSurprise = n));
      animate(data.stats.total_overbilled, (n) => (animatedOverbilled = n));
      animate(data.stats.today_count, (n) => (animatedToday = n), 600);
    }
  });
</script>

<svelte:head>
  <title>gotbilled.in — what Indians actually pay for medical procedures</title>
</svelte:head>

<!-- Hero -->
<section class="max-w-5xl mx-auto px-6 pt-16 md:pt-28 pb-20">
  <h1 class="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight mb-5 max-w-xl">
    What did you actually pay?
  </h1>
  <p class="text-lg text-ink-300 mb-16 max-w-md leading-relaxed">
    Anonymous hospital billing data, crowdsourced across India. Quoted vs. final — no names, just numbers.
  </p>

  {#if data.stats && mounted}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 mb-16">
      <div>
        <div class="stat-value text-ink-900">{animatedReports.toLocaleString("en-IN")}</div>
        <div class="stat-label">Bills shared</div>
      </div>
      <div>
        <div class="stat-value text-pop-red">{animatedSurprise}%</div>
        <div class="stat-label">Avg surprise</div>
      </div>
      <div>
        <div class="stat-value text-ink-900">₹{shortCurrency(animatedOverbilled)}</div>
        <div class="stat-label">Total overbilled</div>
      </div>
      <div>
        <div class="stat-value text-pop-green">{animatedToday}</div>
        <div class="stat-label">Today</div>
      </div>
    </div>
  {:else if !data.stats}
    <div class="border border-ink-100 rounded-2xl p-8 max-w-sm mb-16">
      <p class="text-xl font-bold mb-2">Be the first.</p>
      <p class="text-ink-300 text-sm">No bills shared yet. Your anonymous report helps everyone.</p>
    </div>
  {/if}

  <div class="flex gap-4">
    <a href="/submit" class="btn-primary">Share your bill</a>
    <a href="/explore" class="btn-ghost">Explore data</a>
  </div>
</section>

<!-- Divider -->
<div class="border-t border-ink-50"></div>

<!-- City Leaderboard -->
{#if data.stats?.city_leaderboard && data.stats.city_leaderboard.length > 0}
<section class="max-w-5xl mx-auto px-6 py-20">
  <h2 class="text-sm text-ink-300 uppercase tracking-widest mb-8">Top reporting cities</h2>

  <div class="space-y-1">
    {#each data.stats.city_leaderboard as city, i}
      <a href="/explore?city={city.city}" class="flex items-center gap-6 py-4 px-2 -mx-2 rounded-xl hover:bg-ink-50 transition-colors group">
        <span class="text-ink-200 font-mono text-sm w-6 text-right">{i + 1}</span>
        <span class="flex-1 font-medium group-hover:text-pop-red transition-colors">{cityName(city.city)}</span>
        <span class="text-ink-300 text-sm">{city.reports} reports</span>
        <span class="font-mono font-bold text-lg min-w-[4rem] text-right"
          class:text-pop-red={city.avg_surprise > 20}
          class:text-pop-amber={city.avg_surprise > 0 && city.avg_surprise <= 20}
          class:text-pop-green={city.avg_surprise <= 0}>
          {city.avg_surprise > 0 ? "+" : ""}{Math.round(city.avg_surprise)}%
        </span>
      </a>
    {/each}
  </div>
</section>
{/if}

<!-- Absurd Charge -->
{#if data.stats?.top_absurd_charge}
<div class="border-t border-ink-50"></div>
<section class="max-w-5xl mx-auto px-6 py-20">
  <h2 class="text-sm text-ink-300 uppercase tracking-widest mb-8">Most absurd charge</h2>

  <div class="max-w-lg">
    <p class="text-2xl md:text-3xl font-semibold leading-snug mb-4">
      &ldquo;{data.stats.top_absurd_charge.description}&rdquo;
    </p>
    <div class="stat-value text-pop-red !text-4xl mb-4">
      ₹{data.stats.top_absurd_charge.amount.toLocaleString("en-IN")}
    </div>
    <div class="flex gap-3 text-sm text-ink-300">
      <span>{cityName(data.stats.top_absurd_charge.city)}</span>
      <span>&middot;</span>
      <span>{data.stats.top_absurd_charge.upvotes} found this absurd</span>
    </div>
  </div>
</section>
{/if}

<!-- How it works -->
<div class="border-t border-ink-50"></div>
<section class="max-w-5xl mx-auto px-6 py-20">
  <h2 class="text-sm text-ink-300 uppercase tracking-widest mb-12 text-center">How it works</h2>
  <div class="grid md:grid-cols-3 gap-12 max-w-3xl mx-auto text-center">
    <div>
      <div class="text-3xl mb-4">📝</div>
      <h3 class="font-semibold mb-2">Share</h3>
      <p class="text-sm text-ink-300 leading-relaxed">What were you quoted? What did you pay? 2 minutes, fully anonymous.</p>
    </div>
    <div>
      <div class="text-3xl mb-4">📊</div>
      <h3 class="font-semibold mb-2">Aggregate</h3>
      <p class="text-sm text-ink-300 leading-relaxed">Data grouped by city, procedure, hospital type. No names, just patterns.</p>
    </div>
    <div>
      <div class="text-3xl mb-4">💡</div>
      <h3 class="font-semibold mb-2">Benefit</h3>
      <p class="text-sm text-ink-300 leading-relaxed">Know what others paid. Walk in informed. Question unfair quotes.</p>
    </div>
  </div>

  <div class="text-center mt-12">
    <a href="/submit" class="btn-primary">Share your bill</a>
  </div>
</section>

<!-- Support -->
<div class="border-t border-ink-50"></div>
<section class="max-w-5xl mx-auto px-6 py-16 text-center">
  <p class="text-ink-300 text-sm mb-4">
    Free, anonymous, ad-free. Help keep it that way.
  </p>
  <a href="/donate" class="text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors">
    Help keep this running &rarr;
  </a>
</section>
