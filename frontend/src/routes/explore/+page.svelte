<script lang="ts">
  import {
    getCityData,
    getProcedureData,
    getAbsurdFeed,
    getCalculator,
    getFeed,
    upvoteItem,
  } from "$lib/api";
  import type {
    CityOption,
    ProcedureOption,
    StatsData,
    CityData,
    ProcedureData,
    AbsurdItem,
    FeedReport,
    CalculatorData,
  } from "$lib/api";

  export let data: {
    cities: CityOption[];
    procedures: ProcedureOption[];
    stats: StatsData | null;
  };

  type Tab = "overview" | "calculator" | "absurd" | "feed";
  let activeTab: Tab = "overview";

  let filterCity = "";
  let filterProcedure = "";
  let filterTier = "";

  let cityData: CityData | null = null;
  let procedureData: ProcedureData | null = null;
  let absurdItems: AbsurdItem[] = [];
  let absurdPage = 1;
  let absurdHasMore = false;
  let feedReports: FeedReport[] = [];
  let feedPage = 1;
  let feedHasMore = false;
  let calcResult: CalculatorData | null = null;

  let loading = false;
  let upvotedIds = new Set<string>();

  const tierLabels: Record<string, string> = {
    corporate_chain: "Corporate Chain",
    private_standalone: "Private",
    government: "Govt",
    trust: "Trust",
  };

  function cityName(slug: string): string {
    return slug.split("_").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" ");
  }

  function fmtCurrency(n: number): string {
    return "₹" + n.toLocaleString("en-IN");
  }

  function shortCurrency(n: number): string {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
    return `₹${n}`;
  }

  function surpriseColor(pct: number): string {
    if (pct > 20) return "text-pop-red";
    if (pct > 0) return "text-pop-amber";
    return "text-pop-green";
  }

  async function loadCityData() {
    if (!filterCity) { cityData = null; return; }
    loading = true;
    try {
      cityData = await getCityData(filterCity);
    } catch { cityData = null; }
    loading = false;
  }

  async function loadProcedureData() {
    if (!filterProcedure) { procedureData = null; return; }
    loading = true;
    try {
      procedureData = await getProcedureData(filterProcedure);
    } catch { procedureData = null; }
    loading = false;
  }

  async function loadAbsurd(reset = false) {
    if (reset) { absurdPage = 1; absurdItems = []; }
    loading = true;
    try {
      const result = await getAbsurdFeed(absurdPage, 20);
      absurdItems = reset ? result.items : [...absurdItems, ...result.items];
      absurdHasMore = result.has_more;
    } catch { /* ignore */ }
    loading = false;
  }

  async function loadFeed(reset = false) {
    if (reset) { feedPage = 1; feedReports = []; }
    loading = true;
    try {
      const result = await getFeed(feedPage, 20);
      feedReports = reset ? result.reports : [...feedReports, ...result.reports];
      feedHasMore = result.has_more;
    } catch { /* ignore */ }
    loading = false;
  }

  async function loadCalculator() {
    if (!filterProcedure || !filterCity) { calcResult = null; return; }
    loading = true;
    try {
      calcResult = await getCalculator(filterProcedure, filterCity, filterTier || undefined);
    } catch { calcResult = null; }
    loading = false;
  }

  async function handleUpvote(id: string) {
    if (upvotedIds.has(id)) return;
    try {
      await upvoteItem(id);
      upvotedIds.add(id);
      upvotedIds = upvotedIds;
      absurdItems = absurdItems.map((item) =>
        item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item
      );
    } catch { /* ignore */ }
  }

  function switchTab(tab: Tab) {
    activeTab = tab;
    if (tab === "absurd" && absurdItems.length === 0) loadAbsurd(true);
    if (tab === "feed" && feedReports.length === 0) loadFeed(true);
    if (tab === "calculator") loadCalculator();
  }

  $: if (filterCity) loadCityData();
  $: if (filterProcedure) loadProcedureData();

  function procedureName(slug: string): string {
    return data.procedures.find((p) => p.slug === slug)?.name || cityName(slug);
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }
</script>

<svelte:head>
  <title>Explore — gotbilled.in</title>
</svelte:head>

