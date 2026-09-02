<script lang="ts">
  import { submitReport } from "$lib/api";
  import type { CityOption, ProcedureOption } from "$lib/api";

  export let data: { cities: CityOption[]; procedures: ProcedureOption[] };

  const hospitalTiers = [
    { value: "corporate_chain", label: "Corporate Chain (Apollo, Fortis, Max...)" },
    { value: "private_standalone", label: "Private Standalone Hospital" },
    { value: "government", label: "Government Hospital" },
    { value: "trust", label: "Trust / Charity Hospital" },
  ];

  const insuranceOptions = [
    { value: "no", label: "No insurance" },
    { value: "yes", label: "Yes, fully covered" },
    { value: "partial", label: "Partial coverage" },
  ];

  let step = 1;
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

  const formLoadedAt = Date.now();

  function addSurpriseCharge() {
    if (surpriseCharges.length < 10) {
      surpriseCharges = [...surpriseCharges, { description: "", amount: null }];
    }
  }

  function removeSurpriseCharge(index: number) {
    surpriseCharges = surpriseCharges.filter((_, i) => i !== index);
  }

  function canAdvance(): boolean {
    if (step === 1) {
      return !!procedureType && !!city && !!hospitalTier && !!insuranceUsed &&
        (procedureType !== "other" || !!procedureOther.trim());
    }
    if (step === 2) {
      return quotedAmount !== null && quotedAmount >= 100 &&
        finalAmount !== null && finalAmount >= 100 &&
        procedureYear >= 2015 && procedureYear <= new Date().getFullYear();
    }
    return true;
  }

  async function handleSubmit() {
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
    } catch (e) {
      error = e instanceof Error ? e.message : "Something went wrong";
    } finally {
      submitting = false;
    }
  }

  $: selectedCity = data.cities.find((c) => c.slug === city);
</script>

