<script lang="ts">
  import { onMount } from "svelte";
  import {
    getAbsurdFeed,
    getCalculator,
    getExploreOverview,
    upvoteItem,
  } from "$lib/api";
  import { cityToSvg, INDIA_OUTLINE_POINTS } from "$lib/india-geo";
  import type {
    CityOption,
    ProcedureOption,
    StatsData,
    InsightsData,
    AbsurdItem,
    CalculatorData,
    ExploreOverviewData,
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

  type Tab = "overview" | "absurd" | "calculator";
  const tabDefs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "absurd", label: "Wall of Shame" },
    { id: "calculator", label: "Calculator" },
  ];
  let activeTab: Tab = "overview";

  let filterCity = "";
  let filterCategory = "";
  let filterProcedure = "";
  let filterTier = "";

  let overviewData: ExploreOverviewData | null = null;
  let absurdItems: AbsurdItem[] = [];
  let calcResult: CalculatorData | null = null;
  let topAbsurdItems: AbsurdItem[] = [];
  let hoveredCity = "";

  let loadingOverview = false;
  let loadingAbsurd = false;
  let loadingCalc = false;

  $: hasAnyFilter = !!(filterCity || filterCategory || filterProcedure || filterTier);

  let sortCol: string | null = null;
  let sortDir: "asc" | "desc" = "desc";

  const tierLabels: Record<string, string> = {
    corporate_chain: "Corporate Chain",
    private_standalone: "Private",
    government: "Govt",
    trust: "Trust",
  };

  const insuranceLabels: Record<string, string> = {
    yes: "Insured",
    no: "Uninsured",
    partial: "Partial",
    govt_scheme: "Govt Scheme",
  };

  const dimLabels: Record<string, string> = {
    city: "City",
    procedure_type: "Procedure",
    hospital_tier: "Hospital Type",
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

  function surpriseFill(pct: number): string {
    if (pct > 20) return "#ef4444";
    if (pct > 0) return "#f59e0b";
    return "#22c55e";
  }

  function procedureName(slug: string): string {
    return data.procedures.find((p) => p.slug === slug)?.name || cityName(slug);
  }

  function dimValue(row: Record<string, unknown>, dim: string): string {
    const val = row[dim] as string;
    if (dim === "city") return cityName(val);
    if (dim === "procedure_type") return procedureName(val);
    if (dim === "hospital_tier") return tierLabels[val] || val;
    return val;
  }

  function currentFilters() {
    return {
      city: filterCity || undefined,
      procedure: filterProcedure || undefined,
      category: (!filterProcedure && filterCategory) || undefined,
      tier: filterTier || undefined,
    };
  }

  let overviewTimer: ReturnType<typeof setTimeout>;
  let absurdTimer: ReturnType<typeof setTimeout>;
  let calcTimer: ReturnType<typeof setTimeout>;
  const DEBOUNCE_MS = 250;

  let overviewRequestId = 0;
  async function loadOverview() {
    if (!hasAnyFilter) { overviewData = null; loadingOverview = false; return; }
    const reqId = ++overviewRequestId;
    loadingOverview = true;
    sortCol = null;
    try {
      const result = await getExploreOverview(currentFilters());
      if (reqId === overviewRequestId) overviewData = result;
    } catch {
      if (reqId === overviewRequestId) overviewData = null;
    }
    if (reqId === overviewRequestId) loadingOverview = false;
  }

  function debouncedOverview() {
    clearTimeout(overviewTimer);
    overviewTimer = setTimeout(loadOverview, DEBOUNCE_MS);
  }

  async function loadAbsurd() {
    loadingAbsurd = true;
    try {
      const result = await getAbsurdFeed(1, 50, currentFilters());
      absurdItems = result.items;
    } catch { /* ignore */ }
    loadingAbsurd = false;
  }

  function debouncedAbsurd() {
    clearTimeout(absurdTimer);
    absurdTimer = setTimeout(loadAbsurd, DEBOUNCE_MS);
  }

  async function loadCalculator() {
    if (!filterProcedure || !filterCity) { calcResult = null; loadingCalc = false; return; }
    loadingCalc = true;
    try {
      calcResult = await getCalculator(filterProcedure, filterCity);
    } catch { calcResult = null; }
    loadingCalc = false;
  }

  function debouncedCalc() {
    clearTimeout(calcTimer);
    calcTimer = setTimeout(loadCalculator, DEBOUNCE_MS);
  }

  async function handleUpvote(itemId: string) {
    try {
      await upvoteItem(itemId);
      const bump = (item: AbsurdItem) => item.id === itemId ? { ...item, upvotes: item.upvotes + 1 } : item;
      absurdItems = absurdItems.map(bump);
      topAbsurdItems = topAbsurdItems.map(bump);
    } catch { /* ignore */ }
  }

  function toggleSort(col: string) {
    if (sortCol === col) {
      sortDir = sortDir === "desc" ? "asc" : "desc";
    } else {
      sortCol = col;
      sortDir = "desc";
    }
  }

  $: sortedTable = (() => {
    if (!overviewData?.table) return [];
    const rows = [...overviewData.table] as Array<Record<string, unknown>>;
    if (!sortCol) return rows;
    const sc = sortCol;
    return rows.sort((a, b) => {
      const av = a[sc] as number;
      const bv = b[sc] as number;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  })();

  function switchTab(tab: Tab) {
    activeTab = tab;
  }

  $: if (activeTab === "overview") { filterCity; filterCategory; filterProcedure; filterTier; debouncedOverview(); }
  $: if (activeTab === "absurd") { filterCity; filterCategory; filterProcedure; filterTier; debouncedAbsurd(); }
  $: if (activeTab === "calculator") { filterProcedure; filterCity; debouncedCalc(); }

  onMount(async () => {
    if (data.initialCity) filterCity = data.initialCity;
    if (data.initialCategory) filterCategory = data.initialCategory;
    if (data.initialProcedure) filterProcedure = data.initialProcedure;
    try {
      const result = await getAbsurdFeed(1, 10);
      topAbsurdItems = result.items;
    } catch { /* ignore */ }
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
</script>

<svelte:head>
  <title>Explore — gotbilled.in</title>
</svelte:head>

<section class="max-w-5xl mx-auto px-6 pt-12 pb-20">
  <h1 class="text-3xl md:text-4xl font-black tracking-tight mb-2">Explore</h1>
  <p class="text-ink-300 mb-10">Dig into what Indians actually pay for medical procedures.</p>

  <!-- National KPIs -->
  {#if data.stats}
    <div class="mb-10">
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
            <div>
              <div class="text-3xl md:text-4xl font-black font-mono tabular-nums text-pop-red">{Math.round(data.stats.top_categories[0].avg_surprise)}%</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">{data.stats.top_categories[0].category_name}</div>
              <div class="text-[10px] text-ink-200 uppercase tracking-widest mt-0.5">most overbilled procedure category</div>
            </div>
          {:else}
            <div class="text-3xl md:text-4xl font-black font-mono tabular-nums text-ink-200">—</div>
            <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Most overbilled procedure category</div>
          {/if}
        </div>
        <div>
          {#if data.stats.city_leaderboard?.[0]}
            <div>
              <div class="text-3xl md:text-4xl font-black font-mono tabular-nums text-pop-red">{Math.round(data.stats.city_leaderboard[0].avg_surprise)}%</div>
              <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">{cityName(data.stats.city_leaderboard[0].city)}</div>
              <div class="text-[10px] text-ink-200 uppercase tracking-widest mt-0.5">most overbilled city</div>
            </div>
          {:else}
            <div class="text-3xl md:text-4xl font-black font-mono tabular-nums text-ink-200">—</div>
            <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Most overbilled city</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Filters -->
  {#if activeTab === "calculator"}
    <div class="flex flex-wrap gap-3 mb-10">
      <select bind:value={filterCity} class="select-field max-w-[14rem] text-sm">
        <option value="">Select city</option>
        {#each data.cities as c}
          <option value={c.slug}>{c.name}, {c.state}</option>
        {/each}
      </select>
      <select bind:value={filterProcedure} class="select-field max-w-[14rem] text-sm">
        <option value="">Select procedure</option>
        {#each procedureCategories as cat}
          <optgroup label={cat.name}>
            {#each cat.procedures as p}
              <option value={p.slug}>{p.name}</option>
            {/each}
          </optgroup>
        {/each}
        <option value="other">Other</option>
      </select>
      {#if filterCity || filterProcedure}
        <button on:click={() => { filterCity = ""; filterProcedure = ""; calcResult = null; }}
          class="text-xs text-ink-300 hover:text-ink-900 transition-colors px-3 py-2">
          Clear
        </button>
      {/if}
    </div>
  {:else}
    <div class="flex flex-wrap gap-3 mb-10">
      <select bind:value={filterCity} class="select-field max-w-[14rem] text-sm">
        <option value="">All cities</option>
        {#each data.cities as c}
          <option value={c.slug}>{c.name}, {c.state}</option>
        {/each}
      </select>

      <select bind:value={filterCategory} on:change={() => { filterProcedure = ""; }} class="select-field max-w-[14rem] text-sm">
        <option value="">All procedure categories</option>
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

      {#if hasAnyFilter}
        <button on:click={() => { filterCity = ""; filterCategory = ""; filterProcedure = ""; filterTier = ""; overviewData = null; }}
          class="text-xs text-ink-300 hover:text-ink-900 transition-colors px-3 py-2">
          Clear filters
        </button>
      {/if}
    </div>
  {/if}

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

  <!-- OVERVIEW TAB -->
  {#if activeTab === "overview"}
    {#if !hasAnyFilter}
      <!-- No filter: 3-row dashboard overview -->

      <!-- Row 1: City Leaderboard + India Map -->
      {#if data.stats?.city_leaderboard?.length}
        <div class="grid md:grid-cols-[2fr_3fr] gap-8 mb-14">
          <div>
            <h2 class="text-xs text-ink-300 uppercase tracking-widest mb-4 font-semibold">Most overbilled cities</h2>
            <div class="space-y-0.5">
              {#each data.stats.city_leaderboard as city, i}
                <button
                  on:click={() => { filterCity = city.city; }}
                  on:mouseenter={() => (hoveredCity = city.city)}
                  on:mouseleave={() => (hoveredCity = "")}
                  class="w-full text-left flex items-center gap-2.5 py-2 px-2 -mx-2 rounded-lg transition-colors
                    {hoveredCity === city.city ? 'bg-ink-50' : 'hover:bg-ink-50'}">
                  <span class="text-ink-200 font-mono text-[11px] w-4 text-right">{i + 1}</span>
                  <span class="flex-1 text-sm font-medium truncate">{cityName(city.city)}</span>
                  <span class="font-mono font-bold text-sm {surpriseColor(city.avg_surprise)}">{Math.round(city.avg_surprise)}%</span>
                </button>
              {/each}
            </div>
          </div>
          <div class="bg-ink-50/30 rounded-2xl p-4 flex items-center justify-center min-h-[320px]">
            <svg viewBox="0 0 500 600" class="w-full" style="max-height: 420px;">
              <polygon
                points={INDIA_OUTLINE_POINTS}
                fill="white"
                stroke="#d4d4d8"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
              {#each data.stats.city_leaderboard as city}
                {@const pos = cityToSvg(city.city)}
                {#if pos}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <g
                    on:mouseenter={() => (hoveredCity = city.city)}
                    on:mouseleave={() => (hoveredCity = "")}
                    on:click={() => { filterCity = city.city; }}
                    role="button" tabindex="0"
                    class="cursor-pointer">
                    <circle
                      cx={pos.x} cy={pos.y}
                      r={hoveredCity === city.city ? 10 : 7}
                      fill={surpriseFill(city.avg_surprise)}
                      opacity={hoveredCity && hoveredCity !== city.city ? 0.25 : 0.85}
                      class="transition-all duration-150"
                    />
                    {#if hoveredCity === city.city}
                      <text
                        x={pos.x} y={Number(pos.y) - 15}
                        text-anchor="middle"
                        fill="#18181b"
                        stroke="white" stroke-width="3" paint-order="stroke"
                        font-size="12" font-weight="600"
                        class="pointer-events-none select-none">
                        {cityName(city.city)} &middot; {Math.round(city.avg_surprise)}%
                      </text>
                    {/if}
                  </g>
                {/if}
              {/each}
            </svg>
          </div>
        </div>
      {/if}

      <!-- Row 2: Procedures + Absurd Charges -->
      <div class="grid md:grid-cols-2 gap-10 mb-14">
        {#if data.insights?.top_procedures?.length}
          {@const maxProc = Math.max(...data.insights.top_procedures.map(p => Math.abs(p.avg_surprise)), 1)}
          <div>
            <h2 class="text-xs text-ink-300 uppercase tracking-widest mb-4 font-semibold">Most overbilled procedures</h2>
            <div class="space-y-3">
              {#each data.insights.top_procedures.slice(0, 10) as proc}
                <button on:click={() => { filterProcedure = proc.procedure_type; }} class="w-full text-left group">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm truncate pr-2 group-hover:text-pop-red transition-colors" title={proc.display_name}>{proc.display_name}</span>
                    <span class="font-mono font-bold text-sm flex-shrink-0 {surpriseColor(proc.avg_surprise)}">{Math.round(proc.avg_surprise)}%</span>
                  </div>
                  <div class="relative h-[2px] bg-ink-100 rounded-full">
                    <div class="absolute h-[2px] rounded-full {proc.avg_surprise > 20 ? 'bg-pop-red' : proc.avg_surprise > 0 ? 'bg-pop-amber' : 'bg-pop-green'}"
                      style="width: {Math.max(3, (Math.abs(proc.avg_surprise) / maxProc) * 100)}%">
                      <div class="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full
                        {proc.avg_surprise > 20 ? 'bg-pop-red' : proc.avg_surprise > 0 ? 'bg-pop-amber' : 'bg-pop-green'}"></div>
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        {#if topAbsurdItems.length > 0}
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xs text-ink-300 uppercase tracking-widest font-semibold">Top absurd charges</h2>
              <button on:click={() => switchTab('absurd')} class="text-xs text-ink-300 hover:text-ink-900 transition-colors">View all &rarr;</button>
            </div>
            <div class="space-y-0.5">
              {#each topAbsurdItems as item}
                <div class="flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-ink-50 transition-colors">
                  <div class="flex-shrink-0">
                    <button on:click={() => item.id && handleUpvote(item.id)}
                      class="flex flex-col items-center gap-0 text-ink-200 hover:text-pop-red transition-colors"
                      title="This is absurd!">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
                      </svg>
                      <span class="text-[10px] font-mono font-bold leading-tight">{item.upvotes}</span>
                    </button>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm leading-snug">&ldquo;{item.description}&rdquo;</p>
                    <span class="text-[10px] text-ink-200">{cityName(item.city)} &middot; {tierLabels[item.hospital_tier] || item.hospital_tier}</span>
                  </div>
                  <span class="font-mono font-bold text-sm text-pop-red flex-shrink-0">{fmtCurrency(item.amount)}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Row 3: Insurance + Hospital Type lollipop charts -->
      <div class="grid md:grid-cols-2 gap-10 mb-12">
        {#if data.insights?.insurance_breakdown?.length}
          {@const sortedIns = [...data.insights.insurance_breakdown].sort((a, b) => b.avg_surprise - a.avg_surprise)}
          {@const maxIns = Math.max(...sortedIns.map(i => Math.abs(i.avg_surprise)), 1)}
          <div>
            <h2 class="text-xs text-ink-300 uppercase tracking-widest mb-4 font-semibold">Does insurance help?</h2>
            <div class="space-y-4">
              {#each sortedIns as ins}
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-sm font-medium">{insuranceLabels[ins.insurance_used] || ins.insurance_used}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] text-ink-200">{ins.reports} bills</span>
                      <span class="font-mono font-bold text-sm {surpriseColor(ins.avg_surprise)}">{Math.round(ins.avg_surprise)}%</span>
                    </div>
                  </div>
                  <div class="relative h-[2px] bg-ink-100 rounded-full">
                    <div class="absolute h-[2px] rounded-full {ins.avg_surprise > 20 ? 'bg-pop-red' : ins.avg_surprise > 0 ? 'bg-pop-amber' : 'bg-pop-green'}"
                      style="width: {Math.max(3, (Math.abs(ins.avg_surprise) / maxIns) * 100)}%">
                      <div class="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full
                        {ins.avg_surprise > 20 ? 'bg-pop-red' : ins.avg_surprise > 0 ? 'bg-pop-amber' : 'bg-pop-green'}"></div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if data.insights?.tier_breakdown?.length}
          {@const sortedTiers = [...data.insights.tier_breakdown].sort((a, b) => b.avg_surprise - a.avg_surprise)}
          {@const maxTier = Math.max(...sortedTiers.map(t => Math.abs(t.avg_surprise)), 1)}
          <div>
            <h2 class="text-xs text-ink-300 uppercase tracking-widest mb-4 font-semibold">By hospital type</h2>
            <div class="space-y-4">
              {#each sortedTiers as tier}
                <button on:click={() => { filterTier = tier.hospital_tier; }} class="w-full text-left group">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-sm font-medium group-hover:text-pop-red transition-colors">{tierLabels[tier.hospital_tier] || tier.hospital_tier}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] text-ink-200">{tier.reports} bills</span>
                      <span class="font-mono font-bold text-sm {surpriseColor(tier.avg_surprise)}">{Math.round(tier.avg_surprise)}%</span>
                    </div>
                  </div>
                  <div class="relative h-[2px] bg-ink-100 rounded-full">
                    <div class="absolute h-[2px] rounded-full {tier.avg_surprise > 20 ? 'bg-pop-red' : tier.avg_surprise > 0 ? 'bg-pop-amber' : 'bg-pop-green'}"
                      style="width: {Math.max(3, (Math.abs(tier.avg_surprise) / maxTier) * 100)}%">
                      <div class="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full
                        {tier.avg_surprise > 20 ? 'bg-pop-red' : tier.avg_surprise > 0 ? 'bg-pop-amber' : 'bg-pop-green'}"></div>
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

    {:else if loadingOverview && !overviewData}
      <div class="text-center py-16 text-ink-200 text-sm">Loading...</div>

    {:else if overviewData}
      <!-- Filtered: dynamic overview -->
      <div class="transition-opacity duration-150" class:opacity-50={loadingOverview}>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div>
          <div class="text-2xl font-black font-mono tabular-nums">{overviewData.kpis.bills_shared.toLocaleString("en-IN")}</div>
          <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Bills shared</div>
        </div>
        <div>
          <div class="text-2xl font-black font-mono tabular-nums {surpriseColor(overviewData.kpis.avg_surprise)}">{Math.round(overviewData.kpis.avg_surprise)}%</div>
          <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg % overbilling</div>
        </div>
        <div>
          <div class="text-2xl font-black font-mono tabular-nums">{shortCurrency(overviewData.kpis.avg_quoted)}</div>
          <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg quoted</div>
        </div>
        <div>
          <div class="text-2xl font-black font-mono tabular-nums">{shortCurrency(overviewData.kpis.avg_final)}</div>
          <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">Avg final</div>
        </div>
      </div>

      {#if sortedTable.length > 0}
        <div class="mb-10">
          <h3 class="text-sm text-ink-300 uppercase tracking-widest mb-3">
            By {overviewData.dimensions.map(d => dimLabels[d] || d).join(" & ")}
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-ink-300 text-xs uppercase tracking-wider">
                  {#each overviewData.dimensions as dim}
                    <th class="pb-2 pr-4">{dimLabels[dim] || dim}</th>
                  {/each}
                  <th class="pb-2 pr-4 text-right cursor-pointer select-none hover:text-ink-900" on:click={() => toggleSort("bills_shared")}>
                    Bills {sortCol === "bills_shared" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th class="pb-2 pr-4 text-right cursor-pointer select-none hover:text-ink-900" on:click={() => toggleSort("avg_quoted")}>
                    Avg Quoted {sortCol === "avg_quoted" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th class="pb-2 pr-4 text-right cursor-pointer select-none hover:text-ink-900" on:click={() => toggleSort("avg_final")}>
                    Avg Final {sortCol === "avg_final" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th class="pb-2 text-right cursor-pointer select-none hover:text-ink-900" on:click={() => toggleSort("avg_surprise")}>
                    % Overbilling {sortCol === "avg_surprise" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {#each sortedTable as row}
                  <tr class="border-t border-ink-50">
                    {#each overviewData.dimensions as dim}
                      <td class="py-2.5 pr-4 font-medium">{dimValue(row, dim)}</td>
                    {/each}
                    <td class="py-2.5 pr-4 text-right font-mono tabular-nums">{row.bills_shared}</td>
                    <td class="py-2.5 pr-4 text-right font-mono tabular-nums">{shortCurrency(Math.round(Number(row.avg_quoted)))}</td>
                    <td class="py-2.5 pr-4 text-right font-mono tabular-nums">{shortCurrency(Math.round(Number(row.avg_final)))}</td>
                    <td class="py-2.5 text-right font-mono font-bold tabular-nums {surpriseColor(Number(row.avg_surprise))}">
                      {Number(row.avg_surprise) > 0 ? "+" : ""}{Math.round(Number(row.avg_surprise))}%
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {:else if !loadingOverview && overviewData.kpis.bills_shared === 0}
        <p class="text-ink-200 text-sm py-4">Not enough data for this combination yet.</p>
      {/if}

      {#if overviewData.insurance.length > 0}
        <div class="mb-10">
          <h3 class="text-sm text-ink-300 uppercase tracking-widest mb-3">Insurance impact</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {#each overviewData.insurance as ins}
              <div class="bg-ink-50 rounded-xl p-4 text-center">
                <div class="text-2xl font-black font-mono tabular-nums {surpriseColor(ins.avg_surprise)}">{Math.round(ins.avg_surprise)}%</div>
                <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">{insuranceLabels[ins.insurance_used] || ins.insurance_used}</div>
                <div class="text-[10px] text-ink-200 mt-0.5">{ins.bills_shared} bills</div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if overviewData.absurd_charges.length > 0}
        <div class="mb-10">
          <h3 class="text-sm text-ink-300 uppercase tracking-widest mb-3">Top absurd charges</h3>
          <div class="space-y-2">
            {#each overviewData.absurd_charges as item}
              <div class="flex items-center gap-4 py-2 px-2 -mx-2 rounded-lg">
                <span class="font-mono font-bold text-lg text-pop-red">{fmtCurrency(item.amount)}</span>
                <span class="flex-1 text-sm">&ldquo;{item.description}&rdquo;</span>
                <span class="text-xs text-ink-200">{item.upvotes} upvotes</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      </div>
    {/if}

    {#if !data.stats && !hasAnyFilter}
      <div class="text-center py-16">
        <p class="text-xl font-bold mb-2">No data yet.</p>
        <p class="text-ink-300 text-sm mb-6">Be the first to share a bill.</p>
        <a href="/submit" class="btn-primary">Share your bill</a>
      </div>
    {/if}

  <!-- WALL OF SHAME TAB -->
  {:else if activeTab === "absurd"}
    {#if loadingAbsurd && absurdItems.length === 0}
      <div class="text-center py-16 text-ink-200 text-sm">Loading...</div>
    {/if}
    {#if absurdItems.length > 0}
      <div class="space-y-1 transition-opacity duration-150" class:opacity-50={loadingAbsurd}>
        {#each absurdItems as item}
          <div class="flex items-start gap-4 py-4 px-2 -mx-2 rounded-xl hover:bg-ink-50 transition-colors">
            <div class="flex-shrink-0 text-center">
              <button on:click={() => item.id && handleUpvote(item.id)}
                class="flex flex-col items-center gap-0.5 text-ink-200 hover:text-pop-red transition-colors px-1"
                title="This is absurd!">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
                <span class="text-xs font-mono font-bold">{item.upvotes}</span>
              </button>
            </div>
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

    {:else if !loadingAbsurd}
      <div class="text-center py-16">
        <p class="text-ink-300 text-sm">No absurd charges reported yet.</p>
        <a href="/submit" class="inline-block mt-3 text-sm text-ink-500 hover:text-ink-900 transition-colors">Be the first &rarr;</a>
      </div>
    {/if}

  <!-- CALCULATOR TAB -->
  {:else if activeTab === "calculator"}
    <div class="transition-opacity duration-150" class:opacity-50={loadingCalc}>
      {#if !filterProcedure || !filterCity}
        <div class="border border-dashed border-ink-100 rounded-2xl p-8 text-center max-w-lg">
          <p class="text-ink-300 text-sm">Pick a <strong>procedure</strong> and <strong>city</strong> from the filters above to see what others paid.</p>
        </div>
      {:else if calcResult}
        {#if calcResult.available}
          <div class="bg-ink-50 rounded-2xl p-6 max-w-lg mb-8">
            <div class="text-xs text-ink-300 uppercase tracking-widest mb-4">
              {procedureName(filterProcedure)} in {cityName(filterCity)}
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

          <div class="grid grid-cols-3 gap-4 text-center max-w-lg mb-10">
            <div>
              <div class="text-xs text-ink-300 mb-1">Min surprise</div>
              <div class="text-lg font-bold font-mono tabular-nums {surpriseColor(calcResult.min_surprise_pct ?? 0)}">{Math.round(calcResult.min_surprise_pct ?? 0)}%</div>
            </div>
            <div>
              <div class="text-xs text-ink-300 mb-1">Max surprise</div>
              <div class="text-lg font-bold font-mono tabular-nums {surpriseColor(calcResult.max_surprise_pct ?? 0)}">+{Math.round(calcResult.max_surprise_pct ?? 0)}%</div>
            </div>
            <div>
              <div class="text-xs text-ink-300 mb-1">Based on</div>
              <div class="text-lg font-bold font-mono tabular-nums">{calcResult.bills_shared}</div>
              <div class="text-xs text-ink-200">bills</div>
            </div>
          </div>

          {#if calcResult.by_type_insurance?.length}
            <div class="mb-10">
              <h3 class="text-sm text-ink-300 uppercase tracking-widest mb-3">By hospital type &amp; insurance</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-ink-300 text-xs uppercase tracking-wider">
                      <th class="pb-2 pr-4">Hospital Type</th>
                      <th class="pb-2 pr-4">Insurance</th>
                      <th class="pb-2 pr-4 text-right">Bills</th>
                      <th class="pb-2 pr-4 text-right">Avg Quoted</th>
                      <th class="pb-2 pr-4 text-right">Avg Final</th>
                      <th class="pb-2 text-right">% Overbilling</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each calcResult.by_type_insurance as row}
                      <tr class="border-t border-ink-50">
                        <td class="py-2.5 pr-4 font-medium">{tierLabels[row.hospital_tier] || row.hospital_tier}</td>
                        <td class="py-2.5 pr-4 text-ink-300">{insuranceLabels[row.insurance_used] || row.insurance_used}</td>
                        <td class="py-2.5 pr-4 text-right font-mono tabular-nums">{row.bills_shared}</td>
                        <td class="py-2.5 pr-4 text-right font-mono tabular-nums">{shortCurrency(Math.round(row.avg_quoted))}</td>
                        <td class="py-2.5 pr-4 text-right font-mono tabular-nums">{shortCurrency(Math.round(row.avg_final))}</td>
                        <td class="py-2.5 text-right font-mono font-bold tabular-nums {surpriseColor(row.avg_surprise)}">
                          {row.avg_surprise > 0 ? "+" : ""}{Math.round(row.avg_surprise)}%
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {/if}

          {#if calcResult.insurance_analysis?.length}
            <div class="mb-10">
              <h3 class="text-sm text-ink-300 uppercase tracking-widest mb-3">Insurance impact</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                {#each calcResult.insurance_analysis as ins}
                  <div class="bg-ink-50 rounded-xl p-4 text-center">
                    <div class="text-2xl font-black font-mono tabular-nums {surpriseColor(ins.avg_surprise)}">{Math.round(ins.avg_surprise)}%</div>
                    <div class="text-xs text-ink-300 uppercase tracking-widest mt-1">{insuranceLabels[ins.insurance_used] || ins.insurance_used}</div>
                    <div class="text-[10px] text-ink-200 mt-0.5">{ins.bills_shared} bills</div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if calcResult.absurd_charges?.length}
            <div class="mb-10">
              <h3 class="text-sm text-ink-300 uppercase tracking-widest mb-3">Absurd charges reported</h3>
              <div class="space-y-2">
                {#each calcResult.absurd_charges as item}
                  <div class="flex items-center gap-4 py-2 px-2 -mx-2 rounded-lg">
                    <span class="font-mono font-bold text-lg text-pop-red">{fmtCurrency(item.amount)}</span>
                    <span class="flex-1 text-sm">&ldquo;{item.description}&rdquo;</span>
                    <span class="text-xs text-ink-200">{tierLabels[item.hospital_tier] || item.hospital_tier}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {:else}
          <div class="border border-dashed border-ink-100 rounded-2xl p-8 text-center max-w-lg">
            <p class="text-ink-300 text-sm">{calcResult.message}</p>
            <a href="/submit" class="inline-block mt-4 text-sm text-ink-500 hover:text-ink-900 transition-colors">
              Help by sharing your bill &rarr;
            </a>
          </div>
        {/if}
      {:else if !loadingCalc}
        <div class="border border-dashed border-ink-100 rounded-2xl p-8 text-center max-w-lg">
          <p class="text-ink-300 text-sm">No data available for this combination.</p>
        </div>
      {/if}
    </div>
  {/if}
</section>
