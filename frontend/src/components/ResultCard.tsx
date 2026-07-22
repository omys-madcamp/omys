import { Copy, ExternalLink, PartyPopper, Share2, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from './UI'
import { PlaceMapPreview } from './PlaceMapPreview'
import { formatDistance, formatVerified, track, type Room } from '../lib/api'
import { shareToKakaoTalk } from '../lib/kakao'

export function ResultCard({ room }: { room: Room }) {
  const place = room.selected_place!
  const selectionLabel = room.selected_by_nickname
    ? `${room.selected_by_nickname}의 선택 미스터리 스팟`
    : '미스터리 봉인 해제'
  const shareText = `오늘 ${room.participants.length}명이 OMYS 미스터리 스팟에 도전했습니다. ${selectionLabel}, 목적지는 ${place.name}!`
  const shareUrl = `${location.origin}/share/${room.invite_code}`
  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    track('result_shared')
    alert('결과 링크를 복사했어요!')
  }
  const share = async () => {
    try {
      await shareToKakaoTalk({ title: '오늘의 OMYS', description: shareText, url: shareUrl })
      track('result_shared')
      return
    } catch {
      // 카카오 JS 키 미설정 등 — 다음 방법으로 폴백.
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: '오늘의 OMYS', text: shareText, url: shareUrl })
      } catch {
        // 사용자가 공유 시트를 취소한 경우 등 — 조용히 무시.
      }
    } else {
      await copy()
    }
    track('result_shared')
  }
  return (
    <section className="result-wrap">
      <div className="confetti" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="result-card">
        <div className="result-card__top">
          <span>
            <PartyPopper />
          </span>
          <small>{selectionLabel}</small>
          <h1>
            오늘의 스팟을
            <br />
            찾았습니다!
          </h1>
        </div>
        <div className="place-reveal">
          <PlaceMapPreview latitude={place.latitude} longitude={place.longitude} name={place.name} />
          <div className="place-reveal__body">
            <small>{place.category}</small>
            <h2>{place.name}</h2>
            <p>{place.address}</p>
            <div className="place-reveal__meta">
              <span>{formatDistance(place.distance_meters)}</span>
              <span>
                {room.selected_by_nickname
                  ? `${room.selected_by_nickname} 추천`
                  : room.mode === 'friends'
                    ? '친구 추천'
                    : 'OMYS 추천'}
              </span>
              <span>{room.participants.length}명</span>
            </div>
          </div>
        </div>
        <div className="verified">
          <Sparkles size={16} /> {formatVerified(room.opening_verified_at)}
        </div>
        {place.place_url && (
          <a className="official-link" href={place.place_url} target="_blank" rel="noreferrer">
            공식 장소 정보 확인 <ExternalLink size={16} />
          </a>
        )}
        {place.phone && (
          <a className="official-link" href={`tel:${place.phone}`}>
            전화로 영업 확인 · {place.phone}
          </a>
        )}
        <blockquote>“계획하지 않아서 더 기억에 남는 오늘.”</blockquote>
        <div className="share-actions">
          <Button onClick={share}>
            <Share2 size={18} /> 결과 공유하기
          </Button>
          <Button variant="secondary" onClick={copy}>
            <Copy size={18} /> 링크 복사
          </Button>
        </div>
      </div>
      <div className="result-summary">
        <Users size={19} />
        <span>
          오늘 <b>{room.participants.length}명</b>이 함께한 미스터리 외출
        </span>
      </div>
      <Link className="button button--ghost" to="/">
        다시 OMYS 방 만들기
      </Link>
    </section>
  )
}
