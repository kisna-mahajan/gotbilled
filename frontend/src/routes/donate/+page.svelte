<script lang="ts">
  let copied = false;

  function copyUPI() {
    navigator.clipboard.writeText("gotbilled@upi").then(() => {
      copied = true;
      setTimeout(() => (copied = false), 2000);
    });
  }
</script>

<svelte:head>
  <title>Support — gotbilled.in</title>
</svelte:head>

<section class="max-w-xl mx-auto px-6 pt-16 md:pt-24 pb-20">
  <h1 class="text-3xl md:text-4xl font-black tracking-tight mb-4">Keep this running</h1>
  <p class="text-ink-300 leading-relaxed mb-10">
    gotbilled.in is free, anonymous, and ad-free. No logins, no tracking, no data selling.
    There are domain and server costs to keep this up. If this helps you, consider chipping in.
  </p>

  <div class="space-y-4 mb-12">
    <div class="border border-ink-100 rounded-2xl p-6">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-2xl">&#9889;</span>
        <h2 class="font-bold text-lg">UPI</h2>
      </div>
      <p class="text-sm text-ink-300 mb-4">Fastest way to support. Any amount helps.</p>
      <div class="flex items-center gap-3">
        <code class="bg-ink-50 px-4 py-2.5 rounded-xl font-mono text-sm flex-1">gotbilled@upi</code>
        <button on:click={copyUPI}
          class="text-sm font-medium px-4 py-2.5 rounded-xl border border-ink-100 hover:border-ink-900 transition-colors">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p class="text-xs text-ink-200 mt-2">UPI ID will be updated once configured.</p>
    </div>

    <div class="border border-ink-100 rounded-2xl p-6">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-2xl">&#9749;</span>
        <h2 class="font-bold text-lg">Buy us a chai</h2>
      </div>
      <p class="text-sm text-ink-300 mb-4">Support via payment link.</p>
      <!-- svelte-ignore a11y-invalid-attribute -->
      <a href="#" class="inline-block text-sm font-semibold px-6 py-2.5 rounded-full bg-ink-900 text-white hover:bg-ink-700 transition-colors">
        Donate &rarr;
      </a>
      <p class="text-xs text-ink-200 mt-2">Payment link will be added soon.</p>
    </div>
  </div>

  <div class="bg-ink-50 rounded-2xl p-6">
    <h3 class="font-semibold mb-2">Where does the money go?</h3>
    <ul class="text-sm text-ink-500 space-y-1.5">
      <li class="flex items-start gap-2">
        <span class="text-ink-300 mt-0.5">&#8226;</span>
        <span>Domain and server costs</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-ink-300 mt-0.5">&#8226;</span>
        <span>Zero profit. This is a community project.</span>
      </li>
    </ul>
  </div>

  <div class="text-center mt-12">
    <a href="/" class="text-sm text-ink-300 hover:text-ink-900 transition-colors">&larr; Back home</a>
  </div>
</section>
