import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'

import { DepartureLocationPreview } from '../components/DepartureLocationPreview'
import { loadKakaoMaps, type KakaoLocation } from '../lib/kakao'

vi.mock('../lib/kakao', () => ({
  loadKakaoMaps: vi.fn(),
}))

describe('DepartureLocationPreview map selection', () => {
  const handlers: Record<string, () => void> = {}
  let selectedCenter = { getLat: () => 37.5665, getLng: () => 126.978 }

  beforeEach(() => {
    selectedCenter = { getLat: () => 37.5665, getLng: () => 126.978 }
    Object.keys(handlers).forEach((key) => delete handlers[key])

    class LatLng {
      constructor(
        private latitude: number,
        private longitude: number,
      ) {}
      getLat() {
        return this.latitude
      }
      getLng() {
        return this.longitude
      }
    }

    class MapMock {
      relayout() {}
      setCenter() {}
      getCenter() {
        return selectedCenter
      }
    }

    class Geocoder {
      coord2Address(
        _longitude: number,
        _latitude: number,
        callback: (items: unknown[]) => void,
      ) {
        callback([
          {
            road_address: { address_name: '서울 종로구 새문안로 55' },
            address: { address_name: '서울 종로구 신문로2가' },
          },
        ])
      }
    }

    vi.mocked(loadKakaoMaps).mockResolvedValue({
      LatLng,
      Map: MapMock,
      Marker: class {},
      event: {
        addListener: (_target: unknown, type: string, handler: () => void) => {
          handlers[type] = handler
        },
        removeListener: vi.fn(),
      },
      services: { Geocoder },
    } as never)
  })

  afterEach(() => cleanup())

  it('지도 중심을 옮기면 새 주소와 좌표를 다시 확정한다', async () => {
    function Harness() {
      const [location, setLocation] = useState<KakaoLocation>({
        label: '서울시청',
        address: '서울 중구 세종대로 110',
        latitude: 37.5665,
        longitude: 126.978,
      })
      const [confirmed, setConfirmed] = useState(true)

      return (
        <DepartureLocationPreview
          location={location}
          confirmed={confirmed}
          onMoveStart={() => setConfirmed(false)}
          onLocationChange={setLocation}
          onConfirm={() => setConfirmed(true)}
        />
      )
    }

    const user = userEvent.setup()
    render(<Harness />)
    expect(await screen.findByText('지도를 움직여 위치를 조정하세요')).toBeInTheDocument()

    act(() => handlers.dragstart())
    expect(screen.getByText('위치를 확인하고 있어요…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /이곳이 맞아요/ })).toBeDisabled()

    selectedCenter = { getLat: () => 37.5709, getLng: () => 126.9727 }
    act(() => handlers.dragend())

    expect(await screen.findAllByText('서울 종로구 새문안로 55')).toHaveLength(2)
    expect(screen.getByText('37.57090, 126.97270')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /이곳이 맞아요/ }))
    expect(screen.getByText('출발 위치로 확정했어요')).toBeInTheDocument()
  })
})
