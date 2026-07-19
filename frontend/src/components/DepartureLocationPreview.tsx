import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ExternalLink, MapPin } from 'lucide-react'
import { loadKakaoMaps, type KakaoLocation, type KakaoMaps } from '../lib/kakao'
import { Button } from './UI'

export function DepartureLocationPreview({
  location,
  confirmed,
  onConfirm,
  onLocationChange,
  onMoveStart,
}: {
  location: KakaoLocation
  confirmed: boolean
  onConfirm: () => void
  onLocationChange: (location: KakaoLocation) => void
  onMoveStart: () => void
}) {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<InstanceType<KakaoMaps['Map']> | null>(null)
  const mapsRef = useRef<KakaoMaps | null>(null)
  const locationRef = useRef(location)
  const onLocationChangeRef = useRef(onLocationChange)
  const onMoveStartRef = useRef(onMoveStart)
  const [mapFailed, setMapFailed] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    locationRef.current = location
    onLocationChangeRef.current = onLocationChange
    onMoveStartRef.current = onMoveStart
  }, [location, onLocationChange, onMoveStart])

  useEffect(() => {
    const map = mapRef.current
    const maps = mapsRef.current
    if (!map || !maps) return
    map.setCenter(new maps.LatLng(location.latitude, location.longitude))
  }, [location.latitude, location.longitude])

  useEffect(() => {
    let active = true
    let requestId = 0
    let map: InstanceType<KakaoMaps['Map']> | null = null
    let removeMapListeners: (() => void) | null = null
    setMapFailed(false)
    setMapReady(false)
    setMoving(false)
    const pendingMaps = loadKakaoMaps()
    if (!pendingMaps) {
      setMapFailed(true)
      return () => {
        active = false
      }
    }

    pendingMaps
      .then((maps) => {
        if (!active || !mapElement.current) return
        const initialLocation = locationRef.current
        const center = new maps.LatLng(initialLocation.latitude, initialLocation.longitude)
        map = new maps.Map(mapElement.current, { center, level: 3 })
        mapRef.current = map
        mapsRef.current = maps
        map.relayout()
        map.setCenter(center)
        setMapReady(true)

        const handleDragStart = () => {
          requestId += 1
          setMoving(true)
          onMoveStartRef.current()
        }
        const handleDragEnd = () => {
          if (!map) return
          const selected = map.getCenter()
          const latitude = selected.getLat()
          const longitude = selected.getLng()
          const currentRequest = ++requestId
          const geocoder = new maps.services.Geocoder()

          geocoder.coord2Address(longitude, latitude, (items) => {
            if (!active || currentRequest !== requestId) return
            const item = items[0]
            const address = item?.road_address?.address_name || item?.address?.address_name
            const fallback = '지도에서 선택한 위치'
            onLocationChangeRef.current({
              label: address || fallback,
              address: address || fallback,
              latitude,
              longitude,
            })
            setMoving(false)
          })
        }

        maps.event.addListener(map, 'dragstart', handleDragStart)
        maps.event.addListener(map, 'dragend', handleDragEnd)

        removeMapListeners = () => {
          if (!map) return
          maps.event.removeListener(map, 'dragstart', handleDragStart)
          maps.event.removeListener(map, 'dragend', handleDragEnd)
        }
      })
      .catch(() => {
        if (active) setMapFailed(true)
      })

    return () => {
      active = false
      requestId += 1
      removeMapListeners?.()
      mapRef.current = null
      mapsRef.current = null
      map = null
    }
  }, [])

  const mapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(location.label)},${location.latitude},${location.longitude}`

  return (
    <section className="departure-preview" aria-label="출발 위치 확인">
      <div className="departure-preview__map-wrap">
        <div
          ref={mapElement}
          className="departure-preview__map"
          aria-label="지도를 움직여 출발 위치 선택"
        />
        {mapReady && (
          <>
            <div className="departure-preview__map-guide">지도를 움직여 위치를 조정하세요</div>
            <div className="departure-preview__center-pin" aria-hidden="true">
              <MapPin size={36} fill="currentColor" />
            </div>
            {moving && <div className="departure-preview__moving">위치를 확인하고 있어요…</div>}
          </>
        )}
        {mapFailed && (
          <div className="departure-preview__fallback">
            <MapPin size={31} />
            <span>선택한 위치</span>
          </div>
        )}
      </div>
      <div className="departure-preview__body">
        <span className="departure-preview__eyebrow">
          <MapPin size={14} /> 출발 위치
        </span>
        <strong>{location.label}</strong>
        <p>{location.address}</p>
        <small>
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </small>
        <a href={mapUrl} target="_blank" rel="noreferrer">
          카카오맵에서 크게 보기 <ExternalLink size={13} />
        </a>
      </div>
      {confirmed ? (
        <div className="departure-preview__confirmed">
          <CheckCircle2 size={18} /> 출발 위치로 확정했어요
        </div>
      ) : (
        <Button type="button" onClick={onConfirm} disabled={moving}>
          <CheckCircle2 size={18} /> 이곳이 맞아요
        </Button>
      )}
    </section>
  )
}