<svelte:head>
  <title>Share Your Bill — gotbilled.in</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-4 py-8">
  {#if success && resultData}
    <!-- Success State -->
    <div class="text-center py-12">
      <div class="text-6xl mb-4">✅</div>
      <h1 class="text-3xl font-bold mb-4">Bill Shared!</h1>

      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6 inline-block">
        <div class="text-sm text-gray-500 mb-1">Your surprise markup</div>
        <div class="text-5xl font-bold" class:text-brand-600={resultData.surprise_percentage > 0} class:text-green-600={resultData.surprise_percentage <= 0}>
          {resultData.surprise_percentage > 0 ? "+" : ""}{resultData.surprise_percentage}%
        </div>
      </div>

      <p class="text-gray-600 mb-8">
        Your anonymous report helps others know what to expect. It'll appear in aggregated stats within a couple of minutes.
      </p>

      <div class="flex gap-4 justify-center">
        <a href="/" class="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors">
          Go Home
        </a>
        <button on:click={() => { success = false; step = 1; procedureType = ""; city = ""; quotedAmount = null; finalAmount = null; }}
          class="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors">
          Share Another
        </button>
      </div>
    </div>

  {:else}
    <!-- Form -->
    <h1 class="text-3xl font-bold mb-2">Share Your Bill</h1>
    <p class="text-gray-600 mb-8">100% anonymous. No login needed. Takes 2 minutes.</p>

    <!-- Progress bar -->
    <div class="flex gap-2 mb-8">
      {#each [1, 2, 3] as s}
        <div class="flex-1 h-2 rounded-full {step >= s ? 'bg-brand-500' : 'bg-gray-200'} transition-colors"></div>
      {/each}
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
        {error}
      </div>
    {/if}

    {#if step === 1}
      <!-- Step 1: Procedure & Location -->
      <div class="space-y-6">
        <div>
          <label for="procedure" class="block text-sm font-medium text-gray-700 mb-2">What procedure?</label>
          <select id="procedure" bind:value={procedureType}
            class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white">
            <option value="">Select procedure type</option>
            {#each data.procedures as proc}
              <option value={proc.slug}>{proc.name}</option>
            {/each}
          </select>
        </div>

        {#if procedureType === "other"}
          <div>
            <label for="procedureOther" class="block text-sm font-medium text-gray-700 mb-2">Specify the procedure</label>
            <input id="procedureOther" type="text" bind:value={procedureOther} maxlength="100" placeholder="e.g. Appendix removal"
              class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
          </div>
        {/if}

        <div>
          <label for="city" class="block text-sm font-medium text-gray-700 mb-2">Which city?</label>
          <select id="city" bind:value={city}
            class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white">
            <option value="">Select city</option>
            {#each data.cities as c}
              <option value={c.slug}>{c.name}, {c.state}</option>
            {/each}
          </select>
          {#if selectedCity}
            <div class="text-sm text-gray-500 mt-1">State: {selectedCity.state} (auto-filled)</div>
          {/if}
        </div>

        <div>
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label class="block text-sm font-medium text-gray-700 mb-2">Hospital type</label>
          <div class="grid grid-cols-1 gap-2">
            {#each hospitalTiers as tier}
              <label class="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:border-brand-300 transition-colors {hospitalTier === tier.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}">
                <input type="radio" bind:group={hospitalTier} value={tier.value} class="text-brand-600 focus:ring-brand-500" />
                <span class="text-sm">{tier.label}</span>
              </label>
            {/each}
          </div>
        </div>

        <div>
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label class="block text-sm font-medium text-gray-700 mb-2">Did you use insurance?</label>
          <div class="grid grid-cols-3 gap-2">
            {#each insuranceOptions as opt}
              <label class="flex items-center justify-center gap-2 border rounded-lg p-3 cursor-pointer hover:border-brand-300 transition-colors text-center {insuranceUsed === opt.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}">
                <input type="radio" bind:group={insuranceUsed} value={opt.value} class="sr-only" />
                <span class="text-sm font-medium">{opt.label}</span>
              </label>
            {/each}
          </div>
        </div>

        <button on:click={() => { if (canAdvance()) step = 2; }}
          disabled={!canAdvance()}
          class="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Next: Bill Amounts
        </button>
      </div>

    {:else if step === 2}
      <!-- Step 2: Amounts -->
      <div class="space-y-6">
        <div>
          <label for="quoted" class="block text-sm font-medium text-gray-700 mb-2">
            Quoted amount (what they said it would cost)
          </label>
          <div class="relative">
            <span class="absolute left-3 top-3 text-gray-500">₹</span>
            <input id="quoted" type="number" bind:value={quotedAmount} min="100" max="5000000" placeholder="e.g. 50000"
              class="w-full border border-gray-300 rounded-lg p-3 pl-8 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
          </div>
        </div>

        <div>
          <label for="final" class="block text-sm font-medium text-gray-700 mb-2">
            Final bill (what you actually paid)
          </label>
          <div class="relative">
            <span class="absolute left-3 top-3 text-gray-500">₹</span>
            <input id="final" type="number" bind:value={finalAmount} min="100" max="5000000" placeholder="e.g. 75000"
              class="w-full border border-gray-300 rounded-lg p-3 pl-8 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
          </div>
        </div>

        {#if quotedAmount && finalAmount}
          {@const pct = ((finalAmount - quotedAmount) / quotedAmount) * 100}
          <div class="bg-gray-50 rounded-lg p-4 text-center">
            <div class="text-sm text-gray-500 mb-1">Surprise markup</div>
            <div class="text-3xl font-bold" class:text-brand-600={pct > 0} class:text-green-600={pct <= 0}>
              {pct > 0 ? "+" : ""}{Math.round(pct)}%
            </div>
          </div>
        {/if}

        <div>
          <label for="year" class="block text-sm font-medium text-gray-700 mb-2">Year of procedure</label>
          <select id="year" bind:value={procedureYear}
            class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white">
            {#each Array.from({ length: new Date().getFullYear() - 2014 }, (_, i) => new Date().getFullYear() - i) as yr}
              <option value={yr}>{yr}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="stay" class="block text-sm font-medium text-gray-700 mb-2">
            Hospital stay (days) <span class="text-gray-400 font-normal">— optional</span>
          </label>
          <input id="stay" type="number" bind:value={stayDays} min="0" max="365" placeholder="e.g. 3"
            class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
        </div>

        <div class="flex gap-3">
          <button on:click={() => step = 1}
            class="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Back
          </button>
          <button on:click={() => { if (canAdvance()) step = 3; }}
            disabled={!canAdvance()}
            class="flex-1 bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Next: Surprise Charges
          </button>
        </div>
      </div>

    {:else if step === 3}
      <!-- Step 3: Surprise Charges (optional) + Submit -->
      <div class="space-y-6">
        <div>
          <div class="flex items-center justify-between mb-2">
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="block text-sm font-medium text-gray-700">
              Any surprise line items? <span class="text-gray-400 font-normal">— optional</span>
            </label>
            {#if surpriseCharges.length < 10}
              <button on:click={addSurpriseCharge} class="text-sm text-brand-600 hover:text-brand-800 font-medium">
                + Add item
              </button>
            {/if}
          </div>

          <p class="text-sm text-gray-500 mb-4">
            Were there any charges on the final bill that caught you off guard? Things like "PPE kit ₹2,000" or "room upgrade ₹5,000" that nobody mentioned.
          </p>

          {#each surpriseCharges as charge, i}
            <div class="flex gap-2 mb-3">
              <input type="text" bind:value={charge.description} maxlength="200" placeholder="What was it?"
                class="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
              <div class="relative w-32">
                <span class="absolute left-2 top-3 text-gray-500 text-sm">₹</span>
                <input type="number" bind:value={charge.amount} min="1" placeholder="Amount"
                  class="w-full border border-gray-300 rounded-lg p-3 pl-6 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <button on:click={() => removeSurpriseCharge(i)}
                class="text-gray-400 hover:text-red-500 px-2 transition-colors" aria-label="Remove">
                ✕
              </button>
            </div>
          {/each}
        </div>

        <!-- Summary -->
        <div class="bg-gray-50 rounded-xl p-6">
          <h3 class="font-semibold mb-4">Summary</h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500">Procedure</dt>
              <dd class="font-medium">{data.procedures.find(p => p.slug === procedureType)?.name || procedureType}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">City</dt>
              <dd class="font-medium">{selectedCity?.name}, {selectedCity?.state}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Hospital type</dt>
              <dd class="font-medium">{hospitalTiers.find(t => t.value === hospitalTier)?.label}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Insurance</dt>
              <dd class="font-medium">{insuranceOptions.find(o => o.value === insuranceUsed)?.label}</dd>
            </div>
            <hr class="border-gray-200" />
            <div class="flex justify-between">
              <dt class="text-gray-500">Quoted</dt>
              <dd class="font-medium">₹{quotedAmount?.toLocaleString("en-IN")}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Final bill</dt>
              <dd class="font-medium">₹{finalAmount?.toLocaleString("en-IN")}</dd>
            </div>
            {#if quotedAmount && finalAmount}
              {@const diff = finalAmount - quotedAmount}
              <div class="flex justify-between font-semibold">
                <dt>{diff > 0 ? "Overbilled" : "Saved"}</dt>
                <dd class:text-brand-600={diff > 0} class:text-green-600={diff <= 0}>
                  {diff > 0 ? "+" : ""}₹{Math.abs(diff).toLocaleString("en-IN")}
                </dd>
              </div>
            {/if}
          </dl>
        </div>

        <div class="flex gap-3">
          <button on:click={() => step = 2}
            class="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Back
          </button>
          <button on:click={handleSubmit}
            disabled={submitting}
            class="flex-1 bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Anonymously"}
          </button>
        </div>

        <p class="text-xs text-gray-400 text-center">
          No personal information is collected. Your IP is hashed (one-way) solely for rate limiting and never stored in readable form.
        </p>
      </div>
    {/if}
  {/if}
</div>
