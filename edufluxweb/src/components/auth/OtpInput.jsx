import React, { useRef, useEffect } from 'react'

/**
 * Reusable 6-Digit OTP Input Component
 *
 * @param {Object} props
 * @param {number} [props.length=6] - Number of OTP digits (default 6)
 * @param {string} props.value - Current combined OTP string
 * @param {function(string): void} props.onChange - Callback fired when OTP value changes
 * @param {function(string): void} [props.onComplete] - Callback fired when all digits are filled
 * @param {boolean} [props.disabled=false] - Whether inputs are disabled
 * @param {boolean} [props.hasError=false] - Whether error state should be styled
 * @param {boolean} [props.autoFocus=true] - Whether first input should auto focus
 */
export default function OtpInput({
  length = 6,
  value = '',
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
}) {
  const inputRefs = useRef([])

  // Ensure refs array length matches requested OTP length
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  // Auto focus first input on mount if autoFocus is enabled
  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus, disabled])

  // Convert value string into array of single digits of fixed length
  const digits = Array.from({ length }, (_, i) => value[i] || '')

  const handleInputChange = (index, e) => {
    const val = e.target.value
    // Strip non-digit characters
    const digit = val.replace(/\D/g, '').slice(-1)

    const newDigits = [...digits]
    newDigits[index] = digit
    const newCombined = newDigits.join('')

    onChange(newCombined)

    // Advance to next input if digit was entered
    if (digit && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }

    // Trigger onComplete if all digits are entered
    if (newCombined.length === length && onComplete) {
      onComplete(newCombined)
    }
  }

  const handleKeyDown = (index, e) => {
    if (disabled) return

    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        // If current field is empty, move focus to previous input and clear it
        e.preventDefault()
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        const newCombined = newDigits.join('')
        onChange(newCombined)
        inputRefs.current[index - 1].focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    if (disabled) return

    const pasteData = e.clipboardData.getData('text')
    const pastedDigits = pasteData.replace(/\D/g, '').slice(0, length)

    if (!pastedDigits) return

    const newDigits = Array.from({ length }, (_, i) => pastedDigits[i] || '')
    const newCombined = newDigits.join('')

    onChange(newCombined)

    // Focus last pasted input or last field
    const nextFocusIndex = Math.min(pastedDigits.length, length - 1)
    if (inputRefs.current[nextFocusIndex]) {
      inputRefs.current[nextFocusIndex].focus()
    }

    if (newCombined.length === length && onComplete) {
      onComplete(newCombined)
    }
  }

  const handleFocus = (e) => {
    e.target.select()
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-4">
      {digits.map((digit, idx) => {
        const isFilled = Boolean(digit)
        return (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete="one-time-code"
            disabled={disabled}
            value={digit}
            onChange={(e) => handleInputChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            onFocus={handleFocus}
            aria-label={`Digit ${idx + 1} of ${length}`}
            className={`
              w-11 h-13 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl transition-all duration-200 outline-none select-none
              font-headline-md tracking-tight shadow-sm
              ${
                disabled
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : hasError
                  ? 'bg-red-50/80 text-red-600 border-2 border-red-400 focus:border-red-600 focus:ring-4 focus:ring-red-100'
                  : isFilled
                  ? 'bg-white text-[#0F2C59] border-2 border-[#0F2C59] focus:border-[#F5A623] focus:ring-4 focus:ring-[#F5A623]/20 shadow-md scale-[1.02]'
                  : 'bg-white/90 text-[#0F2C59] border border-slate-300 hover:border-slate-400 focus:border-[#0F2C59] focus:ring-4 focus:ring-[#0F2C59]/15'
              }
            `}
          />
        )
      })}
    </div>
  )
}
