'use client'

/**
 * components/mfa/OtpInput.tsx
 * 6-digit code input with per-box UX:
 *   - Auto-advances on each keystroke
 *   - Backspace moves back
 *   - Paste fills all boxes at once
 *   - Calls onComplete when all 6 digits are filled
 */

import { useRef, useState, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'
import styles from './OtpInput.module.css'

interface OtpInputProps {
  length?: number
  onComplete: (code: string) => void
  disabled?: boolean
  error?: boolean
}

export default function OtpInput({
  length = 6,
  onComplete,
  disabled = false,
  error = false,
}: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const focusBox = (index: number) => {
    inputs.current[Math.max(0, Math.min(index, length - 1))]?.focus()
  }

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1) // digits only, last char
    const next = [...values]
    next[index] = char
    setValues(next)

    if (char && index < length - 1) focusBox(index + 1)

    if (next.every(Boolean)) onComplete(next.join(''))
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...values]
      if (next[index]) {
        // Clear current box
        next[index] = ''
        setValues(next)
      } else {
        // Already empty — move back and clear previous
        next[index - 1] = ''
        setValues(next)
        focusBox(index - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusBox(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusBox(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return

    const next = Array(length).fill('')
    pasted.split('').forEach((char, i) => { next[i] = char })
    setValues(next)
    focusBox(Math.min(pasted.length, length - 1))

    if (pasted.length === length) onComplete(pasted)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  return (
    <div
      className={`${styles.root} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}
      role="group"
      aria-label="One-time passcode"
    >
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          disabled={disabled}
          className={`${styles.box} ${val ? styles.filled : ''}`}
          aria-label={`Digit ${i + 1} of ${length}`}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
        />
      ))}
    </div>
  )
}

/** Expose a reset helper so parents can clear the input on error */
export function useOtpReset() {
  // Call the returned fn to signal a reset; OtpInput re-mounts via key prop
  const [key, setKey] = useState(0)
  return { key, reset: () => setKey((k) => k + 1) }
}
