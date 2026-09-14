'use client'

/**
 * src/components/mfa/MfaChallengeScreen.tsx
 *
 * Shown after signin returns { mfa_required: true }.
 * Handles both TOTP (6-digit boxes) and backup code (text input) paths.
 *
 * Props:
 *   mfaToken  — the short-lived token returned by the signin server action
 *   onSuccess — called after challenge API verifies the code (cookie already set server-side)
 *   onCancel  — back to signin form
 */

import { useState } from 'react'
import OtpInput, { useOtpReset } from './OtpInput'
import styles from './MfaChallengeScreen.module.css'

interface MfaChallengeScreenProps {
  mfaToken: string
  onSuccess: () => void
  onCancel: () => void
}

type Mode = 'totp' | 'backup'

export default function MfaChallengeScreen({
  mfaToken,
  onSuccess,
  onCancel,
}: MfaChallengeScreenProps) {
  const [mode, setMode] = useState<Mode>('totp')
  const [backupCode, setBackupCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { key: otpKey, reset: resetOtp } = useOtpReset()

  const submitCode = async (code: string) => {
    if (loading) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/mfa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Invalid code. Please try again.')
        resetOtp()
        setBackupCode('')
        return
      }

      // Session cookie is set server-side — just redirect
      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
      resetOtp()
    } finally {
      setLoading(false)
    }
  }

  const handleBackupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (backupCode.trim()) submitCode(backupCode.trim())
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setBackupCode('')
    resetOtp()
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>

        {/* Icon */}
        <div className={styles.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2L4 5v6c0 5.25 3.5 10.15 8 11.35C16.5 21.15 20 16.25 20 11V5l-8-3z"
              fill="var(--challenge-accent, #CF5116)"
              opacity="0.18"
            />
            <path
              d="M12 2L4 5v6c0 5.25 3.5 10.15 8 11.35C16.5 21.15 20 16.25 20 11V5l-8-3z"
              stroke="var(--challenge-accent, #CF5116)"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <rect x="9" y="11" width="6" height="5" rx="1" fill="var(--challenge-accent, #CF5116)" />
            <path d="M10 11V9a2 2 0 114 0v2" stroke="var(--challenge-accent, #CF5116)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className={styles.title}>Two-factor authentication</h1>

        {mode === 'totp' ? (
          <>
            <p className={styles.body}>
              Enter the 6-digit code from your authenticator app.
            </p>

            <div className={styles.otpWrap}>
              <OtpInput
                key={otpKey}
                onComplete={submitCode}
                disabled={loading}
                error={!!error}
              />
            </div>

            {error && (
              <p className={styles.errorMsg} role="alert">{error}</p>
            )}

            {loading && (
              <p className={styles.loadingMsg} aria-live="polite">Verifying…</p>
            )}

            <button
              type="button"
              className={styles.switchLink}
              onClick={() => switchMode('backup')}
            >
              Use a backup code instead
            </button>
          </>
        ) : (
          <>
            <p className={styles.body}>
              Enter one of your saved backup codes.
              Format: <code className={styles.codeHint}>XXXXXX-XXXXXX</code>
            </p>

            <form onSubmit={handleBackupSubmit} className={styles.backupForm}>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3-D4E5F6"
                className={`${styles.backupInput} ${error ? styles.backupInputError : ''}`}
                autoComplete="off"
                spellCheck={false}
                disabled={loading}
                aria-label="Backup code"
                aria-describedby={error ? 'backup-error' : undefined}
              />
              {error && (
                <p id="backup-error" className={styles.errorMsg} role="alert">{error}</p>
              )}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading || !backupCode.trim()}
              >
                {loading ? 'Verifying…' : 'Verify backup code'}
              </button>
            </form>

            <button
              type="button"
              className={styles.switchLink}
              onClick={() => switchMode('totp')}
            >
              Use authenticator app instead
            </button>
          </>
        )}

        <div className={styles.divider} />

        <button
          type="button"
          className={styles.cancelLink}
          onClick={onCancel}
          disabled={loading}
        >
          ← Back to sign in
        </button>
      </div>
    </div>
  )
}
