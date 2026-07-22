import { useEffect, useRef, useState } from 'react'
import { loadKakaoMaps } from '../lib/kakao'

export function PlaceMapPreview({
  latitude,
  longitude,
  name,
}: {
  latitude: number
  longitude: number
  name: string
}) {
  const mapElement = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    const pendingMaps = loadKakaoMaps()
    if (!pendingMaps) {
      setFailed(true)
      return
    }
    pendingMaps
      .then((maps) => {
        if (!active || !mapElement.current) return
        const center = new maps.LatLng(latitude, longitude)
        const map = new maps.Map(mapElement.current, { center, level: 4 })
        new maps.Marker({ position: center, map })
        map.setDraggable(false)
        map.setZoomable(false)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [latitude, longitude])

  if (failed) return null
  return (
    <div
      ref={mapElement}
      className="place-map-preview"
      role="img"
      aria-label={`${name} 위치 지도`}
    />
  )
}
