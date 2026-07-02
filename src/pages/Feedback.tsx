import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Send } from 'lucide-react'
import { useI18n } from '../i18n'
import { useToast } from '../contexts/ToastContext'
import { TopBar } from '../components/TopBar'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Field, inputClass } from '../components/form/Field'

const FEEDBACK_FORM_NAME = 'teastash-feedback'
const netlifyAttributes = { 'data-netlify': 'true', 'netlify-honeypot': 'bot-field' }

function appendFormData(formData: FormData): URLSearchParams {
  const params = new URLSearchParams()
  formData.forEach((value, key) => {
    params.append(key, String(value))
  })
  return params
}

export default function Feedback() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!message.trim()) {
      setError(t('feedback.messageRequired'))
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const formData = new FormData(event.currentTarget)
      formData.set('form-name', FEEDBACK_FORM_NAME)
      formData.set('message', message.trim())
      formData.set('page', window.location.href)
      formData.set('appVersion', '1.0.0')

      const response = await fetch('/__forms.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: appendFormData(formData).toString(),
      })

      if (!response.ok) throw new Error('feedback-submit-failed')

      showToast(t('toast.feedbackSent'))
      navigate('/settings')
    } catch {
      setError(t('feedback.submitError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pb-safe-nav">
      <TopBar title={t('feedback.title')} showBack />

      <form
        name={FEEDBACK_FORM_NAME}
        method="POST"
        {...netlifyAttributes}
        className="space-y-4 px-4 pt-4"
        onSubmit={handleSubmit}
      >
        <input type="hidden" name="form-name" value={FEEDBACK_FORM_NAME} />
        <input type="hidden" name="subject" value="TeaStash feedback" />
        <input type="hidden" name="page" value="" />
        <input type="hidden" name="appVersion" value="1.0.0" />
        <p className="hidden">
          <label>
            Bot field
            <input name="bot-field" tabIndex={-1} />
          </label>
        </p>

        <Card className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <MessageSquare size={20} className="mt-0.5 shrink-0 text-matcha" />
            <div>
              <h1 className="text-[20px] font-bold text-ink">{t('feedback.heading')}</h1>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink/60">{t('feedback.body')}</p>
            </div>
          </div>

          <Field label={t('feedback.categoryLabel')}>
            <select className={inputClass} name="category" defaultValue="idea">
              <option value="idea">{t('feedback.categoryIdea')}</option>
              <option value="bug">{t('feedback.categoryBug')}</option>
              <option value="sync">{t('feedback.categorySync')}</option>
              <option value="other">{t('feedback.categoryOther')}</option>
            </select>
          </Field>

          <Field label={t('feedback.ratingLabel')} optional>
            <select className={inputClass} name="rating" defaultValue="">
              <option value="">{t('feedback.ratingPlaceholder')}</option>
              <option value="5">{t('feedback.ratingFive')}</option>
              <option value="4">{t('feedback.ratingFour')}</option>
              <option value="3">{t('feedback.ratingThree')}</option>
              <option value="2">{t('feedback.ratingTwo')}</option>
              <option value="1">{t('feedback.ratingOne')}</option>
            </select>
          </Field>

          <Field label={t('feedback.messageLabel')} error={error ?? undefined}>
            <textarea
              className={`${inputClass} min-h-[132px] resize-none py-3`}
              name="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t('feedback.messagePlaceholder')}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('feedback.nameLabel')} optional>
              <input className={inputClass} name="name" autoComplete="name" />
            </Field>
            <Field label={t('feedback.emailLabel')} optional>
              <input className={inputClass} name="email" type="email" autoComplete="email" />
            </Field>
          </div>
        </Card>

        <div className="pb-4">
          <Button type="submit" fullWidth disabled={isSubmitting}>
            <Send size={18} /> {isSubmitting ? t('feedback.sending') : t('feedback.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}
