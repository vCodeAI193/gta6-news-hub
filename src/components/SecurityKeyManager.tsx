import { useState, useEffect } from 'react'
import { webAuthnService, type SecurityKeyCredential } from '../services/webAuthnService'

interface Props {
  userId: string
}

export function SecurityKeyManager({ userId }: Props) {
  const [keys, setKeys] = useState<SecurityKeyCredential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState('')
  const [renamingKeyId, setRenamingKeyId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    setIsLoading(true)
    try {
      const userKeys = await webAuthnService.getSecurityKeys(userId)
      setKeys(userKeys)
    } catch (error) {
      console.error('Failed to load security keys:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterKey = async () => {
    if (!newKeyName.trim()) {
      setRegistrationError('Please enter a name for your security key')
      return
    }

    setIsRegistering(true)
    setRegistrationError(null)

    try {
      const credential = await webAuthnService.registerSecurityKey(userId, newKeyName)
      setKeys([...keys, credential])
      setNewKeyName('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register security key'
      setRegistrationError(message)
    } finally {
      setIsRegistering(false)
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    if (window.confirm('Are you sure you want to revoke this security key?')) {
      try {
        await webAuthnService.revokeSecurityKey(keyId)
        setKeys(keys.filter(k => k.id !== keyId))
      } catch (error) {
        console.error('Failed to revoke key:', error)
      }
    }
  }

  const handleRenameKey = async (keyId: string) => {
    if (!newName.trim()) {
      setRenamingKeyId(null)
      return
    }

    try {
      const updated = await webAuthnService.renameSecurityKey(keyId, newName)
      setKeys(keys.map(k => (k.id === keyId ? updated : k)))
      setRenamingKeyId(null)
      setNewName('')
    } catch (error) {
      console.error('Failed to rename key:', error)
    }
  }

  if (!webAuthnService.isSupported()) {
    return (
      <div className="security-key-manager">
        <div className="security-key-manager__error">
          ⚠️ Your browser does not support security keys. Please use a modern browser (Chrome, Firefox, Safari, or Edge).
        </div>
      </div>
    )
  }

  return (
    <div className="security-key-manager">
      <div className="security-key-manager__header">
        <h3 className="security-key-manager__title">Security Keys</h3>
        <p className="security-key-manager__description">
          Use hardware security keys (YubiKey, Google Titan) for passwordless login
        </p>
      </div>

      <div className="security-key-manager__registration">
        <div className="security-key-manager__input-group">
          <input
            type="text"
            placeholder="e.g., My YubiKey 5"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            className="security-key-manager__input"
            disabled={isRegistering}
          />
          <button
            onClick={handleRegisterKey}
            disabled={isRegistering}
            className="btn btn--primary"
          >
            {isRegistering ? 'Registering...' : 'Register New Key'}
          </button>
        </div>
        {registrationError && (
          <p className="security-key-manager__error">{registrationError}</p>
        )}
      </div>

      {isLoading ? (
        <div className="security-key-manager__loading">Loading security keys...</div>
      ) : keys.length === 0 ? (
        <p className="security-key-manager__empty">
          No security keys registered. Register one for passwordless login.
        </p>
      ) : (
        <div className="security-key-manager__list">
          {keys.map(key => (
            <div key={key.id} className="security-key-manager__item">
              {renamingKeyId === key.id ? (
                <div className="security-key-manager__rename-form">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="security-key-manager__rename-input"
                  />
                  <button
                    onClick={() => handleRenameKey(key.id)}
                    className="btn btn--sm btn--primary"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setRenamingKeyId(null)}
                    className="btn btn--sm btn--ghost"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="security-key-manager__key-info">
                    <h4 className="security-key-manager__key-name">{key.keyName}</h4>
                    <p className="security-key-manager__key-meta">
                      Registered {new Date(key.registeredAt).toLocaleDateString()}
                      {key.lastUsedAt && (
                        <>
                          {' • Last used '}
                          {new Date(key.lastUsedAt).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="security-key-manager__key-actions">
                    <button
                      onClick={() => {
                        setRenamingKeyId(key.id)
                        setNewName(key.keyName)
                      }}
                      className="btn btn--sm btn--ghost"
                      title="Rename this key"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="btn btn--sm btn--ghost btn--danger"
                      title="Remove this security key"
                    >
                      Revoke
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .security-key-manager {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--surface);
          border-radius: 8px;
        }

        .security-key-manager__header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .security-key-manager__title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .security-key-manager__description {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .security-key-manager__registration {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .security-key-manager__input-group {
          display: flex;
          gap: 0.5rem;
        }

        .security-key-manager__input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 1rem;
        }

        .security-key-manager__input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .security-key-manager__error {
          padding: 0.75rem;
          background: #ffe0e0;
          border-left: 3px solid #ff4444;
          border-radius: 4px;
          color: #c00;
          font-size: 0.875rem;
          margin: 0;
        }

        .security-key-manager__loading {
          text-align: center;
          color: var(--text-muted);
          padding: 1rem 0;
        }

        .security-key-manager__empty {
          text-align: center;
          color: var(--text-muted);
          padding: 1rem 0;
          margin: 0;
        }

        .security-key-manager__list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .security-key-manager__item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--background);
          border-radius: 6px;
        }

        .security-key-manager__key-info {
          flex: 1;
        }

        .security-key-manager__key-name {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .security-key-manager__key-meta {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .security-key-manager__key-actions {
          display: flex;
          gap: 0.5rem;
        }

        .security-key-manager__rename-form {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }

        .security-key-manager__rename-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .btn--danger {
          --hover-opacity: 0.9;
        }

        .btn--danger:hover {
          color: var(--error-color);
          border-color: var(--error-color);
        }
      `}</style>
    </div>
  )
}
