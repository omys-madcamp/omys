import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Conditions } from '../components/Conditions'

describe('Conditions', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )
  })

  it('MVP 이동 수단을 도보로 제한하고 불필요한 조건을 표시하지 않는다', () => {
    render(<Conditions code="ROOM123" token="participant-token" onSelected={vi.fn()} />)

    expect(screen.getByRole('button', { name: '도보' })).toBeEnabled()
    expect(screen.getByRole('button', { name: /대중교통/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /자동차/ })).toBeDisabled()
    expect(screen.getByText('대중교통과 자동차는 아직 구현되지 않았어요.')).toBeInTheDocument()
    expect(screen.queryByText('1인 예산')).not.toBeInTheDocument()
    expect(screen.queryByText('참가 인원')).not.toBeInTheDocument()
    expect(screen.queryByText('피하고 싶은 활동')).not.toBeInTheDocument()
  })

  it('추천 요청을 항상 도보 조건으로 전송한다', async () => {
    const user = userEvent.setup()
    const onSelected = vi.fn()
    render(<Conditions code="ROOM123" token="participant-token" onSelected={onSelected} />)

    await user.click(screen.getByRole('button', { name: /비밀 스팟 뽑기/ }))

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    const [, options] = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(String(options?.body))
    expect(body.transport_mode).toBe('walk')
    expect(body).not.toHaveProperty('budget_per_person')
    expect(body).not.toHaveProperty('party_size')
    expect(body).not.toHaveProperty('excluded_activities')
    expect(onSelected).toHaveBeenCalledOnce()
  })
})
