import { useState } from 'react'
import { Seo } from '../components/Seo'
import { PLANS, upgradePlan, cancelSubscription, getSubscription, applyCoupon, applyGiftCode, getPaymentHistory } from '../services/subscriptionService'
import { useToast } from '../context/ToastContext'

export function PricingPage() {
  const { notify } = useToast()
  const [current, setCurrent] = useState(getSubscription)
  const [coupon, setCoupon] = useState('')
  const [giftCode, setGiftCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const history = getPaymentHistory()

  function handleUpgrade(planId: 'free' | 'plus' | 'pro') {
    const sub = upgradePlan(planId, coupon || undefined)
    setCurrent(sub)
    notify(`Auf ${planId.toUpperCase()} gewechselt! (Demo — keine echte Zahlung)`, 'success')
  }

  function handleCancel() {
    cancelSubscription()
    setCurrent(getSubscription())
    notify('Abo gekündigt', 'info')
  }

  function handleCoupon() {
    const d = applyCoupon(coupon)
    if (d > 0) {
      setDiscount(d)
      notify(`Rabatt ${Math.round(d * 100)}% aktiviert!`, 'success')
    } else {
      notify('Ungültiger Gutschein', 'error')
    }
  }

  function handleGiftCode() {
    if (applyGiftCode(giftCode)) {
      setCurrent(getSubscription())
      notify('Geschenk-Abo aktiviert!', 'success')
    } else {
      notify('Ungültiger Code', 'error')
    }
  }

  return (
    <>
      <Seo title="Premium-Mitgliedschaft" description="GTA 6 News Hub Abo-Pläne." path="/premium" />
      <header className="page-head">
        <h1 className="page-head__title">💎 Premium-Mitgliedschaft</h1>
        <p className="page-head__desc">Aktueller Plan: <strong>{current.planId.toUpperCase()}</strong></p>
      </header>

      <div className="grid" style={{ '--cols': 3 } as React.CSSProperties}>
        {PLANS.map(plan => (
          <div key={plan.id} className={`card${current.planId === plan.id ? ' card--featured' : ''}`}>
            <div className="card__body">
              <h3 className="card__title">{plan.name}</h3>
              <p className="card__meta">
                {plan.price === 0 ? 'Kostenlos' : `€${(plan.price * (1 - discount)).toFixed(2)}/Monat`}
              </p>
              <ul style={{ paddingLeft: '1.25rem', margin: '0.75rem 0' }}>
                {plan.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              {current.planId !== plan.id ? (
                <button className="btn" onClick={() => handleUpgrade(plan.id)}>
                  {plan.price === 0 ? 'Downgraden' : 'Upgraden'}
                </button>
              ) : (
                <span className="badge badge--muted">Aktueller Plan</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '2rem', maxWidth: 480 }}>
        <div className="card__body">
          <h3 className="card__title">Gutschein / Geschenk-Code</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input className="chat__input" value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Gutscheincode" />
            <button className="btn btn--ghost" onClick={handleCoupon}>Anwenden</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="chat__input" value={giftCode} onChange={e => setGiftCode(e.target.value)} placeholder="Geschenk-Code (GTA6-...)" />
            <button className="btn btn--ghost" onClick={handleGiftCode}>Einlösen</button>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Zahlungsverlauf</h3>
          <ul className="hitlist">
            {[...history].reverse().map(r => (
              <li key={r.id} className="hit">
                <div className="hit__meta">
                  <span className={`badge badge--muted${r.status === 'refunded' ? ' badge--error' : ''}`}>{r.status === 'paid' ? '✅ Bezahlt' : '↩️ Erstattet'}</span>
                  <span className="hit__min">{new Date(r.date).toLocaleDateString('de-DE')}</span>
                </div>
                <strong className="hit__title">{r.plan.toUpperCase()} — €{r.amount.toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {current.planId !== 'free' && (
        <div style={{ marginTop: '2rem' }}>
          <button className="btn btn--ghost" onClick={handleCancel}>Abo kündigen</button>
        </div>
      )}
    </>
  )
}
