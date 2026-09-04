<script lang="ts">
  import { onMount } from "svelte";
  import {
    getCityData,
    getCategoryData,
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
    InsightsData,
    CityData,
    CategoryData,
    ProcedureData,
    AbsurdItem,
    FeedReport,
    CalculatorData,
  } from "$lib/api";

  export let data: {
    cities: CityOption[];
    procedures: ProcedureOption[];
    stats: StatsData | null;
    insights: InsightsData | null;
    initialCity: string;
    initialCategory: string;
    initialProcedure: string;
  };

  type Tab = "overview" | "calculator" | "absurd" | "feed";
  const tabDefs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "calculator", label: "Calculator" },
    { id: "absurd", label: "Wall of Shame" },
    { id: "feed", label: "Recent Bills" },
  ];
  let activeTab: Tab = "overview";

  let filterCity = "";
  let filterCategory = "";
  let filterProcedure = "";
  let filterTier = "";

  let cityData: CityData | null = null;
  let categoryData: CategoryData | null = null;
  let procedureData: ProcedureData | null = null;
  let absurdItems: AbsurdItem[] = [];
  let absurdPage = 1;
  let absurdHasMore = false;
  let feedReports: FeedReport[] = [];
  let feedPage = 1;
  let feedHasMore = false;
  let calcResult: CalculatorData | null = null;

  let loadingCity = false;
  let loadingCategory = false;
  let loadingProcedure = false;
  let loadingAbsurd = false;
  let loadingFeed = false;
  let loadingCalc = false;
  $: loading = loadingCity || loadingCategory || loadingProcedure || loadingAbsurd || loadingFeed || loadingCalc;

  let upvotedIds = new Set<string>();

  function currentFilters() {
    return {
      city: filterCity || undefined,
      procedure: filterProcedure || undefined,
      category: (!filterProcedure && filterCategory) || undefined,
      tier: filterTier || undefined,
    };
  }
  let cityRequestId = 0;
  let categoryRequestId = 0;
  let procedureRequestId = 0;

  const tierLabels: Record<string, string> = {
    corporate_chain: "Corporate Chain",
    private_standalone: "Private",
    government: "Govt",
    trust: "Trust",
  };

  function cityName(slug: string): string {
    if (!slug) return "";
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
    const reqId = ++cityRequestId;
    loadingCity = true;
    try {
      const result = await getCityData(filterCity);
      if (reqId === cityRequestId) cityData = result;
    } catch {
      if (reqId === cityRequestId) cityData = null;
    }
    if (reqId === cityRequestId) loadingCity = false;
  }

  async function loadCategoryData() {
    if (!filterCategory || filterProcedure) { categoryData = null; return; }
    const reqId = ++categoryRequestId;
    loadingCategory = true;
    try {
      const result = await getCategoryData(filterCategory);
      if (reqId === categoryRequestId) categoryData = result;
    } catch {
      if (reqId === categoryRequestId) categoryData = null;
    }
    if (reqId === categoryRequestId) loadingCategory = false;
  }

  async function loadProcedureData() {
    if (!filterProcedure) { procedureData = null; return; }
    const reqId = ++procedureRequestId;
    loadingProcedure = true;
    try {
      const result = await getProcedureData(filterProcedure);
      if (reqId === procedureRequestId) procedureData = result;
    } catch {
      if (reqId === procedureRequestId) procedureData = null;
    }
    if (reqId === procedureRequestId) loadingProcedure = false;
  }

  async function loadAbsurd(reset = false) {
    if (reset) { absurdPage = 1; absurdItems = []; }
    loadingAbsurd = true;
    try {
      const result = await getAbsurdFeed(absurdPage, 20, currentFilters());
      absurdItems = reset ? result.items : [...absurdItems, ...result.items];
      absurdHasMore = result.has_more;
    } catch { /* ignore */ }
    loadingAbsurd = false;
  }

  async function loadFeed(reset = false) {
    if (reset) { feedPage = 1; feedReports = []; }
    loadingFeed = true;
    try {
      const result = await getFeed(feedPage, 20, currentFilters());
      feedReports = reset ? result.reports : [...feedReports, ...result.reports];
      feedHasMore = result.has_more;
    } catch { /* ignore */ }
    loadingFeed = false;
  }

  async function loadCalculator() {
    if (!filterProcedure || !filterCity) { calcResult = null; return; }
    loadingCalc = true;
    try {
      calcResult = await getCalculator(filterProcedure, filterCity, filterTier || undefined);
    } catch { calcResult = null; }
    loadingCalc = false;
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
  }

  $: if (filterCity || filterCity === "") loadCityData();
  $: { filterCategory; filterProcedure; loadCategoryData(); }
  $: if (filterProcedure || filterProcedure === "") loadProcedureData();
  $: if (activeTab === "calculator") { filterProcedure; filterCity; filterTier; loadCalculator(); }
  $: if (activeTab === "absurd") { filterCity; filterCategory; filterProcedure; filterTier; loadAbsurd(true); }
  $: if (activeTab === "feed") { filterCity; filterCategory; filterProcedure; filterTier; loadFeed(true); }

  onMount(() => {
    if (data.initialCity) filterCity = data.initialCity;
    if (data.initialCategory) filterCategory = data.initialCategory;
    if (data.initialProcedure) filterProcedure = data.initialProcedure;
  });

  interface CategoryGroup {
    slug: string;
    name: string;
    procedures: ProcedureOption[];
  }

  $: procedureCategories = (() => {
    const map = new Map<string, CategoryGroup>();
    for (const proc of data.procedures) {
      if (proc.slug === "other") continue;
      if (!map.has(proc.category)) {
        map.set(proc.category, { slug: proc.category, name: proc.categoryName, procedures: [] });
      }
      map.get(proc.category)!.procedures.push(proc);
    }
    return [...map.values()];
  })();

  function procedureName(slug: string): string {
    return data.procedures.find((p) => p.slug === slug)?.name || cityName(slug);
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr.replace(" ", "T") + "Z").getTime();
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
        <option value={c.slug}>{c.name}, {c.state}</option>
      {/each}
    </select>

    <select bind:value={filterCategory} on:change={() => { filterProcedure = ""; procedureData = null; }} class="select-field max-w-[14rem] text-sm">
      <option value="">All categories</option>
      {#each procedureCategories as cat}
        <option value={cat.slug}>{cat.name}</option>
      {/each}
    </select>

    <select bind:value={filterProcedure} class="select-field max-w-[14rem] text-sm">
      <option value="">{filterCategory ? "All in category" : "All procedures"}</option>
      {#if filterCategory}
        {#each procedureCategories.find(c => c.slug === filterCategory)?.procedures || [] as p}
          <option value={p.slug}>{p.name}</option>
        {/each}
      {:else}
        {#each procedureCategories as cat}
          <optgroup label={cat.name}>
            {#each cat.procedures as p}
              <option value={p.slug}>{p.name}</option>
            {/each}
          </optgroup>
        {/each}
        <option value="other">Other</option>
      {/if}
    </select>

    <select bind:value={filterTier} class="select-field max-w-[12rem] text-sm">
      <option value="">All hospital types</option>
      <option value="corporate_chain">Corporate Chain</option>
      <option value="private_standalone">Private</option>
      <option value="government">Government</option>
      <option value="trust">Trust / Charity</option>
    </select>

    {#if filterCity || filterCategory || filterProcedure || filterTier}
      <button on:click={() => { filterCity = ""; filterCategory = ""; filterProcedure = ""; filterTier = ""; cityData = null; categoryData = null; procedureData = null; calcResult = null; }}
        class="text-xs text-ink-300 hover:text-ink-900 transition-colors px-3 py-2">
        Clear filters
      </button>
    {/if}
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 border-b border-ink-50 mb-8">
    {#each tabDefs as tab}
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
    <!-- National snapshot — always visible -->
    {#if data.stats}
      <div class="mb-10">
        {#if filterCity || filterCategory || filterProcedure}
          <div class="text-[10px] text-ink-200 uppercase tracking-[0.15em] mb-3">National</div>
        {/if}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div class="text-3xl md:text-4xl font-black font-mono tabular-nums">{data.stats.total_reports.toLocaleString("en-IN")}</div>
            <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Bills shared</div>
          </div>
          <div>
            <div class="text-3xl md:text-4xl font-black font-mono tabular-nums text-pop-red">{Math.round(data.stats.national_avg_surprise)}%</div>
            <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg % overbilling</div>
          </div>
          <div>
            {#if data.stats.top_categories?.[0]}
              <a href="/explore?category={data.stats.top_categories[0].category}" class="block group">
                <div class="text-3xl md:text-4xl font-black font-mono tabular-nums text-pop-red group-hover:underline">{Math.round(data.stats.top_categories[0].avg_surprise)}%</div>
                <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">{data.stats.top_categories[0].category_name}</div>
                <div class="text-[10px] text-ink-200 uppercase tracking-widest mt-0.5">overbilling on avg &middot; most overbilled category</div>
              </a>
            {:else}
              <div class="text-3xl md:text-4xl font-black font-mono tabular-nums text-ink-200">—</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Most overbilled category</div>
            {/if}
          </div>
          <div>
            {#if data.stats.city_leaderboard?.[0]}
              <a href="/explore?city={data.stats.city_leaderboard[0].city}" class="block group">
                <div class="text-3xl md:text-4xl font-black font-mono tabular-nums text-pop-red group-hover:underline">{Math.round(data.stats.city_leaderboard[0].avg_surprise)}%</div>
                <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">{cityName(data.stats.city_leaderboard[0].city)}</div>
                <div class="text-[10px] text-ink-200 uppercase tracking-widest mt-0.5">overbilling on avg &middot; most overbilled city</div>
              </a>
            {:else}
              <div class="text-3xl md:text-4xl font-black font-mono tabular-nums text-ink-200">—</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Most overbilled city</div>
            {/if}
          </div>
        </div>
      </div>

      {#if filterCity || filterCategory || filterProcedure}
        <div class="border-t border-ink-50 mb-10"></div>
      {/if}
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
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg % overbilling</div>
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
                  <th class="pb-2 text-right">% Overbilling</th>
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
                <span class="font-mono font-bold text-lg text-pop-red">{fmtCurrency(item.amount)}</span>
                <span class="flex-1 text-sm">&ldquo;{item.description}&rdquo;</span>
                <span class="text-xs text-ink-200">{item.upvotes} upvotes</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Category deep-dive -->
    {#if filterCategory && !filterProcedure && categoryData}
      <div class="mb-12">
        <h2 class="text-xl font-bold mb-6">{categoryData.display_name}</h2>

        {#if categoryData.overview}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <div class="text-2xl font-black font-mono tabular-nums">{categoryData.overview.total.toLocaleString("en-IN")}</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Reports</div>
            </div>
            <div>
              <div class="text-2xl font-black font-mono tabular-nums {surpriseColor(categoryData.overview.avg_surprise)}">{Math.round(categoryData.overview.avg_surprise)}%</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg % overbilling</div>
            </div>
            <div>
              <div class="text-2xl font-black font-mono tabular-nums">{shortCurrency(Math.round(categoryData.overview.avg_quoted))}</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg quoted</div>
            </div>
            <div>
              <div class="text-2xl font-black font-mono tabular-nums">{shortCurrency(Math.round(categoryData.overview.avg_final))}</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg final</div>
            </div>
          </div>
        {/if}

        {#if categoryData.aggregates.length > 0}
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
                  <th class="pb-2 text-right">% Overbilling</th>
                </tr>
              </thead>
              <tbody>
                {#each categoryData.aggregates as row}
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
          <p class="text-ink-200 text-sm py-4">Not enough data for this category yet.</p>
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
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg % overbilling</div>
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
                  <th class="pb-2 text-right">% Overbilling</th>
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

    <!-- ===== SECTION 1: VIRALITY (no filters active) ===== -->
    {#if !filterCity && !filterCategory && !filterProcedure}

      <!-- Most Absurd Charge card -->
      {#if data.stats?.top_absurd_charge}
        <div class="bg-ink-50 rounded-2xl p-8 mb-10">
          <div class="text-[10px] text-ink-200 uppercase tracking-[0.15em] mb-4">Most absurd charge reported</div>
          <p class="text-xl md:text-2xl font-semibold leading-snug mb-3">
            &ldquo;{data.stats.top_absurd_charge.description}&rdquo;
          </p>
          <div class="text-4xl md:text-5xl font-black font-mono tabular-nums text-pop-red mb-3">
            ₹{data.stats.top_absurd_charge.amount.toLocaleString("en-IN")}
          </div>
          <div class="flex gap-3 text-sm text-ink-300">
            <span>{cityName(data.stats.top_absurd_charge.city)}</span>
            <span>&middot;</span>
            <span>{data.stats.top_absurd_charge.upvotes} found this absurd</span>
          </div>
        </div>
      {/if}

      <!-- City overbilling ranking with bar visualization -->
      {#if data.stats && data.stats.city_leaderboard && data.stats.city_leaderboard.length > 0}
        <div class="mb-12">
          <h2 class="text-sm text-ink-300 uppercase tracking-widest mb-4">Most overbilled cities</h2>
          <div class="space-y-2">
            {#each data.stats.city_leaderboard as city, i}
              <button on:click={() => { filterCity = city.city; }}
                class="w-full text-left">
                <div class="flex items-center gap-3 mb-1">
                  <span class="text-ink-200 font-mono text-xs w-5 text-right">{i + 1}</span>
                  <span class="flex-1 text-sm font-medium">{cityName(city.city)}</span>
                  <span class="font-mono font-bold text-sm {surpriseColor(city.avg_surprise)}">
                    {Math.round(city.avg_surprise)}%
                  </span>
                </div>
                <div class="ml-8">
                  <div class="h-2 bg-ink-50 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500
                      {city.avg_surprise > 20 ? 'bg-pop-red' : city.avg_surprise > 0 ? 'bg-pop-amber' : 'bg-pop-green'}"
                      style="width: {Math.min(100, Math.max(5, Math.abs(city.avg_surprise)))}%">
                    </div>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- ===== SECTION 2: CONSUMER HELPFULNESS ===== -->

      <!-- Top 10 Most Overbilled Procedures -->
      {#if data.insights && data.insights.top_procedures && data.insights.top_procedures.length > 0}
        <div class="mb-12">
          <h2 class="text-sm text-ink-300 uppercase tracking-widest mb-4">Most overbilled procedures</h2>
          <div class="space-y-2">
            {#each data.insights.top_procedures as proc}
              {@const maxSurprise = Math.max(...data.insights.top_procedures.map(p => Math.abs(p.avg_surprise)))}
              <div class="flex items-center gap-3">
                <span class="text-sm w-48 truncate" title={proc.display_name}>{proc.display_name}</span>
                <div class="flex-1 h-5 bg-ink-50 rounded-full overflow-hidden">
                  <div class="h-full rounded-full {proc.avg_surprise > 20 ? 'bg-pop-red' : proc.avg_surprise > 0 ? 'bg-pop-amber' : 'bg-pop-green'}"
                    style="width: {Math.max(5, (Math.abs(proc.avg_surprise) / maxSurprise) * 100)}%">
                  </div>
                </div>
                <span class="font-mono font-bold text-sm min-w-[4rem] text-right {surpriseColor(proc.avg_surprise)}">
                  {Math.round(proc.avg_surprise)}%
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Insurance Impact -->
      {#if data.insights && data.insights.insurance_breakdown && data.insights.insurance_breakdown.length > 0}
        <div class="mb-12">
          <h2 class="text-sm text-ink-300 uppercase tracking-widest mb-4">Does insurance help?</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {#each data.insights.insurance_breakdown as ins}
              <div class="bg-ink-50 rounded-xl p-4 text-center">
                <div class="text-2xl font-black font-mono tabular-nums {surpriseColor(ins.avg_surprise)}">
                  {Math.round(ins.avg_surprise)}%
                </div>
                <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">
                  {ins.insurance_used === 'yes' ? 'Insured' : ins.insurance_used === 'no' ? 'Uninsured' : ins.insurance_used === 'partial' ? 'Partial' : 'Govt Scheme'}
                </div>
                <div class="text-[10px] text-ink-200 mt-0.5">{ins.reports} reports</div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- ===== SECTION 3: JOURNALISM / POLICY ===== -->

      <!-- Hospital Tier Comparison -->
      {#if data.insights && data.insights.tier_breakdown && data.insights.tier_breakdown.length > 0}
        <div class="mb-12">
          <h2 class="text-sm text-ink-300 uppercase tracking-widest mb-4">Overbilling by hospital type</h2>
          <div class="space-y-3">
            {#each data.insights.tier_breakdown.sort((a, b) => b.avg_surprise - a.avg_surprise) as tier}
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium">
                    {tier.hospital_tier === 'corporate_chain' ? 'Corporate Chain' : tier.hospital_tier === 'private_standalone' ? 'Private' : tier.hospital_tier === 'government' ? 'Government' : 'Trust / Charity'}
                  </span>
                  <span class="font-mono font-bold text-sm {surpriseColor(tier.avg_surprise)}">
                    {Math.round(tier.avg_surprise)}% avg overbilling
                  </span>
                </div>
                <div class="h-3 bg-ink-50 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all
                    {tier.avg_surprise > 20 ? 'bg-pop-red' : tier.avg_surprise > 0 ? 'bg-pop-amber' : 'bg-pop-green'}"
                    style="width: {Math.min(100, Math.max(5, Math.abs(tier.avg_surprise)))}%">
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

    {/if}

    {#if !data.stats}
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
                  <span class="text-sm text-ink-500">Avg % overbilling</span>
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
