<script lang="ts">
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let remember = true;
  let showPassword = false;
  let errorMessage = '';
  let loading = false;

  async function handleLogin() {
    errorMessage = '';
    if (!email.trim() || !password.trim()) {
      errorMessage = 'Email and password are required.';
      return;
    }

    loading = true;
    localStorage.setItem('ress-authenticated', 'true');
    localStorage.setItem('ress-user-email', email.trim());
    if (remember) localStorage.setItem('ress-remember', 'true');
    await goto('/dashboard');
  }
</script>

<svelte:head><title>Login | RESS Monitoring</title></svelte:head>

<main class="login-shell">
  <section class="login-art">
    <div class="brand-mark">*</div>
    <div class="art-copy"><p class="eyebrow">SolarScope Platform</p><h1>Solar energy,<br /><span>under control.</span></h1><p>Monitor plant performance, devices, and energy from one place.</p></div>
    <div class="sun-grid"></div>
  </section>
  <section class="login-panel">
    <div class="login-content">
      <p class="eyebrow">Welcome back</p>
      <h2>Sign in to your dashboard</h2>
      <p class="subtext">Use your account to continue monitoring your solar plants.</p>
      <form on:submit|preventDefault={handleLogin}>
        <label>Email<input bind:value={email} type="email" placeholder="nama@perusahaan.co.id" autocomplete="email" /></label>
        <label>Password<div class="password-field"><input bind:value={password} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autocomplete="current-password" /><button type="button" on:click={() => (showPassword = !showPassword)} aria-label="Toggle password visibility">{showPassword ? 'Hide' : 'Show'}</button></div></label>
        <div class="form-options"><label class="remember"><input bind:checked={remember} type="checkbox" /> Remember me</label><button type="button" class="forgot" on:click={() => (errorMessage = 'Please contact your administrator to reset your password.')}>Forgot password?</button></div>
        {#if errorMessage}<p class="error">{errorMessage}</p>{/if}
        <button class="submit" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in to dashboard'} <span>→</span></button>
      </form>
      <p class="help">Need help? <a href="mailto:support@rms.co.id">Contact your administrator</a></p>
    </div>
    <footer>© 2026 PT. Rekayasa Mekatronika Solusindo</footer>
  </section>
</main>

<style>
  .login-shell{display:grid;min-height:100vh;grid-template-columns:1fr 1fr;background:#fff;color:#17324a}.login-art{position:relative;display:flex;overflow:hidden;flex-direction:column;justify-content:space-between;padding:42px 8%;background:#173a4e;color:#fff}.brand-mark{font-size:30px;color:#ff9a28}.art-copy{position:relative;z-index:1;margin:auto 0;max-width:450px}.eyebrow{color:#ff9224;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.art-copy h1{margin-top:18px;font-size:clamp(36px,4vw,62px);line-height:1.05;letter-spacing:-1px}.art-copy h1 span{color:#ff9a28}.art-copy>p:last-child{max-width:320px;margin-top:22px;color:#b5cad3;font-size:14px;line-height:1.7}.sun-grid{position:absolute;right:-12%;bottom:-25%;height:70%;width:80%;border:1px solid rgb(255 154 40 / 22%);border-radius:50%;box-shadow:0 0 0 40px rgb(255 154 40 / 4%),0 0 0 80px rgb(255 154 40 / 3%)}.sun-grid::after{content:'';position:absolute;inset:18%;border:1px solid rgb(255 154 40 / 25%);border-radius:50%}.login-panel{display:flex;flex-direction:column;justify-content:center;padding:48px 11%}.login-content{width:100%;max-width:420px;margin:0 auto}.login-panel h2{margin-top:12px;font-size:30px;letter-spacing:-.5px}.subtext{margin-top:8px;color:#8397a4;font-size:13px}.login-panel form{margin-top:32px}.login-panel form>label{display:block;margin-top:18px;color:#506b7c;font-size:11px;font-weight:600}.login-panel form>label:first-child{margin-top:0}.login-panel input:not([type=checkbox]){display:block;width:100%;height:44px;margin-top:7px;border:1px solid #dce7eb;border-radius:6px;padding:0 13px;color:#1f3a52;font-size:13px;outline:none}.login-panel input:not([type=checkbox]):focus{border-color:#ff992b;box-shadow:0 0 0 3px rgb(255 153 43 / 12%)}.password-field{position:relative}.password-field input{padding-right:70px!important}.password-field button{position:absolute;right:10px;top:14px;border:0;background:transparent;color:#ff8c20;font-size:10px}.form-options{display:flex;align-items:center;justify-content:space-between;margin-top:15px;color:#8094a1;font-size:11px}.remember{display:flex!important;align-items:center;gap:7px;margin:0!important;font-weight:400!important}.remember input{accent-color:#ff8c20}.forgot{border:0;background:transparent;color:#f18419;font-size:11px}.error{margin-top:12px;border-radius:5px;background:#fff1f2;padding:9px;color:#d64c59;font-size:11px}.submit{display:flex;width:100%;height:46px;align-items:center;justify-content:space-between;margin-top:23px;border:0;border-radius:6px;padding:0 16px;background:#1d3749;color:#fff;font-size:12px;font-weight:700}.submit span{font-size:18px;color:#ff992b}.submit:disabled{cursor:wait;opacity:.7}.help{margin-top:28px;text-align:center;color:#8a9da8;font-size:11px}.help a{color:#f18419}.login-panel footer{margin-top:auto;padding-top:40px;text-align:center;color:#a2b0b8;font-size:10px}@media(max-width:800px){.login-shell{grid-template-columns:1fr}.login-art{min-height:250px;padding:25px 8%}.art-copy{margin:25px 0 0}.art-copy h1{font-size:38px}.art-copy>p:last-child{margin-top:10px}.sun-grid{right:-20%;bottom:-65%}.login-panel{padding:42px 8%;min-height:calc(100vh - 250px)}}
</style>
