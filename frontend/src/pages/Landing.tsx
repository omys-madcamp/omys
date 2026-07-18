import { BookOpen, ChevronDown, LockKeyhole, Map, Sparkles, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo, Shell } from '../components/UI'
import { track } from '../lib/api'
import { useEffect } from 'react'

export default function Landing() {
  useEffect(() => {
    track('landing_view')
  }, [])
  return (
    <Shell wide>
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow">
            <Sparkles size={15} /> 계획 없는 오늘을 위한 작은 모험
          </span>
          <Logo />
          <h1>
            목적지는 비밀.
            <br />
            <em>설렘만 챙겨요.</em>
          </h1>
          <p>
            친구들의 아이디어를 몰래 모으거나, OMYS에게 오늘의 장소를 맡겨 보세요. 도착할 때까지
            정답은 봉인됩니다.
          </p>
          <div className="hero__actions">
            <Link
              className="button button--primary"
              to="/create?mode=friends"
              onClick={() => track('mode_selected', undefined, { mode: 'friends' })}
            >
              친구들과 시작하기
            </Link>
            <Link
              className="button button--primary"
              to="/create?mode=omys"
              onClick={() => track('mode_selected', undefined, { mode: 'omys' })}
            >
              OMYS가 골라주기
            </Link>
          </div>
        </div>
        <div className="mystery-visual" aria-hidden="true">
          <div className="orbit orbit--one" />
          <div className="orbit orbit--two" />
          <div className="sealed-card">
            <span className="sealed-card__pin">
              <Map size={30} />
            </span>
            <small>오늘의 미스터리 스팟</small>
            <strong>?</strong>
            <div className="sealed-card__line" />
            <div className="sealed-card__seal">
              <LockKeyhole size={17} />
            </div>
          </div>
          <span className="floating-chip floating-chip--one">도착하면 공개</span>
          <span className="floating-chip floating-chip--two">두근두근 82%</span>
        </div>
      </section>
      <section className="activity-teaser">
        <span className="activity-teaser__icon">
          <Zap />
        </span>
        <div>
          <strong>⚡ 할 거 없을 때</strong>
          <p>
            친구들과 만났는데 할 게 없나요?
            <br />
            지금 필요한 느낌을 선택하면 OMYS가 바로 할 일을 정해 드려요.
          </p>
        </div>
        <Link
          className="button button--secondary"
          to="/activities"
          onClick={() => track('activity_tab_opened')}
        >
          활동 뽑기
        </Link>
      </section>
      <details className="usage-guide">
        <summary>
          <span className="usage-guide__icon">
            <BookOpen size={20} />
          </span>
          <span>
            <strong>사용법</strong>
            <small>OMYS를 즐기는 방법을 확인해 보세요</small>
          </span>
          <ChevronDown className="usage-guide__chevron" size={20} />
        </summary>
        <div className="usage-guide__content">
          <p>
            <strong>OMYS(오늘의 미스터리 스팟)</strong>는 친구나 연인과의 외출 장소를 랜덤으로 정해
            주는 서비스입니다.
          </p>

          <section>
            <h3>친구들과 시작하기</h3>
            <ol>
              <li>출발 위치를 설정해요.</li>
              <li>초대방 링크를 공유해 친구를 추가해요.</li>
              <li>하고 싶은 종목에서 고르거나 직접 입력한 뒤 주변 장소를 확인해요.</li>
              <li>모두 준비되면 장소를 추첨해요.</li>
            </ol>
          </section>

          <section>
            <h3>OMYS가 골라주기</h3>
            <ol>
              <li>출발 위치를 설정해요.</li>
              <li>
                장소 숨기기를 설정해요.
                <ul>
                  <li>켜면 미스터리 스팟에 도착할 때까지 장소가 보이지 않아요.</li>
                  <li>끄면 출발 전에 미스터리 스팟을 확인할 수 있어요.</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h3>할 거 없을 때</h3>
            <ul>
              <li>활동 뽑기에서 원하는 분위기 탭을 선택하고 바로 시작해요.</li>
            </ul>
          </section>
        </div>
      </details>
      <p className="landing-foot">회원가입 없이 · 링크 하나로 · 바로 출발</p>
    </Shell>
  )
}
