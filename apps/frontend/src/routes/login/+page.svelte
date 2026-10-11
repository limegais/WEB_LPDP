<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { authStore, DEMO_USERS } from '$lib/auth';

  let email = '';
  let password = '';
  let remember = true;
  let showPassword = false;
  let errorMessage = '';
  let loading = false;

  onMount(() => authStore.load());

  async function handleLogin() {
    errorMessage = '';
    if (!email.trim() || !password.trim()) {
      errorMessage = 'Email dan password wajib diisi.';
      return;
    }

    loading = true;
    await new Promise((r) => setTimeout(r, 700));

    const match = DEMO_USERS.find(
      (u) => u.email === email.trim() && u.password === password
    );

    if (!match) {
      loading = false;
      errorMessage = 'Email atau password tidak valid.';
      return;
    }

    authStore.login({ email: match.email, name: match.name, role: match.role });
    if (remember) localStorage.setItem('ress-remember', 'true');
    await goto('/dashboard');
  }
</script>

<svelte:head><title>Login | RESS Monitoring</title></svelte:head>

<main class="shell">
  <section class="art-side">
    <div class="brand">
      <div class="brand-mark">☼</div>
      <span>Renewable Energy Scope</span>
    </div>
    <div class="art-copy">
      <p class="eyebrow">RESS Platform</p>
      <h1>Renewable energy,<br /><span>under control.</span></h1>
      <p class="desc">Monitor plant performance, devices, and energy from one place.</p>
    </div>
    <div class="orb"></div>
  </section>

  <section class="form-side">
    <div class="form-inner">
      <p class="eyebrow">Welcome back</p>
      <h2>Sign in to your dashboard</h2>
      <p class="sub">Use your account to continue monitoring your renewable energy plants.</p>

      <form on:submit|preventDefault={handleLogin}>
        <label for="email">Email</label>
        <input id="email" bind:value={email} type="email" placeholder="nama@perusahaan.co.id" autocomplete="email" />

        <label for="password">Password</label>
        <div class="pw-wrap">
          <input
            id="password"
            bind:value={password}
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autocomplete="current-password"
          />
          <button type="button" class="eye" on:click={() => (showPassword = !showPassword)} aria-label="Toggle">
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <div class="opts">
          <label class="remember"><input bind:checked={remember} type="checkbox" /> Remember me</label>
          <button type="button" class="forgot" on:click={() => (errorMessage = 'Hubungi administrator untuk reset password.')}>
            Forgot password?
          </button>
        </div>

        {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}

        <button id="login-submit" class="submit" type="submit" disabled={loading}>
          {#if loading}<span class="spin"></span>{/if}
          {loading ? 'Signing in…' : 'Sign in to dashboard'}
          {#if !loading}<span class="arrow">→</span>{/if}
        </button>
      </form>

      <p class="help">Need help? <a href="mailto:support@rms.co.id">Contact your administrator</a></p>
    </div>
    <footer>© 2026 PT. Rekayasa Mekatronika Solusindo</footer>
  </section>
</main>

<style>
  :global(body) { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; }

  .shell {
    display: grid;
    min-height: 100vh;
    grid-template-columns: 1fr 1fr;
    color: #17324a;
  }

  /* ── Art side ──────────────────────────────────────── */
  .art-side {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 42px 8%;
    background: #173a4e;
    color: #fff;
    overflow: hidden;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,.7);
  }
  .brand-mark { font-size: 26px; color: #ff9a28; }

  .eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: #ff4f00;
    margin: 0 0 14px;
  }

  .art-copy { position: relative; z-index: 1; max-width: 420px; }
  .art-copy h1 {
    margin: 0 0 18px;
    font-size: clamp(34px, 3.8vw, 58px);
    line-height: 1.06;
    letter-spacing: -1.5px;
  }
  .art-copy h1 span { color: #ff9a28; }
  .desc { max-width: 300px; margin: 0; color: #b5cad3; font-size: 13px; line-height: 1.7; }

  /* decorative orb */
  .orb {
    position: absolute;
    right: -14%;
    bottom: -28%;
    width: 75%;
    height: 68%;
    border-radius: 50%;
    border: 1px solid rgba(255,154,40,.2);
    box-shadow:
      0 0 0 38px rgba(255,154,40,.04),
      0 0 0 76px rgba(255,154,40,.025);
    pointer-events: none;
  }
  .orb::after {
    content: '';
    position: absolute;
    inset: 18%;
    border: 1px solid rgba(255,154,40,.22);
    border-radius: 50%;
  }

  /* ── Form side ──────────────────────────────────────── */
  .form-side {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 11%;
  }

  .form-inner {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  .form-side .eyebrow { color: #ff4f00; }

  h2 {
    margin: 10px 0 8px;
    font-size: 28px;
    letter-spacing: -.5px;
    color: #17324a;
  }

  .sub { margin: 0 0 30px; color: #8397a4; font-size: 13px; line-height: 1.6; }

  form { display: flex; flex-direction: column; }

  form > label {
    margin-top: 18px;
    font-size: 11px;
    font-weight: 600;
    color: #506b7c;
    letter-spacing: .04em;
  }
  form > label:first-of-type { margin-top: 0; }

  input:not([type='checkbox']) {
    display: block;
    width: 100%;
    height: 44px;
    margin-top: 7px;
    border: 1px solid #dce7eb;
    border-radius: 6px;
    padding: 0 13px;
    color: #1f3a52;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-color .18s, box-shadow .18s;
  }
  input:not([type='checkbox']):focus {
    border-color: #ff992b;
    box-shadow: 0 0 0 3px rgba(255,153,43,.12);
  }

  .pw-wrap { position: relative; }
  .pw-wrap input { padding-right: 64px !important; }
  .eye {
    position: absolute;
    right: 10px; top: 14px;
    border: 0; background: transparent;
    color: #f18419; font-size: 10px; font-weight: 600;
    cursor: pointer; font-family: inherit;
  }

  .opts {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;
    font-size: 11px;
    color: #8094a1;
  }
  .remember {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .remember input { accent-color: #ff8c20; width: auto; height: auto; margin: 0; }
  .forgot {
    border: 0; background: transparent;
    color: #f18419; font-size: 11px; cursor: pointer; font-family: inherit;
  }

  .error {
    margin-top: 12px;
    border-radius: 5px;
    background: #fff1f2;
    padding: 9px 11px;
    color: #d64c59;
    font-size: 11px;
  }

  .submit {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 46px;
    margin-top: 22px;
    border: 0;
    border-radius: 6px;
    padding: 0 16px;
    background: #1d3749;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background .18s, opacity .18s;
  }
  .submit:hover:not(:disabled) { background: #254a61; }
  .submit:disabled { opacity: .65; cursor: wait; }
  .arrow { font-size: 18px; color: #ff992b; }

  .spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .65s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .help {
    margin-top: 26px;
    text-align: center;
    font-size: 11px;
    color: #8a9da8;
  }
  .help a { color: #f18419; text-decoration: none; }
  .help a:hover { text-decoration: underline; }

  footer {
    margin-top: auto;
    padding-top: 40px;
    text-align: center;
    color: #a2b0b8;
    font-size: 10px;
  }

  /* ── Responsive ─────────────────────────────────────── */
  @media (max-width: 800px) {
    .shell { grid-template-columns: 1fr; }
    .art-side { min-height: 220px; padding: 28px 7%; }
    .art-copy { margin: 18px 0 0; }
    .art-copy h1 { font-size: 36px; }
    .orb { right: -22%; bottom: -70%; }
    .form-side { padding: 36px 7%; }
  }
</style>

