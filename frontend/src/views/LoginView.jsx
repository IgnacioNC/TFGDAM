import { useEffect, useRef } from 'react'

const GOOGLE_SCRIPT_ID = 'google-identity-services-script'
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

function loadGoogleScript() {
  const existing = document.getElementById(GOOGLE_SCRIPT_ID)
  if (existing) {
    if (window.google?.accounts?.id) return Promise.resolve()
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity Services.')), {
        once: true,
      })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = GOOGLE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services.'))
    document.head.appendChild(script)
  })
}

function LoginView({
  busy,
  email,
  password,
  setEmail,
  setPassword,
  onLogin,
  canRegister,
  onRegister,
  googleClientId,
  onGoogleCredential,
}) {
  const googleButtonRef = useRef(null)

  useEffect(() => {
    if (!googleClientId || !onGoogleCredential || !googleButtonRef.current) {
      return
    }

    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) {
          return
        }

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (!response?.credential) return
            onGoogleCredential(response.credential)
          },
        })

        googleButtonRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          locale: 'es',
        })
      })
      .catch(() => {
        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = ''
        }
      })

    return () => {
      cancelled = true
    }
  }, [googleClientId, onGoogleCredential])

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
      {googleClientId && (
        <div className="inline-actions">
          <span>o</span>
          <div ref={googleButtonRef} />
        </div>
      )}
    </section>
  )
}

export default LoginView
