<script lang="ts">
  import type { StatsData } from "$lib/api";

  export let data: { stats: StatsData | null };

  function formatCurrency(amount: number): string {
    if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)} Cr`;
    if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)} L`;
    if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
    return `₹${amount}`;
  }

  function formatCity(slug: string): string {
    return slug
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function formatTier(tier: string): string {
    const map: Record<string, string> = {
      corporate_chain: "Corporate Chain",
      private_standalone: "Private Hospital",
      government: "Government",
      trust: "Trust/Charity",
    };
    return map[tier] || tier;
  }
</script>

<svelte:head>
  <title>gotbilled.in — What Indians Actually Pay for Medical Procedures</title>
</svelte:head>

<!-- Hero -->
<section class="bg-gradient-to-br from-brand-600 to-brand-800 text-white">
  <div class="max-w-6xl mx-auto px-4 py-16 md:py-24">
    <h1 class="text-4xl md:text-6xl font-bold mb-4">
      What did you<br />
      <span class="text-brand-200">actually</span> pay?
    </h1>
    <p class="text-lg md:text-xl text-brand-100 mb-8 max-w-2xl">
      Anonymous, crowdsourced hospital billing data from across India.
      See the gap between what hospitals quote and what patients actually pay.
    </p>

    {#if data.stats}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white/10 backdrop-blur rounded-xl p-4">
          <div class="text-3xl md:text-4xl font-bold">{data.stats.total_reports.toLocaleString("en-IN")}</div>
          <div class="text-brand-200 text-sm mt-1">Bills Shared</div>
        </div>
        <div class="bg-white/10 backdrop-blur rounded-xl p-4">
          <div class="text-3xl md:text-4xl font-bold">{data.stats.national_avg_surprise}%</div>
          <div class="text-brand-200 text-sm mt-1">Avg Surprise Markup</div>
        </div>
        <div class="bg-white/10 backdrop-blur rounded-xl p-4">
          <div class="text-3xl md:text-4xl font-bold">{formatCurrency(data.stats.total_overbilled)}</div>
          <div class="text-brand-200 text-sm mt-1">Total Overbilled</div>
        </div>
        <div class="bg-white/10 backdrop-blur rounded-xl p-4">
          <div class="text-3xl md:text-4xl font-bold">{data.stats.today_count}</div>
          <div class="text-brand-200 text-sm mt-1">Shared Today</div>
        </div>
      </div>
    {:else}
      <div class="bg-white/10 backdrop-blur rounded-xl p-6 mb-8 max-w-md">
        <div class="text-xl font-semibold mb-2">Be the first to share</div>
        <div class="text-brand-200">No bills shared yet. Your anonymous report helps everyone.</div>
      </div>
    {/if}

    <a href="/submit" class="inline-block bg-white text-brand-700 font-bold px-8 py-4 rounded-xl text-lg hover:bg-brand-50 transition-colors shadow-lg">
      Share Your Bill Anonymously
    </a>
  </div>
</section>

<!-- City Leaderboard -->
{#if data.stats?.city_leaderboard && data.stats.city_leaderboard.length > 0}
<section class="max-w-6xl mx-auto px-4 py-12">
  <h2 class="text-2xl font-bold mb-6">Cities with Most Reports</h2>
  <div class="grid md:grid-cols-2 gap-4">
    {#each data.stats.city_leaderboard as city, i}
      <a href="/city/{city.city}" class="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all">
        <div class="text-2xl font-bold text-gray-300 w-8 text-center">{i + 1}</div>
        <div class="flex-1">
          <div class="font-semibold">{formatCity(city.city)}</div>
          <div class="text-sm text-gray-500">{city.reports} reports</div>
        </div>
        <div class="text-right">
          <div class="text-lg font-bold" class:text-brand-600={city.avg_surprise > 20} class:text-yellow-600={city.avg_surprise > 0 && city.avg_surprise <= 20} class:text-green-600={city.avg_surprise <= 0}>
            {city.avg_surprise > 0 ? "+" : ""}{Math.round(city.avg_surprise)}%
          </div>
          <div class="text-xs text-gray-400">avg surprise</div>
        </div>
      </a>
    {/each}
  </div>
</section>
{/if}

<!-- Top Absurd Charge -->
{#if data.stats?.top_absurd_charge}
<section class="bg-brand-50 border-y border-brand-100">
  <div class="max-w-6xl mx-auto px-4 py-12">
    <h2 class="text-2xl font-bold mb-6">Most Absurd Charge</h2>
    <div class="bg-white rounded-xl p-6 shadow-sm border border-brand-100 max-w-lg">
      <div class="text-lg font-medium mb-2">"{data.stats.top_absurd_charge.description}"</div>
      <div class="text-3xl font-bold text-brand-600 mb-2">
        {formatCurrency(data.stats.top_absurd_charge.amount)}
      </div>
      <div class="text-sm text-gray-500">
        {formatCity(data.stats.top_absurd_charge.city)} &middot; {formatTier(data.stats.top_absurd_charge.hospital_tier)}
      </div>
      <div class="mt-3 text-sm text-gray-400">
        {data.stats.top_absurd_charge.upvotes} people found this absurd
      </div>
    </div>
    <a href="/absurd" class="inline-block mt-4 text-brand-600 hover:text-brand-800 font-medium text-sm">
      See all absurd charges &rarr;
    </a>
  </div>
</section>
{/if}

<!-- How It Works -->
<section class="max-w-6xl mx-auto px-4 py-12">
  <h2 class="text-2xl font-bold mb-8 text-center">How It Works</h2>
  <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
    <div class="text-center">
      <div class="text-4xl mb-3">📝</div>
      <h3 class="font-semibold mb-2">Share Your Bill</h3>
      <p class="text-gray-600 text-sm">Tell us what you were quoted and what you actually paid. Takes 2 minutes. Completely anonymous.</p>
    </div>
    <div class="text-center">
      <div class="text-4xl mb-3">📊</div>
      <h3 class="font-semibold mb-2">We Aggregate</h3>
      <p class="text-gray-600 text-sm">Data is grouped by city, procedure, and hospital type. No hospital names — just patterns.</p>
    </div>
    <div class="text-center">
      <div class="text-4xl mb-3">💡</div>
      <h3 class="font-semibold mb-2">Everyone Benefits</h3>
      <p class="text-gray-600 text-sm">Check what others paid before your next hospital visit. Know if your quote is fair.</p>
    </div>
  </div>
</section>
