import { useState } from 'react'
import { accountSecurityService } from '../services/accountSecurityService'

interface Props {
  userId: string
  onRecoveryComplete?: () => void
}

type Step = 'initial' | 'security_questions' | 'verification' | 'reset_password' | 'complete'

export function AccountRecoveryFlow({ userId, onRecoveryComplete }: Props) {
  const [step, setStep] = useState<Step>('initial')
  const [recoveryId, setRecoveryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [securityQuestions, setSecurityQuestions] = useState<Array<{ id: string; question: string }>>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)

  const handleInitiateRecovery = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await accountSecurityService.initiateAccountRecovery(userId)

      if (result.cooldownUntil) {
        setCooldownUntil(result.cooldownUntil)
        setError('Too many recovery attempts. Please try again later.')
        return
      }

      setRecoveryId(result.recoveryId)
      setStep('security_questions')

      // Fetch security questions
      const response = await fetch(`/api/users/${userId}/security-questions`)
      if (response.ok) {
        const questions = await response.json()
        setSecurityQuestions(questions)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recovery'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyQuestions = async () => {
    if (!recoveryId || securityQuestions.some(q => !answers[q.id])) {
      setError('Please answer all security questions')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await accountSecurityService.verifySecurityQuestions(recoveryId, answers)

      if (!result.success) {
        setError(result.message)
        return
      }

      setStep('verification')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (!recoveryId) throw new Error('Recovery ID missing')

      const result = await accountSecurityService.completeRecoveryWithWaitingPeriod(
        recoveryId,
        newPassword
      )

      if (result.success) {
        setStep('complete')
        onRecoveryComplete?.()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const getRemainingTime = (): string => {
    if (!cooldownUntil) return ''
    const remaining = cooldownUntil - Date.now()
    const hours = Math.ceil(remaining / (60 * 60 * 1000))
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  return (
    <div className="account-recovery-flow">
      <h2 className="account-recovery-flow__title">Account Recovery</h2>

      {step === 'initial' && (
        <div className="account-recovery-flow__section">
          <p className="account-recovery-flow__description">
            Lost access to your account? We can help you recover it through a secure verification process.
          </p>
          <p className="account-recovery-flow__warning">
            ⚠️ This process requires 24 hours before access is restored as a security measure.
          </p>
          <button
            onClick={handleInitiateRecovery}
            disabled={isLoading}
            className="btn btn--primary"
          >
            {isLoading ? 'Starting...' : 'Start Recovery'}
          </button>
        </div>
      )}

      {step === 'security_questions' && (
        <div className="account-recovery-flow__section">
          <h3 className="account-recovery-flow__step-title">Answer Security Questions</h3>
          <p className="account-recovery-flow__step-description">
            Please answer the security questions you set up during account creation.
          </p>

          {securityQuestions.map(question => (
            <div key={question.id} className="account-recovery-flow__question">
              <label htmlFor={question.id} className="account-recovery-flow__question-label">
                {question.question}
              </label>
              <input
                id={question.id}
                type="text"
                value={answers[question.id] || ''}
                onChange={e => setAnswers({ ...answers, [question.id]: e.target.value })}
                className="account-recovery-flow__input"
                disabled={isLoading}
              />
            </div>
          ))}

          <div className="account-recovery-flow__actions">
            <button
              onClick={handleVerifyQuestions}
              disabled={isLoading}
              className="btn btn--primary"
            >
              {isLoading ? 'Verifying...' : 'Verify Answers'}
            </button>
            <button
              onClick={() => setStep('initial')}
              disabled={isLoading}
              className="btn btn--ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'verification' && (
        <div className="account-recovery-flow__section">
          <h3 className="account-recovery-flow__step-title">Verification Sent</h3>
          <p className="account-recovery-flow__step-description">
            ✓ Your security questions were verified. You will receive a verification link via email.
          </p>
          <p className="account-recovery-flow__note">
            Please check your email and click the verification link to proceed with password reset.
          </p>
          <button
            onClick={() => setStep('reset_password')}
            className="btn btn--primary"
          >
            Continue to Password Reset
          </button>
        </div>
      )}

      {step === 'reset_password' && (
        <div className="account-recovery-flow__section">
          <h3 className="account-recovery-flow__step-title">Set New Password</h3>

          <div className="account-recovery-flow__password-input">
            <label htmlFor="new-password" className="account-recovery-flow__label">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="account-recovery-flow__input"
              placeholder="At least 8 characters"
              disabled={isLoading}
            />
          </div>

          <div className="account-recovery-flow__password-input">
            <label htmlFor="confirm-password" className="account-recovery-flow__label">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="account-recovery-flow__input"
              placeholder="Re-enter password"
              disabled={isLoading}
            />
          </div>

          <div className="account-recovery-flow__actions">
            <button
              onClick={handleResetPassword}
              disabled={isLoading}
              className="btn btn--primary"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              onClick={() => setStep('initial')}
              disabled={isLoading}
              className="btn btn--ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="account-recovery-flow__section account-recovery-flow__section--success">
          <h3 className="account-recovery-flow__step-title">✓ Recovery Complete</h3>
          <p className="account-recovery-flow__step-description">
            Your account access will be restored in 24 hours. You can now log in with your new password.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="btn btn--primary"
          >
            Go to Login
          </button>
        </div>
      )}

      {error && (
        <div className="account-recovery-flow__error">
          {error}
          {cooldownUntil && (
            <div className="account-recovery-flow__cooldown">
              Try again in {getRemainingTime()}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .account-recovery-flow {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
          background: var(--surface);
          border-radius: 8px;
        }

        .account-recovery-flow__title {
          margin: 0 0 1.5rem;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .account-recovery-flow__section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--background);
          border-radius: 6px;
        }

        .account-recovery-flow__section--success {
          background: rgba(81, 207, 102, 0.1);
          border-left: 3px solid #51cf66;
        }

        .account-recovery-flow__description {
          margin: 0;
          font-size: 0.975rem;
          line-height: 1.5;
        }

        .account-recovery-flow__warning {
          margin: 0;
          padding: 0.75rem;
          background: rgba(255, 193, 7, 0.1);
          border-left: 3px solid #ffc107;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .account-recovery-flow__step-title {
          margin: 0 0 0.5rem;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .account-recovery-flow__step-description {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .account-recovery-flow__note {
          margin: 0;
          padding: 0.75rem;
          background: var(--surface);
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .account-recovery-flow__question {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .account-recovery-flow__question-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .account-recovery-flow__password-input {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .account-recovery-flow__label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .account-recovery-flow__input {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 1rem;
        }

        .account-recovery-flow__input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .account-recovery-flow__actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .account-recovery-flow__error {
          padding: 0.75rem;
          background: #ffe0e0;
          border-left: 3px solid #ff4444;
          border-radius: 4px;
          color: #c00;
          font-size: 0.875rem;
        }

        .account-recovery-flow__cooldown {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #ff4444;
        }
      `}</style>
    </div>
  )
}
