import { useState } from 'react'
import { Car, Footprints, Sparkles, TrainFront } from 'lucide-react'
import { api } from '../lib/api'
import { Button, Field, Notice } from './UI'

const categories = [
  '게임·실내 놀거리',
  '운동·액티비티',
  '관광·산책',
  '쇼핑·구경',
  '데이트코스·이색 체험',
]
export function Conditions({
  code,
  token,
  onSelected,
}: {
  code: string
  token: string
  onSelected: () => void
}) {
  const [form, setForm] = useState({
    max_travel_minutes: 30,
    preferred_categories: [] as string[],
    indoor_outdoor: 'any',
    includes_food: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toggle = (item: string) =>
    setForm((prev) => ({
      ...prev,
      preferred_categories: prev.preferred_categories.includes(item)
        ? prev.preferred_categories.filter((x) => x !== item)
        : [...prev.preferred_categories, item],
    }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api(
        `/api/rooms/${code}/conditions`,
        {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            transport_mode: 'walk',
          }),
        },
        token,
      )
      onSelected()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '비밀 스팟을 찾지 못했어요. 이동 시간이나 선택 조건을 조금 완화해 주세요.',
      )
    } finally {
      setLoading(false)
    }
  }
  return (
    <form className="stack" onSubmit={submit}>
      <div className="condition-heading">
        <span>
          <Sparkles />
        </span>
        <div>
          <h1 className="page-title">오늘의 기분을 알려주세요</h1>
          <p className="page-subtitle">위치와 이동 시간만 정해도 시작할 수 있어요.</p>
        </div>
      </div>
      <div className="field">
        <span className="field__label">이동 수단</span>
        <div className="segmented">
          {[
            ['walk', '도보', Footprints, false],
            ['transit', '대중교통', TrainFront, true],
            ['car', '자동차', Car, true],
          ].map(([value, label, Icon, disabled]) => {
            const C = Icon as typeof Footprints
            return (
              <button
                type="button"
                key={value as string}
                className={value === 'walk' ? 'active' : ''}
                disabled={disabled as boolean}
              >
                <C size={19} />
                <span>{label as string}</span>
                {disabled ? <small>준비 중</small> : null}
              </button>
            )
          })}
        </div>
        <small>대중교통과 자동차는 아직 구현되지 않았어요.</small>
      </div>
      <Field label={`최대 이동 시간 · ${form.max_travel_minutes}분`}>
        <input
          type="range"
          min="10"
          max="90"
          step="5"
          value={form.max_travel_minutes}
          onChange={(e) => setForm({ ...form, max_travel_minutes: Number(e.target.value) })}
        />
        <div className="range-labels">
          <span>10분</span>
          <span>90분</span>
        </div>
      </Field>
      <Field label="오늘 끌리는 것" hint="여러 개 선택할 수 있어요">
        <div className="choice-grid">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={form.preferred_categories.includes(item) ? 'choice active' : 'choice'}
              onClick={() => toggle(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </Field>
      <Field label="공간 선호">
        <div className="segmented segmented--text">
          {[
            ['any', '상관없음'],
            ['indoor', '실내'],
            ['outdoor', '야외'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={form.indoor_outdoor === value ? 'active' : ''}
              onClick={() => setForm({ ...form, indoor_outdoor: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>
      {error && <Notice tone="warning">{error}</Notice>}
      <Button type="submit" loading={loading}>
        <Sparkles size={19} /> 비밀 스팟 뽑기
      </Button>
    </form>
  )
}
