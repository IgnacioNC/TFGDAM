function LoginView({
  busy,
  email,
  password,
  setEmail,
  setPassword,
  onLogin,
  canRegister,
  onRegister,
}) {
  return (
    <section className="panel">
      <h2>Login</h2>
      <form className="grid two" onSubmit={onLogin}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={busy}>
          Entrar
        </button>
        {canRegister && (
          <button type="button" onClick={onRegister} disabled={busy}>
            Crear cuenta
          </button>
        )}
      </form>
    </section>
  )
}

export default LoginView
