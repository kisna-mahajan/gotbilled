<script lang="ts">
  import { onMount } from "svelte";
  import type { StatsData } from "$lib/api";

  export let data: { stats: StatsData | null };

  let animatedReports = data.stats?.total_reports ?? 0;
  let animatedSurprise = Math.round(data.stats?.national_avg_surprise ?? 0);

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

  function cityName(slug: string): string {
    if (!slug) return "";
    return slug.split("_").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" ");
  }

  $: topCategory = data.stats?.top_categories?.[0] ?? null;
  $: topCity = data.stats?.city_leaderboard?.[0] ?? null;

  onMount(() => {
    if (data.stats) {
      animatedReports = 0;
      animatedSurprise = 0;
      animate(data.stats.total_reports, (n) => (animatedReports = n));
      animate(Math.round(data.stats.national_avg_surprise), (n) => (animatedSurprise = n));
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

  {#if data.stats}
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
        {#if topCategory}
          <a href="/explore?category={topCategory.category}" class="block group">
            <div class="stat-value text-pop-red group-hover:underline">{Math.round(topCategory.avg_surprise)}%</div>
            <div class="stat-label">{topCategory.category_name}</div>
            <div class="text-[10px] text-ink-200 uppercase tracking-widest mt-0.5">Most overbilled category</div>
          </a>
        {:else}
          <div class="stat-value text-ink-200">—</div>
          <div class="stat-label">Most overbilled category</div>
        {/if}
      </div>
      <div>
        {#if topCity}
          <a href="/explore?city={topCity.city}" class="block group">
            <div class="stat-value text-pop-red group-hover:underline">{Math.round(topCity.avg_surprise)}%</div>
            <div class="stat-label">{cityName(topCity.city)}</div>
            <div class="text-[10px] text-ink-200 uppercase tracking-widest mt-0.5">Most overbilled city</div>
          </a>
        {:else}
          <div class="stat-value text-ink-200">—</div>
          <div class="stat-label">Most overbilled city</div>
        {/if}
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

<!-- Most Overbilled Categories -->
{#if data.stats?.top_categories && data.stats.top_categories.length > 0}
<div class="border-t border-ink-50"></div>
<section class="max-w-5xl mx-auto px-6 py-20">
  <h2 class="text-sm text-ink-300 uppercase tracking-widest mb-8">Most overbilled categories</h2>

  <div class="space-y-1">
    {#each data.stats.top_categories as cat, i}
      <a href="/explore?category={cat.category}" class="flex items-center gap-6 py-4 px-2 -mx-2 rounded-xl hover:bg-ink-50 transition-colors group">
        <span class="text-ink-200 font-mono text-sm w-6 text-right">{i + 1}</span>
        <span class="flex-1 font-medium group-hover:text-pop-red transition-colors">{cat.category_name}</span>
        <span class="text-ink-300 text-sm">{cat.reports} reports</span>
        <span class="font-mono font-bold text-lg min-w-[4rem] text-right"
          class:text-pop-red={cat.avg_surprise > 20}
          class:text-pop-amber={cat.avg_surprise > 0 && cat.avg_surprise <= 20}
          class:text-pop-green={cat.avg_surprise <= 0}>
          {cat.avg_surprise > 0 ? "+" : ""}{Math.round(cat.avg_surprise)}%
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

