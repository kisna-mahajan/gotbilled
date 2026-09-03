<script lang="ts">
  import { submitReport } from "$lib/api";
  import type { CityOption, ProcedureOption } from "$lib/api";

  export let data: { cities: CityOption[]; procedures: ProcedureOption[] };

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

  const hospitalTiers = [
    { value: "corporate_chain", label: "Corporate Chain" },
    { value: "private_standalone", label: "Private Standalone" },
    { value: "government", label: "Government" },
    { value: "trust", label: "Trust / Charity" },
  ];

  const insuranceOptions = [
    { value: "no", label: "No" },
    { value: "yes", label: "Yes, full" },
    { value: "partial", label: "Partial" },
    { value: "govt_scheme", label: "Govt scheme" },
  ];

  let submitting = false;
  let error = "";
  let success = false;
  let resultData: { id: string; surprise_percentage: number } | null = null;

  let procedureType = "";
  let procedureOther = "";
  let city = "";
  let hospitalTier = "";
  let insuranceUsed = "";
  let quotedAmount: number | null = null;
  let finalAmount: number | null = null;
  let stayDays: number | null = null;
  let procedureYear = new Date().getFullYear();
  let surpriseCharges: Array<{ description: string; amount: number | null }> = [];

  let formLoadedAt = Date.now();
  let honeypot = "";

  function addSurpriseCharge() {
    if (surpriseCharges.length < 10) {
      surpriseCharges = [...surpriseCharges, { description: "", amount: null }];
    }
  }

  function removeSurpriseCharge(index: number) {
    surpriseCharges = surpriseCharges.filter((_, i) => i !== index);
  }

  $: isValid =
    !!procedureType &&
    (procedureType !== "other" || !!procedureOther.trim()) &&
    !!city &&
    !!hospitalTier &&
    !!insuranceUsed &&
    quotedAmount !== null && quotedAmount >= 100 && quotedAmount <= 5_000_000 && Number.isInteger(quotedAmount) &&
    finalAmount !== null && finalAmount >= 100 && finalAmount <= 5_000_000 && Number.isInteger(finalAmount) &&
    procedureYear >= 2015 && procedureYear <= new Date().getFullYear();

  $: surprisePct = quotedAmount && finalAmount
    ? Math.round(((finalAmount - quotedAmount) / quotedAmount) * 100)
    : null;

  $: selectedCity = data.cities.find((c) => c.slug === city);

  async function handleSubmit() {
    if (!isValid) return;
    error = "";
    submitting = true;

    const payload: Record<string, unknown> = {
      procedure_type: procedureType,
      city,
      hospital_tier: hospitalTier,
      insurance_used: insuranceUsed,
      quoted_amount: quotedAmount,
      final_amount: finalAmount,
      procedure_year: procedureYear,
      form_loaded_at: formLoadedAt,
      honeypot,
    };

    if (procedureType === "other") payload.procedure_other = procedureOther.trim();
    if (stayDays !== null) payload.stay_days = stayDays;

    const validCharges = surpriseCharges.filter(
      (c) => c.description.trim() && c.amount && c.amount > 0
    );
    if (validCharges.length > 0) {
      payload.surprise_charges = validCharges.map((c) => ({
        description: c.description.trim(),
        amount: c.amount,
      }));
    }

    try {
      const result = await submitReport(payload);
      resultData = result;
      success = true;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      error = e instanceof Error ? e.message : "Something went wrong";
    } finally {
      submitting = false;
    }
  }

  function reset() {
    success = false;
    resultData = null;
    procedureType = "";
    procedureOther = "";
    city = "";
    hospitalTier = "";
    insuranceUsed = "";
    quotedAmount = null;
    finalAmount = null;
    stayDays = null;
    procedureYear = new Date().getFullYear();
    surpriseCharges = [];
    error = "";
    formLoadedAt = Date.now();
    honeypot = "";
  }
</script>

<svelte:head>
  <title>Share Your Bill — gotbilled.in</title>
</svelte:head>

