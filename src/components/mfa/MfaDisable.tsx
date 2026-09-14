'use client'

/**
 * components/mfa/MfaDisable.tsx
 *
 * Shown in account settings when MFA is active.
 * Requires a valid TOTP code before deactivating — prevents
 * someone who grabbed an unlocked session from silently removing MFA.
 *
 * Add a DELETE /api/auth/mfa route on the backend that:
 *   1. Reads the current session (requires auth)
 *   2. Verifies the submitted code against mfaSecret
 *   3. Sets mfaEnabled=false, mfaPending=false, mfaSecret=null, mfaBackupCodes=[]
 *   4. Returns 200 { ok: true }
 *
 * Usage:
 *   <MfaDisable onDisabled={() => setMfaActive(false)} />
 */

import { useState } from 'react'
import OtpInput, { useOtpReset } from './OtpInput'
import styles from './MfaDisable.module.css'

interface MfaDisableProps {
  onDisabled: () => void
  onCancel: () => void
}

export default function MfaDisable({ onDisabled, onCancel }: MfaDisableProps) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { key: otpKey, reset: resetOtp } = useOtpReset()

  const handleDisable = async (code: string) => {
    if (loading) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Invalid code. Please try again.')
        resetOtp()
        return
      }

      onDisabled()
    } catch {
      setError('Something went wrong. Please try again.')
      resetOtp()
    } finally {
      setLoading(false)
    }
  }

  if (!confirming) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelStatus}>
            <span className={styles.activeDot} />
            Two-factor authentication is <strong>on</strong>
          </div>
          <p className={styles.panelDesc}>
            Your account is protected by an authenticator app.
            Disabling MFA will remove this protection.
          </p>
        </div>
        <div className={styles.panelActions}>
          <button
            type="button"
            className={styles.disableBtn}
            onClick={() => setConfirming(true)}
          >
            Disable MFA
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.confirmTitle}>Confirm disable</h3>
      <p className={styles.confirmDesc}>
        Enter the current code from your authenticator app to confirm
        you want to remove two-factor authentication.
      </p>

      <div className={styles.otpWrap}>
        <OtpInput
          key={otpKey}
          onComplete={handleDisable}
          disabled={loading}
          error={!!error}
        />
      </div>

      {error && <p className={styles.errorMsg} role="alert">{error}</p>}
      {loading && <p className={styles.loadingMsg}>Verifying…</p>}

      <div className={styles.panelActions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => { setConfirming(false); setError(''); resetOtp() }}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
