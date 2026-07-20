import type { Place } from './api'

type KakaoPlace = {
  id: string
  place_name: string
  category_name: string
  category_group_name: string
  phone: string
  address_name: string
  road_address_name: string
  x: string
  y: string
  place_url: string
  distance: string
}

type KakaoAddress = {
  address: { address_name: string }
  road_address: { address_name: string } | null
}

export type KakaoLocation = {
  label: string
  address: string
  latitude: number
  longitude: number
}

export type KakaoLatLng = {
  getLat: () => number
  getLng: () => number
}

export type KakaoPoint = {
  getX: () => number
  getY: () => number
}

export type KakaoLatLngBounds = {
  contain: (position: KakaoLatLng) => boolean
  getSouthWest: () => KakaoLatLng
  getNorthEast: () => KakaoLatLng
}

export type KakaoMapProjection = {
  pointFromCoords: (position: KakaoLatLng) => KakaoPoint
}

export type KakaoMap = {
  relayout: () => void
  setCenter: (center: KakaoLatLng) => void
  getCenter: () => KakaoLatLng
  getBounds: () => KakaoLatLngBounds
  getProjection: () => KakaoMapProjection
  getLevel: () => number
  setLevel: (level: number) => void
  setDraggable: (draggable: boolean) => void
  setZoomable: (zoomable: boolean) => void
}

export type KakaoMarker = {
  setMap: (map: KakaoMap | null) => void
  setPosition: (position: KakaoLatLng) => void
  setVisible: (visible: boolean) => void
}

export type KakaoPolyline = {
  setMap: (map: KakaoMap | null) => void
  setPath: (path: KakaoLatLng[]) => void
}

export type KakaoMaps = {
  load: (callback: () => void) => void
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap
  Marker: new (options: { position: KakaoLatLng; map?: KakaoMap }) => KakaoMarker
  Polyline: new (options: {
    path: KakaoLatLng[]
    map?: KakaoMap
    strokeWeight?: number
    strokeColor?: string
    strokeOpacity?: number
    strokeStyle?: string
    zIndex?: number
  }) => KakaoPolyline
  event: {
    addListener: (target: unknown, type: string, handler: () => void) => void
    removeListener: (target: unknown, type: string, handler: () => void) => void
  }
  services: {
    Status: { OK: string; ZERO_RESULT: string }
    SortBy: { DISTANCE: string; ACCURACY: string }
    Places: new () => {
      keywordSearch: (
        query: string,
        callback: (places: KakaoPlace[], status: string) => void,
        options?: {
          location?: unknown
          radius?: number
          size?: number
          sort?: string
        },
      ) => void
    }
    Geocoder: new () => {
      coord2Address: (
        longitude: number,
        latitude: number,
        callback: (addresses: KakaoAddress[], status: string) => void,
      ) => void
    }
  }
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps }
  }
}

let mapsPromise: Promise<KakaoMaps> | null = null

export function loadKakaoMaps(): Promise<KakaoMaps> | null {
  const appKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY?.trim()
  if (!appKey) return null
  if (mapsPromise) return mapsPromise

  mapsPromise = new Promise((resolve, reject) => {
    const ready = () => {
      if (!window.kakao?.maps) {
        reject(
          new Error(
            '카카오맵 API를 사용할 수 없어요. 카카오맵 사용 설정을 ON으로 하고 JavaScript SDK 도메인을 확인해 주세요.',
          ),
        )
        return
      }
      window.kakao.maps.load(() => resolve(window.kakao!.maps))
    }

    if (window.kakao?.maps) {
      ready()
      return
    }

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`
    script.async = true
    script.onload = ready
    script.onerror = () =>
      reject(
        new Error(
          '카카오맵 연결에 실패했어요. 카카오맵 사용 설정을 ON으로 하고 JavaScript SDK 도메인에 http://localhost:5173을 등록해 주세요.',
        ),
      )
    document.head.appendChild(script)
  })

  return mapsPromise
}

export async function searchKakaoLocation(query: string): Promise<KakaoLocation | null> {
  const pendingMaps = loadKakaoMaps()
  if (!pendingMaps) {
    throw new Error('카카오 JavaScript 키가 설정되지 않아 위치를 찾을 수 없어요.')
  }
  const maps = await pendingMaps

  return new Promise((resolve, reject) => {
    const places = new maps.services.Places()
    places.keywordSearch(
      query,
      (items, status) => {
        if (status === maps.services.Status.ZERO_RESULT) {
          resolve(null)
          return
        }
        if (status !== maps.services.Status.OK || !items[0]) {
          reject(new Error('입력한 출발 위치를 찾지 못했어요.'))
          return
        }
        const item = items[0]
        resolve({
          label: item.place_name,
          address: item.road_address_name || item.address_name || item.place_name,
          latitude: Number(item.y),
          longitude: Number(item.x),
        })
      },
      { size: 5, sort: maps.services.SortBy.ACCURACY },
    )
  })
}

export async function describeKakaoCoordinates(
  latitude: number,
  longitude: number,
): Promise<KakaoLocation> {
  const pendingMaps = loadKakaoMaps()
  if (!pendingMaps) {
    return { label: '현재 위치', address: '현재 위치', latitude, longitude }
  }
  const maps = await pendingMaps

  return new Promise((resolve) => {
    const geocoder = new maps.services.Geocoder()
    geocoder.coord2Address(longitude, latitude, (items) => {
      const item = items[0]
      const address = item?.road_address?.address_name || item?.address?.address_name
      resolve({
        label: address || '현재 위치',
        address: address || '현재 위치',
        latitude,
        longitude,
      })
    })
  })
}

export async function searchKakaoPlaces(
  query: string,
  latitude: number,
  longitude: number,
): Promise<Place[] | null> {
  const pendingMaps = loadKakaoMaps()
  if (!pendingMaps) return null
  const maps = await pendingMaps

  return new Promise((resolve, reject) => {
    const places = new maps.services.Places()
    places.keywordSearch(
      query,
      (items, status) => {
        if (status === maps.services.Status.ZERO_RESULT) {
          resolve([])
          return
        }
        if (status !== maps.services.Status.OK) {
          reject(new Error('카카오에서 주변 장소를 찾지 못했어요.'))
          return
        }
        resolve(
          items.map((item) => ({
            external_place_id: `kakao:${item.id}`,
            name: item.place_name,
            category: item.category_name || item.category_group_name || '장소',
            address: item.road_address_name || item.address_name || '주소 정보 없음',
            latitude: Number(item.y),
            longitude: Number(item.x),
            business_status: 'UNKNOWN_KAKAO',
            open_now: null,
            place_url: item.place_url,
            phone: item.phone || null,
            distance_meters: item.distance ? Number(item.distance) : undefined,
          })),
        )
      },
      {
        location: new maps.LatLng(latitude, longitude),
        radius: 10_000,
        size: 15,
        sort: maps.services.SortBy.DISTANCE,
      },
    )
  })
}