<section class="max-w-5xl mx-auto px-6 pt-12 pb-20">
  <h1 class="text-3xl md:text-4xl font-black tracking-tight mb-2">Explore</h1>
  <p class="text-ink-300 mb-10">Dig into what Indians actually pay for medical procedures.</p>

  <!-- Filters -->
  <div class="flex flex-wrap gap-3 mb-10">
    <select bind:value={filterCity} class="select-field max-w-[14rem] text-sm">
      <option value="">All cities</option>
      {#each data.cities as c}
        <option value={c.slug}>{c.name}</option>
      {/each}
    </select>

    <select bind:value={filterProcedure} class="select-field max-w-[14rem] text-sm">
      <option value="">All procedures</option>
      {#each data.procedures as p}
        <option value={p.slug}>{p.name}</option>
      {/each}
    </select>

    <select bind:value={filterTier} class="select-field max-w-[12rem] text-sm">
      <option value="">All tiers</option>
      <option value="corporate_chain">Corporate Chain</option>
      <option value="private_standalone">Private</option>
      <option value="government">Government</option>
      <option value="trust">Trust / Charity</option>
    </select>

    {#if filterCity || filterProcedure || filterTier}
      <button on:click={() => { filterCity = ""; filterProcedure = ""; filterTier = ""; cityData = null; procedureData = null; calcResult = null; }}
        class="text-xs text-ink-300 hover:text-ink-900 transition-colors px-3 py-2">
        Clear filters
      </button>
    {/if}
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 border-b border-ink-50 mb-8 overflow-x-auto">
    {#each [
      { id: "overview", label: "Overview" },
      { id: "calculator", label: "Calculator" },
      { id: "absurd", label: "Absurd Charges" },
      { id: "feed", label: "Recent Bills" },
    ] as tab}
      <button on:click={() => switchTab(tab.id)}
        class="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
          {activeTab === tab.id ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-300 hover:text-ink-500'}">
        {tab.label}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="text-center py-12 text-ink-200 text-sm">Loading...</div>
  {/if}

  <!-- OVERVIEW TAB -->
  {#if activeTab === "overview"}
    <!-- National stats -->
    {#if data.stats && !filterCity && !filterProcedure}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div>
          <div class="text-3xl md:text-4xl font-black font-mono tabular-nums">{data.stats.total_reports.toLocaleString("en-IN")}</div>
          <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Bills shared</div>
        </div>
        <div>
          <div class="text-3xl md:text-4xl font-black font-mono tabular-nums text-pop-red">{Math.round(data.stats.national_avg_surprise)}%</div>
          <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg surprise</div>
        </div>
        <div>
          <div class="text-3xl md:text-4xl font-black font-mono tabular-nums">{shortCurrency(data.stats.total_overbilled)}</div>
          <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Total overbilled</div>
        </div>
        <div>
          <div class="text-3xl md:text-4xl font-black font-mono tabular-nums text-pop-green">{data.stats.today_count}</div>
          <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Today</div>
        </div>
      </div>
    {/if}

    <!-- City deep-dive -->
    {#if filterCity && cityData}
      <div class="mb-12">
        <h2 class="text-xl font-bold mb-1">{cityName(filterCity)}</h2>
        <p class="text-sm text-ink-300 mb-6">{cityData.state}</p>

        {#if cityData.overview}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <div class="text-2xl font-black font-mono tabular-nums">{cityData.overview.total.toLocaleString("en-IN")}</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Reports</div>
            </div>
            <div>
              <div class="text-2xl font-black font-mono tabular-nums {surpriseColor(cityData.overview.avg_surprise)}">{Math.round(cityData.overview.avg_surprise)}%</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg surprise</div>
            </div>
            <div>
              <div class="text-2xl font-black font-mono tabular-nums">{shortCurrency(Math.round(cityData.overview.avg_quoted))}</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg quoted</div>
            </div>
            <div>
              <div class="text-2xl font-black font-mono tabular-nums">{shortCurrency(Math.round(cityData.overview.avg_final))}</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg final</div>
            </div>
          </div>
        {/if}

        <!-- Aggregates table -->
        {#if cityData.aggregates.length > 0}
          <h3 class="text-sm text-ink-300 uppercase tracking-widest mb-3">By procedure &amp; tier</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-ink-300 text-xs uppercase tracking-wider">
                  <th class="pb-2 pr-4">Procedure</th>
                  <th class="pb-2 pr-4">Tier</th>
                  <th class="pb-2 pr-4 text-right">Reports</th>
                  <th class="pb-2 pr-4 text-right">Avg Quoted</th>
                  <th class="pb-2 pr-4 text-right">Avg Final</th>
                  <th class="pb-2 text-right">Surprise</th>
                </tr>
              </thead>
              <tbody>
                {#each cityData.aggregates as row}
                  <tr class="border-t border-ink-50">
                    <td class="py-2.5 pr-4 font-medium">{procedureName(row.procedure_type)}</td>
                    <td class="py-2.5 pr-4 text-ink-300">{tierLabels[row.hospital_tier] || row.hospital_tier}</td>
                    <td class="py-2.5 pr-4 text-right font-mono tabular-nums">{row.report_count}</td>
                    <td class="py-2.5 pr-4 text-right font-mono tabular-nums">{shortCurrency(Math.round(row.avg_quoted))}</td>
                    <td class="py-2.5 pr-4 text-right font-mono tabular-nums">{shortCurrency(Math.round(row.avg_final))}</td>
                    <td class="py-2.5 text-right font-mono font-bold tabular-nums {surpriseColor(row.avg_surprise_pct)}">
                      {row.avg_surprise_pct > 0 ? "+" : ""}{Math.round(row.avg_surprise_pct)}%
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="text-ink-200 text-sm py-4">Not enough data for this city yet.</p>
        {/if}

        <!-- Top surprise items for city -->
        {#if cityData.top_surprise_items.length > 0}
          <h3 class="text-sm text-ink-300 uppercase tracking-widest mt-10 mb-3">Top absurd charges in {cityName(filterCity)}</h3>
          <div class="space-y-2">
            {#each cityData.top_surprise_items as item}
              <div class="flex items-center gap-4 py-2 px-2 -mx-2 rounded-lg">
                <span class="font-mono font-bold text-lg {surpriseColor(100)}">{fmtCurrency(item.amount)}</span>
                <span class="flex-1 text-sm">&ldquo;{item.description}&rdquo;</span>
                <span class="text-xs text-ink-200">{item.upvotes} upvotes</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Procedure deep-dive -->
    {#if filterProcedure && procedureData}
      <div class="mb-12">
        <h2 class="text-xl font-bold mb-6">{procedureData.display_name}</h2>

        {#if procedureData.overview}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <div class="text-2xl font-black font-mono tabular-nums">{procedureData.overview.total.toLocaleString("en-IN")}</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Reports</div>
            </div>
            <div>
              <div class="text-2xl font-black font-mono tabular-nums {surpriseColor(procedureData.overview.avg_surprise)}">{Math.round(procedureData.overview.avg_surprise)}%</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg surprise</div>
            </div>
            <div>
              <div class="text-2xl font-black font-mono tabular-nums">{shortCurrency(Math.round(procedureData.overview.avg_quoted))}</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg quoted</div>
            </div>
            <div>
              <div class="text-2xl font-black font-mono tabular-nums">{shortCurrency(Math.round(procedureData.overview.avg_final))}</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg final</div>
            </div>
          </div>
        {/if}

        {#if procedureData.aggregates.length > 0}
          <h3 class="text-sm text-ink-300 uppercase tracking-widest mb-3">By city &amp; tier</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-ink-300 text-xs uppercase tracking-wider">
                  <th class="pb-2 pr-4">City</th>
                  <th class="pb-2 pr-4">Tier</th>
                  <th class="pb-2 pr-4 text-right">Reports</th>
                  <th class="pb-2 pr-4 text-right">Avg Quoted</th>
                  <th class="pb-2 pr-4 text-right">Avg Final</th>
                  <th class="pb-2 text-right">Surprise</th>
                </tr>
              </thead>
              <tbody>
                {#each procedureData.aggregates as row}
                  <tr class="border-t border-ink-50">
                    <td class="py-2.5 pr-4 font-medium">{cityName(row.city)}</td>
                    <td class="py-2.5 pr-4 text-ink-300">{tierLabels[row.hospital_tier] || row.hospital_tier}</td>
                    <td class="py-2.5 pr-4 text-right font-mono tabular-nums">{row.report_count}</td>
                    <td class="py-2.5 pr-4 text-right font-mono tabular-nums">{shortCurrency(Math.round(row.avg_quoted))}</td>
                    <td class="py-2.5 pr-4 text-right font-mono tabular-nums">{shortCurrency(Math.round(row.avg_final))}</td>
                    <td class="py-2.5 text-right font-mono font-bold tabular-nums {surpriseColor(row.avg_surprise_pct)}">
                      {row.avg_surprise_pct > 0 ? "+" : ""}{Math.round(row.avg_surprise_pct)}%
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="text-ink-200 text-sm py-4">Not enough data for this procedure yet.</p>
        {/if}
      </div>
    {/if}

    <!-- City leaderboard (when no filter) -->
    {#if !filterCity && !filterProcedure && data.stats?.city_leaderboard && data.stats.city_leaderboard.length > 0}
      <div class="mb-12">
        <h2 class="text-sm text-ink-300 uppercase tracking-widest mb-4">City leaderboard</h2>
        <div class="space-y-0.5">
          {#each data.stats.city_leaderboard as city, i}
            <button on:click={() => { filterCity = city.city; }}
              class="w-full flex items-center gap-4 py-3 px-2 -mx-2 rounded-xl hover:bg-ink-50 transition-colors text-left">
              <span class="text-ink-200 font-mono text-sm w-5 text-right">{i + 1}</span>
              <span class="flex-1 font-medium">{cityName(city.city)}</span>
              <span class="text-ink-300 text-sm">{city.reports}</span>
              <span class="font-mono font-bold text-base min-w-[3.5rem] text-right {surpriseColor(city.avg_surprise)}">
                {city.avg_surprise > 0 ? "+" : ""}{Math.round(city.avg_surprise)}%
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    {#if !data.stats && !filterCity && !filterProcedure}
      <div class="text-center py-16">
        <p class="text-xl font-bold mb-2">No data yet.</p>
        <p class="text-ink-300 text-sm mb-6">Be the first to share a bill.</p>
        <a href="/submit" class="btn-primary">Share your bill</a>
      </div>
    {/if}

  <!-- CALCULATOR TAB -->
  {:else if activeTab === "calculator"}
    <div class="max-w-lg">
      <p class="text-ink-300 text-sm mb-6">
        Select a procedure and city above to see what others paid.
      </p>

      {#if !filterProcedure || !filterCity}
        <div class="border border-dashed border-ink-100 rounded-2xl p-8 text-center">
          <p class="text-ink-300 text-sm">Pick a <strong>procedure</strong> and <strong>city</strong> from the filters above.</p>
        </div>
      {:else if calcResult}
        {#if calcResult.available}
          <div class="space-y-6">
            <div class="bg-ink-50 rounded-2xl p-6">
              <div class="text-xs text-ink-300 uppercase tracking-widest mb-4">
                {procedureName(filterProcedure)} in {cityName(filterCity)}
                {#if filterTier}
                  <span class="text-ink-200">&middot; {tierLabels[filterTier]}</span>
                {/if}
              </div>

              <div class="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div class="text-xs text-ink-300 mb-1">Avg quoted</div>
                  <div class="text-2xl font-black font-mono tabular-nums">{fmtCurrency(calcResult.avg_quoted ?? 0)}</div>
                </div>
                <div>
                  <div class="text-xs text-ink-300 mb-1">Avg final bill</div>
                  <div class="text-2xl font-black font-mono tabular-nums">{fmtCurrency(calcResult.avg_final ?? 0)}</div>
                </div>
              </div>

              <div class="border-t border-ink-100 pt-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-ink-500">Avg surprise</span>
                  <span class="text-3xl font-black font-mono tabular-nums {surpriseColor(calcResult.avg_surprise_pct ?? 0)}">
                    {(calcResult.avg_surprise_pct ?? 0) > 0 ? "+" : ""}{Math.round(calcResult.avg_surprise_pct ?? 0)}%
                  </span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-xs text-ink-300 mb-1">Min surprise</div>
                <div class="text-lg font-bold font-mono tabular-nums {surpriseColor(calcResult.min_surprise_pct ?? 0)}">
                  {Math.round(calcResult.min_surprise_pct ?? 0)}%
                </div>
              </div>
              <div>
                <div class="text-xs text-ink-300 mb-1">Max surprise</div>
                <div class="text-lg font-bold font-mono tabular-nums {surpriseColor(calcResult.max_surprise_pct ?? 0)}">
                  +{Math.round(calcResult.max_surprise_pct ?? 0)}%
                </div>
              </div>
              <div>
                <div class="text-xs text-ink-300 mb-1">Based on</div>
                <div class="text-lg font-bold font-mono tabular-nums">{calcResult.report_count}</div>
                <div class="text-xs text-ink-200">reports</div>
              </div>
            </div>
          </div>
        {:else}
          <div class="border border-dashed border-ink-100 rounded-2xl p-8 text-center">
            <p class="text-ink-300 text-sm">{calcResult.message}</p>
            <a href="/submit" class="inline-block mt-4 text-sm text-ink-500 hover:text-ink-900 transition-colors">
              Help by sharing your bill &rarr;
            </a>
          </div>
        {/if}
      {:else if !loading}
        <div class="border border-dashed border-ink-100 rounded-2xl p-8 text-center">
          <p class="text-ink-300 text-sm">No data available for this combination.</p>
        </div>
      {/if}
    </div>

  <!-- ABSURD CHARGES TAB -->
  {:else if activeTab === "absurd"}
    {#if absurdItems.length > 0}
      <div class="space-y-1">
        {#each absurdItems as item}
          <div class="flex items-start gap-4 py-4 px-2 -mx-2 rounded-xl hover:bg-ink-50 transition-colors">
            <button on:click={() => item.id && handleUpvote(item.id)}
              class="flex-shrink-0 flex flex-col items-center gap-0.5 min-w-[3rem] pt-0.5 transition-colors
                {item.id && upvotedIds.has(item.id) ? 'text-pop-red' : 'text-ink-200 hover:text-ink-500'}"
              disabled={!item.id || upvotedIds.has(item.id || "")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
              <span class="text-xs font-mono font-bold tabular-nums">{item.upvotes}</span>
            </button>
            <div class="flex-1 min-w-0">
              <p class="text-sm mb-1">&ldquo;{item.description}&rdquo;</p>
              <div class="flex gap-2 text-xs text-ink-200">
                <span>{cityName(item.city)}</span>
                <span>&middot;</span>
                <span>{tierLabels[item.hospital_tier] || item.hospital_tier}</span>
                <span>&middot;</span>
                <span>{procedureName(item.procedure_type)}</span>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="font-mono font-bold text-pop-red">{fmtCurrency(item.amount)}</div>
            </div>
          </div>
        {/each}
      </div>

      {#if absurdHasMore}
        <div class="text-center mt-6">
          <button on:click={() => { absurdPage++; loadAbsurd(); }}
            class="text-sm text-ink-300 hover:text-ink-900 transition-colors px-4 py-2">
            Load more
          </button>
        </div>
      {/if}
    {:else if !loading}
      <div class="text-center py-16">
        <p class="text-ink-300 text-sm">No absurd charges reported yet.</p>
        <a href="/submit" class="inline-block mt-3 text-sm text-ink-500 hover:text-ink-900 transition-colors">Be the first &rarr;</a>
      </div>
    {/if}

  <!-- RECENT FEED TAB -->
  {:else if activeTab === "feed"}
    {#if feedReports.length > 0}
      <div class="space-y-0.5">
        {#each feedReports as report}
          <div class="flex items-center gap-4 py-3 px-2 -mx-2 rounded-xl hover:bg-ink-50 transition-colors">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-sm font-medium">{procedureName(report.procedure_type)}</span>
                <span class="text-xs text-ink-200">{cityName(report.city)}</span>
              </div>
              <div class="flex gap-2 text-xs text-ink-200">
                <span>{tierLabels[report.hospital_tier] || report.hospital_tier}</span>
                <span>&middot;</span>
                <span>{report.procedure_year}</span>
                {#if report.created_at}
                  <span>&middot;</span>
                  <span>{timeAgo(report.created_at)}</span>
                {/if}
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-xs text-ink-200 mb-0.5">
                {shortCurrency(report.quoted_amount)} &rarr; {shortCurrency(report.final_amount)}
              </div>
              <div class="font-mono font-bold tabular-nums {surpriseColor(report.surprise_percentage)}">
                {report.surprise_percentage > 0 ? "+" : ""}{Math.round(report.surprise_percentage)}%
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if feedHasMore}
        <div class="text-center mt-6">
          <button on:click={() => { feedPage++; loadFeed(); }}
            class="text-sm text-ink-300 hover:text-ink-900 transition-colors px-4 py-2">
            Load more
          </button>
        </div>
      {/if}
    {:else if !loading}
      <div class="text-center py-16">
        <p class="text-ink-300 text-sm">No bills shared yet.</p>
        <a href="/submit" class="inline-block mt-3 text-sm text-ink-500 hover:text-ink-900 transition-colors">Be the first &rarr;</a>
      </div>
    {/if}
  {/if}
</section>
