"use client"
import { useMemo, useState } from "react"
import { ArrowUpRight, ChevronDown, MapPin, Search } from "lucide-react"
import { DirectoryMap } from "./directory-map"
import { PageHeading } from "@/components/page-heading"
import "./find-page.css"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
const resources = [
  {
    id: "local-center",
    title: "정신건강복지센터",
    kind: "공공",
    region: "전국",
    location: "시·군·구별 지역 센터",
    summary: "초기 상담과 정신건강 정보, 지역 내 전문기관 연결 방법을 확인할 수 있어요.",
    services: ["초기 상담", "정보 안내", "지역 연계"],
    modes: ["대면", "전화"],
    costKind: "확인",
    costLabel: "비용·운영 방식은 센터별 확인",
    bookingKind: "기관별 확인",
    bookingLabel: "방문 전 운영 시간 문의 권장",
    audience: "센터 관할 지역 주민 등. 이용 범위는 지역 센터에 문의해 주세요.",
    href: "https://www.mentalhealth.go.kr/",
    linkLabel: "국가정신건강정보포털",
  },
  {
    id: "mind-investment",
    title: "전국민 마음투자 지원사업",
    kind: "바우처",
    region: "전국",
    location: "지역별 신청·제공기관 확인",
    summary: "전문 심리상담 이용 지원 정보를 살펴보고, 현재 신청 요건과 제공기관을 확인해요.",
    services: ["전문 심리상담", "바우처 안내"],
    modes: ["대면"],
    costKind: "바우처",
    costLabel: "지원 기준·본인 부담 최신 공고 확인",
    bookingKind: "예약 필요",
    bookingLabel: "신청 절차와 이용기관 예약 확인",
    audience: "대상·신청 경로·증빙 기준은 현행 사업 안내에서 확인해 주세요.",
    href: "https://www.bokjiro.go.kr/ssis-tbu/index.do",
    linkLabel: "복지로 공식 안내",
  },
  {
    id: "seoul-youth",
    title: "서울 청년 마음건강 지원",
    kind: "청년 지원",
    region: "서울",
    location: "서울시 청년정책 안내",
    summary: "서울시 청년을 위한 마음건강 사업의 모집 여부와 신청 정보를 확인해요.",
    services: ["청년 심리상담", "마음건강 프로그램"],
    modes: ["대면", "온라인"],
    costKind: "바우처",
    costLabel: "사업·모집 공고별 확인",
    bookingKind: "예약 필요",
    bookingLabel: "모집 기간과 신청 절차 확인",
    audience: "거주·연령·모집 기준은 각 공고에서 확인해 주세요.",
    href: "https://youth.seoul.go.kr/",
    linkLabel: "서울청년포털 공식 안내",
  },
  {
    id: "mindinfo",
    title: "민간 심리상담 전문가 찾기",
    kind: "민간 상담",
    region: "전국",
    location: "지역·상담 분야별 검색",
    summary: "상담자의 전문 분야와 자격, 상담 방식, 비용, 예약 조건을 직접 확인해요.",
    services: ["개인 상담", "상담자 정보 확인"],
    modes: ["대면", "온라인"],
    costKind: "상이",
    costLabel: "상담자·기관별 비용 상이",
    bookingKind: "예약 필요",
    bookingLabel: "상담자에게 예약 가능 여부 문의",
    audience: "상담자 자격과 경험, 상담 방식이 나에게 맞는지 비교해 보세요.",
    href: "https://mindinfo.kr/",
    linkLabel: "심리상담 정보 플랫폼",
  },
]
const kinds = ["전체", "공공", "바우처", "청년 지원", "민간 상담"]
const regions = ["전체 지역", "서울", "경기", "인천", "부산", "대구", "광주", "대전", "기타"]
function FilterSelect({ id, label, value, options, onChange, hideLabel = false }) {
  return (
    <label htmlFor={id} className="dir-field">
      <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="dir-select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
export function FindPage() {
  const [region, setRegion] = useState("전체 지역")
  const [kind, setKind] = useState("전체")
  const [mode, setMode] = useState("전체 방식")
  const [cost, setCost] = useState("전체 비용")
  const [booking, setBooking] = useState("전체")
  const [query, setQuery] = useState("")
  const [showMore, setShowMore] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR")
    return resources.filter((resource) => {
      const matchesRegion =
        region === "전체 지역" || resource.region === "전국" || resource.region === region
      const matchesKind = kind === "전체" || resource.kind === kind
      const matchesMode = mode === "전체 방식" || resource.modes.includes(mode)
      const matchesCost =
        cost === "전체 비용" ||
        (cost === "바우처" && resource.costKind === "바우처") ||
        (cost === "기관별 상이" && resource.costKind === "상이") ||
        (cost === "확인 필요" && resource.costKind === "확인")
      const matchesBooking = booking === "전체" || resource.bookingKind === booking
      const searchable =
        `${resource.title} ${resource.location} ${resource.summary} ${resource.services.join(" ")}`.toLocaleLowerCase(
          "ko-KR",
        )
      return (
        matchesRegion &&
        matchesKind &&
        matchesMode &&
        matchesCost &&
        matchesBooking &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      )
    })
  }, [booking, cost, kind, mode, query, region])
  function resetFilters() {
    setRegion("전체 지역")
    setKind("전체")
    setMode("전체 방식")
    setCost("전체 비용")
    setBooking("전체")
    setQuery("")
  }
  return (
    <div className="dir-page">
      <PageHeading
        eyebrow="상담기관 찾기"
        title="어디서 상담받을 수 있을까요"
        description="지역과 유형으로 좁혀 보고, 마음에 드는 곳은 공식 안내로 이어서 확인해요."
      />

      <section aria-label="조건 선택" className="dir-filters">
        <div className="dir-searchrow">
          <InputGroup className="dir-search">
            <InputGroupAddon align="inline-start" className="dir-search-icon">
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="resource-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="찾는 서비스가 있나요? 예: 초기 상담, 바우처"
              aria-label="기관 또는 서비스 검색"
            />
          </InputGroup>
          <FilterSelect
            id="region-filter"
            label="지역"
            hideLabel
            value={region}
            onChange={setRegion}
            options={regions.map((value) => ({ value, label: value }))}
          />
        </div>
        <div className="dir-chips" role="group" aria-label="기관 유형 필터">
          {kinds.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={kind === item}
              onClick={() => setKind(item)}
              className="dir-chip"
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            aria-expanded={showMore}
            onClick={() => setShowMore((value) => !value)}
            className="dir-more"
          >
            상세 조건
            <ChevronDown aria-hidden="true" className="dir-more-icon" />
          </button>
        </div>
        {showMore && (
          <div className="dir-advanced">
            <FilterSelect
              id="mode-filter"
              label="상담 방식"
              value={mode}
              onChange={setMode}
              options={["전체 방식", "대면", "온라인", "전화"].map((value) => ({
                value,
                label: value,
              }))}
            />
            <FilterSelect
              id="cost-filter"
              label="비용·지원"
              value={cost}
              onChange={setCost}
              options={["전체 비용", "바우처", "기관별 상이", "확인 필요"].map((value) => ({
                value,
                label: value,
              }))}
            />
            <FilterSelect
              id="booking-filter"
              label="예약 여부"
              value={booking}
              onChange={setBooking}
              options={["전체", "예약 필요", "기관별 확인"].map((value) => ({
                value,
                label: value,
              }))}
            />
          </div>
        )}
      </section>

      <div className="dir-layout">
        <section aria-labelledby="results-heading">
          <div className="dir-resultbar">
            <h2 id="results-heading" className="dir-count">
              {filteredResources.length}곳
            </h2>
            <button type="button" onClick={resetFilters} className="dir-reset">
              조건 초기화
            </button>
          </div>

          {filteredResources.length === 0 ? (
            <div className="dir-empty">
              <h3>조건에 맞는 곳이 없어요</h3>
              <p>지역이나 유형을 바꿔서 다시 찾아보세요.</p>
              <button type="button" onClick={resetFilters}>
                조건 모두 지우기
              </button>
            </div>
          ) : (
            <ul className="dir-list">
              {filteredResources.map((resource) => (
                <li
                  key={resource.id}
                  className="dir-card"
                  data-selected={selectedId === resource.id || undefined}
                >
                  <div className="dir-card-meta">
                    <span
                      className="dir-tag"
                      data-tone={
                        resource.kind === "바우처" || resource.kind === "청년 지원"
                          ? "warm"
                          : "plain"
                      }
                    >
                      {resource.kind}
                    </span>
                    <span className="dir-location">{resource.location}</span>
                  </div>
                  <h3 className="dir-card-title">{resource.title}</h3>
                  <p className="dir-card-summary">{resource.summary}</p>
                  <div className="dir-services">
                    {resource.services.map((service) => (
                      <span key={service} className="dir-service">
                        {service}
                      </span>
                    ))}
                  </div>
                  <dl className="dir-facts">
                    <div>
                      <dt>방식</dt>
                      <dd>{resource.modes.join(" · ")}</dd>
                    </div>
                    <div>
                      <dt>비용</dt>
                      <dd>{resource.costLabel}</dd>
                    </div>
                    <div>
                      <dt>예약</dt>
                      <dd>{resource.bookingLabel}</dd>
                    </div>
                  </dl>
                  <p className="dir-audience">이용 대상: {resource.audience}</p>
                  {Number.isFinite(resource.lat) && Number.isFinite(resource.lng) && (
                    <button
                      type="button"
                      onClick={() => setSelectedId(resource.id)}
                      className="dir-mapbtn"
                    >
                      <MapPin aria-hidden="true" />
                      지도에서 보기
                    </button>
                  )}
                  <a
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dir-link"
                  >
                    {resource.linkLabel}
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="dir-notice">
            비용·운영 시간·예약 가능 여부는 바뀔 수 있어요. 가기 전에 공식 안내를 확인해 주세요.
          </p>
        </section>

        <aside aria-label="상담기관 지도" className="dir-aside">
          <DirectoryMap
            className="dir-map--sized"
            items={filteredResources}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>
      </div>

      <div className="dir-footer">
        <p>
          <strong>뭘 골라야 할지 막막하다면</strong> 대화 내용을 메모로 정리해서 가져가 보세요.
        </p>
        <a href="/summary">
          상담 메모 보기 <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