<section class="max-w-xl mx-auto px-6 pt-12 pb-20">
  {#if success && resultData}
    <!-- Success -->
    <div class="text-center py-16">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pop-green/10 mb-6">
        <span class="text-pop-green text-2xl font-bold">&#10003;</span>
      </div>
      <h1 class="text-3xl font-black mb-3">Bill shared.</h1>

      <div class="my-8">
        <div class="text-xs text-ink-300 uppercase tracking-widest mb-2">Your surprise markup</div>
        <div class="text-6xl font-black font-mono tabular-nums"
          class:text-pop-red={resultData.surprise_percentage > 0}
          class:text-pop-green={resultData.surprise_percentage <= 0}>
          {resultData.surprise_percentage > 0 ? "+" : ""}{resultData.surprise_percentage}%
        </div>
      </div>

      <p class="text-ink-300 text-sm mb-10 max-w-sm mx-auto">
        Your anonymous report helps others know what to expect. It'll appear in aggregated stats within a couple of minutes.
      </p>

      <div class="flex gap-4 justify-center">
        <a href="/" class="btn-ghost">Home</a>
        <button on:click={reset} class="btn-primary">Share another</button>
      </div>
    </div>

  {:else}
    <h1 class="text-3xl md:text-4xl font-black tracking-tight mb-2">Share your bill</h1>
    <p class="text-ink-300 mb-10">Anonymous. No login. Takes 2 minutes.</p>

    {#if error}
      <div class="border border-pop-red/20 bg-pop-red/5 text-pop-red rounded-xl px-4 py-3 text-sm mb-8">
        {error}
      </div>
    {/if}

    <form on:submit|preventDefault={handleSubmit} class="space-y-8">
      <input type="text" name="website" bind:value={honeypot} class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <!-- Required Fields -->
      <div class="space-y-5">
        <div>
          <label for="procedure" class="block text-sm font-medium text-ink-500 mb-1.5">Procedure</label>
          <select id="procedure" bind:value={procedureType} class="select-field">
            <option value="">Select procedure type</option>
            {#each procedureCategories as cat}
              <optgroup label={cat.name}>
                {#each cat.procedures as proc}
                  <option value={proc.slug}>{proc.name}</option>
                {/each}
              </optgroup>
            {/each}
            <option value="other">Other</option>
          </select>
        </div>

        {#if procedureType === "other"}
          <div>
            <label for="procedureOther" class="block text-sm font-medium text-ink-500 mb-1.5">Specify procedure</label>
            <input id="procedureOther" type="text" bind:value={procedureOther} maxlength="100"
              placeholder="e.g. Appendix removal" class="input-field" />
          </div>
        {/if}

        <div>
          <label for="city" class="block text-sm font-medium text-ink-500 mb-1.5">City</label>
          <select id="city" bind:value={city} class="select-field">
            <option value="">Select city</option>
            {#each data.cities as c}
              <option value={c.slug}>{c.name}, {c.state}</option>
            {/each}
          </select>
          {#if selectedCity}
            <div class="text-xs text-ink-200 mt-1">State: {selectedCity.state}</div>
          {/if}
        </div>

        <div>
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label class="block text-sm font-medium text-ink-500 mb-1.5">Hospital type</label>
          <div class="grid grid-cols-2 gap-2">
            {#each hospitalTiers as tier}
              <label class="flex items-center gap-2.5 border rounded-xl px-3 py-2.5 cursor-pointer transition-colors text-sm
                {hospitalTier === tier.value ? 'border-ink-900 bg-ink-50' : 'border-ink-100 hover:border-ink-200'}">
                <input type="radio" bind:group={hospitalTier} value={tier.value} class="sr-only" />
                <span class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                  {hospitalTier === tier.value ? 'border-ink-900' : 'border-ink-200'}">
                  {#if hospitalTier === tier.value}
                    <span class="w-1.5 h-1.5 rounded-full bg-ink-900"></span>
                  {/if}
                </span>
                {tier.label}
              </label>
            {/each}
          </div>
        </div>

        <div>
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label class="block text-sm font-medium text-ink-500 mb-1.5">Insurance used?</label>
          <div class="grid grid-cols-2 gap-2">
            {#each insuranceOptions as opt}
              <label class="flex items-center justify-center border rounded-xl py-2.5 cursor-pointer transition-colors text-sm font-medium
                {insuranceUsed === opt.value ? 'border-ink-900 bg-ink-50' : 'border-ink-100 hover:border-ink-200'}">
                <input type="radio" bind:group={insuranceUsed} value={opt.value} class="sr-only" />
                {opt.label}
              </label>
            {/each}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="quoted" class="block text-sm font-medium text-ink-500 mb-1.5">Quoted amount</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 text-sm font-mono">&#8377;</span>
              <input id="quoted" type="number" bind:value={quotedAmount} min="100" max="5000000" step="1"
                placeholder="50,000" class="input-field pl-7 font-mono" />
            </div>
          </div>
          <div>
            <label for="final" class="block text-sm font-medium text-ink-500 mb-1.5">Final bill</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 text-sm font-mono">&#8377;</span>
              <input id="final" type="number" bind:value={finalAmount} min="100" max="5000000" step="1"
                placeholder="75,000" class="input-field pl-7 font-mono" />
            </div>
          </div>
        </div>

        {#if surprisePct !== null}
          <div class="flex items-center justify-between bg-ink-50 rounded-xl px-4 py-3">
            <span class="text-sm text-ink-500">Surprise markup</span>
            <span class="text-2xl font-black font-mono tabular-nums"
              class:text-pop-red={surprisePct > 0}
              class:text-pop-green={surprisePct <= 0}
              class:text-ink-300={surprisePct === 0}>
              {surprisePct > 0 ? "+" : ""}{surprisePct}%
            </span>
          </div>
        {/if}

        <div>
          <label for="year" class="block text-sm font-medium text-ink-500 mb-1.5">Year</label>
          <select id="year" bind:value={procedureYear} class="select-field">
            {#each Array.from({ length: new Date().getFullYear() - 2014 }, (_, i) => new Date().getFullYear() - i) as yr}
              <option value={yr}>{yr}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Optional Section -->
      <div class="border-t border-ink-50 pt-8">
        <p class="text-xs text-ink-200 uppercase tracking-widest mb-5">Optional</p>

        <div class="space-y-5">
          <div>
            <label for="stay" class="block text-sm font-medium text-ink-500 mb-1.5">Hospital stay (days)</label>
            <input id="stay" type="number" bind:value={stayDays} min="0" max="365" placeholder="e.g. 3"
              class="input-field max-w-[8rem]" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="text-sm font-medium text-ink-500">Surprise line items</label>
              {#if surpriseCharges.length < 10}
                <button type="button" on:click={addSurpriseCharge} class="text-xs text-ink-300 hover:text-ink-900 transition-colors">
                  + Add item
                </button>
              {/if}
            </div>

            {#if surpriseCharges.length === 0}
              <button type="button" on:click={addSurpriseCharge}
                class="w-full border border-dashed border-ink-100 rounded-xl py-3 text-sm text-ink-200 hover:text-ink-500 hover:border-ink-200 transition-colors">
                e.g. PPE kit, gloves &amp; syringes, extra nursing charges
              </button>
            {/if}

            {#each surpriseCharges as charge, i}
              {@const placeholders = ["e.g. PPE kit", "e.g. Gloves & syringes", "e.g. Nursing charges"]}
              <div class="flex gap-2 mb-2">
                <input type="text" bind:value={charge.description} maxlength="200" placeholder={placeholders[i] || "What was it?"}
                  class="input-field flex-1 text-sm" />
                <div class="relative w-28">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300 text-xs font-mono">&#8377;</span>
                  <input type="number" bind:value={charge.amount} min="1" placeholder="Amt"
                    class="input-field w-full pl-6 text-sm font-mono" />
                </div>
                <button type="button" on:click={() => removeSurpriseCharge(i)}
                  class="text-ink-200 hover:text-pop-red transition-colors px-1" aria-label="Remove">
                  &times;
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Submit -->
      <button type="submit" disabled={!isValid || submitting}
        class="w-full bg-ink-900 text-white font-semibold py-4 rounded-full text-base
               hover:bg-ink-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        {submitting ? "Submitting..." : "Submit anonymously"}
      </button>

      <p class="text-xs text-ink-200 text-center">
        No personal information collected. IP hashed one-way for rate limiting only.
      </p>
    </form>
  {/if}
</section>
