'use client'

/**
 * components/mfa/MfaSetup.tsx
 *
 * 3-step MFA enrollment modal:
 *   Step 1 — QR code to scan with authenticator app
 *   Step 2 — Enter first TOTP code to confirm enrollment
 *   Step 3 — Display one-time backup codes (never shown again)
 *
 * Install:  npm install qrcode @types/qrcode
 *
 * Usage:
 *   <MfaSetup onComplete={() => setShowSetup(false)} onClose={...} />
 */

import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import OtpInput, { useOtpReset } from './OtpInput'
import styles from './MfaSetup.module.css'

interface MfaSetupProps {
  onComplete: () => void  // called when all 3 steps are done
  onClose: () => void     // called if user cancels before completing
}

type Step = 'qr' | 'confirm' | 'backup'

export default function MfaSetup({ onComplete, onClose }: MfaSetupProps) {
  const [step, setStep] = useState<Step>('qr')
  const [otpAuthUri, setOtpAuthUri] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { key: otpKey, reset: resetOtp } = useOtpReset()

  // ── Step 1: Fetch the OTP URI on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch('/api/auth/mfa/enroll', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.error) {
          setError(data.error)
          return
        }
        setOtpAuthUri(data.otpAuthUri)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to start enrollment. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  // ── Render QR code to canvas whenever URI is ready ───────────────────────
  useEffect(() => {
    if (!otpAuthUri || !canvasRef.current) return

    QRCode.toCanvas(canvasRef.current, otpAuthUri, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1A1D26',
        light: '#FFFFFF',
      },
    }).catch(() => setError('Failed to render QR code.'))
  }, [otpAuthUri, step])

  // ── Step 2: Verify the first TOTP code ──────────────────────────────────
  const handleConfirm = async (code: string) => {
    if (loading) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/mfa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Invalid code. Check the time on your device.')
        resetOtp()
        return
      }

      setBackupCodes(data.backupCodes)
      setStep('backup')
    } catch {
      setError('Something went wrong. Please try again.')
      resetOtp()
    } finally {
      setLoading(false)
    }
  }

  // ── Copy backup codes to clipboard ───────────────────────────────────────
  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard API unavailable — user can manually copy
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Set up two-factor authentication">
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.stepIndicator}>
            {(['qr', 'confirm', 'backup'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`${styles.stepDot} ${step === s ? styles.stepDotActive : ''} ${
                  (['qr', 'confirm', 'backup'] as Step[]).indexOf(step) > i ? styles.stepDotDone : ''
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Step 1: QR ─────────────────────────────────────────────────── */}
        {step === 'qr' && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>Scan with your authenticator app</h2>
            <p className={styles.body}>
              Open Google Authenticator, Authy, or 1Password and scan this QR code.
            </p>

            <div className={styles.qrWrap}>
              {loading && <div className={styles.qrPlaceholder}><span className={styles.spinner} /></div>}
              <canvas
                ref={canvasRef}
                className={styles.qrCanvas}
                style={{ display: otpAuthUri ? 'block' : 'none' }}
              />
            </div>

            {otpAuthUri && (
              <details className={styles.manualDetails}>
                <summary className={styles.manualSummary}>Can't scan? Enter key manually</summary>
                <p className={styles.manualKey}>
                  {/* Extract the secret from the URI for manual entry */}
                  {new URLSearchParams(otpAuthUri.split('?')[1]).get('secret') ?? ''}
                </p>
              </details>
            )}

            {error && <p className={styles.errorMsg} role="alert">{error}</p>}

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={!otpAuthUri || loading}
                onClick={() => { setError(''); setStep('confirm') }}
              >
                I've scanned it →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Confirm ────────────────────────────────────────────── */}
        {step === 'confirm' && (
          <div className={styles.stepContent}>
            <h2 className={styles.title}>Enter the 6-digit code</h2>
            <p className={styles.body}>
              Your authenticator app is now showing a 6-digit code for HYROX Coach AI.
              Enter it below to confirm the setup.
            </p>

            <div className={styles.otpWrap}>
              <OtpInput
                key={otpKey}
                onComplete={handleConfirm}
                disabled={loading}
                error={!!error}
              />
            </div>

            {error && <p className={styles.errorMsg} role="alert">{error}</p>}
            {loading && <p className={styles.loadingMsg}>Verifying…</p>}

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={() => { setError(''); setStep('qr') }}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Backup codes ───────────────────────────────────────── */}
        {step === 'backup' && (
          <div className={styles.stepContent}>
            <div className={styles.successBadge}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              MFA enabled
            </div>
            <h2 className={styles.title}>Save your backup codes</h2>
            <p className={styles.body}>
              These 10 codes let you access your account if you lose your authenticator app.
              Each code works <strong>once only</strong>. Store them somewhere safe.
            </p>

            <div className={styles.backupGrid}>
              {backupCodes.map((code) => (
                <span key={code} className={styles.backupCode}>{code}</span>
              ))}
            </div>

            <button type="button" className={styles.copyBtn} onClick={copyBackupCodes}>
              {copied ? '✓ Copied' : 'Copy all codes'}
            </button>

            <label className={styles.ackLabel}>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className={styles.ackCheckbox}
              />
              I've saved my backup codes in a safe place
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={!acknowledged}
                onClick={onComplete}
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
