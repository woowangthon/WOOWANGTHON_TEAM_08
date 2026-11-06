"use client"
import { useState } from "react"
import { ArrowUpRight, Check } from "lucide-react"
import { PageHeading } from "@/components/page-heading"
import "./support-page.css"

const programs = [
  {
    id: "mind-investment",
    title: "전국민 마음투자 지원사업",
    category: "심리상담 바우처",
    description: "전문 심리상담 이용 지원에 관한 신청 요건과 제공기관 안내를 확인해 보세요.",
    audience: "신청 대상과 증빙 기준은 최신 사업 지침·공고에서 확인해 주세요.",
    support: "지원 내용, 본인부담 여부, 이용 회기는 현행 안내에 따라 달라질 수 있어요.",
    route: "복지로 또는 관할 행정복지센터의 신청 안내를 먼저 확인해요.",
    href: "https://www.bokjiro.go.kr/ssis-tbu/index.do",
    linkLabel: "복지로 최신 공고",
  },
  {
    id: "local-youth",
    title: "청년 마음건강 지원",
    category: "지역별 청년정책",
    description: "지자체별 청년 상담·마음건강 사업의 운영 여부와 모집 정보를 살펴봐요.",
    audience: "거주 지역, 연령, 모집 기간 등은 지자체별 공고를 확인해 주세요.",
    support: "상담비 지원, 프로그램, 상담 회기 등 지원 형태는 지역마다 다를 수 있어요.",
    route: "거주지 청년정책 포털이나 지자체 홈페이지에서 현재 모집을 확인해요.",
    href: "https://youth.seoul.go.kr/",
    linkLabel: "서울청년포털(예시)",
  },
  {
    id: "local-center",
    title: "정신건강복지센터 상담·연계",
    category: "지역 공공서비스",
    description: "가까운 지역 센터에서 상담 정보와 전문기관 연계 방법을 문의할 수 있어요.",
    audience: "관할 지역과 서비스 대상은 해당 센터에 직접 문의해 주세요.",
    support: "상담·안내 범위와 비용은 센터 및 서비스에 따라 달라질 수 있어요.",
    route: "국가정신건강정보포털에서 지역 센터를 찾고 운영 시간을 확인해요.",
    href: "https://www.mentalhealth.go.kr/",
    linkLabel: "국가정신건강정보포털",
  },
]
const checklist = [
  "내 거주 지역과 신청 대상 기준 확인하기",
  "상담 필요성을 확인할 자료가 필요한지 확인하기",
  "신분·거주 확인 자료 제출 여부 확인하기",
  "신청서와 개인정보 동의 항목 확인하기",
  "본인 부담, 제공기관, 예약 절차 확인하기",
]
const categories = ["전체", "심리상담 바우처", "지역별 청년정책", "지역 공공서비스"]
export function SupportPage() {
  const [category, setCategory] = useState("전체")
  const visiblePrograms = programs.filter(
    (program) => category === "전체" || program.category === category,
  )
  const [checkedItems, setCheckedItems] = useState({})
  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  function toggleChecklistItem(item) {
    setCheckedItems((current) => ({ ...current, [item]: !current[item] }))
  }
  return (
    <div className="support-page">
      <PageHeading
        eyebrow="지원제도 탐색"
        title="상담비, 지원받을 수 있을까요"
        description="상담 지원 제도를 모아봤어요. 조건과 모집 기간이 다를 수 있으니 신청 전에 공고를 꼭 확인해 주세요."
      />

      <div className="support-layout">
        <section aria-labelledby="program-list-heading">
          <div className="support-chips" role="group" aria-label="제도 유형 필터">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className="support-chip focus-ring"
              >
                {item}
              </button>
            ))}
          </div>
          <h2 id="program-list-heading" className="support-count">
            지원 제도 {visiblePrograms.length}개
          </h2>
          <ul className="support-list">
            {visiblePrograms.map((program) => (
              <li key={program.id} className="support-card">
                <span className="support-tag">{program.category}</span>
                <h3 className="support-card-title">{program.title}</h3>
                <p className="support-card-desc">{program.description}</p>
                <dl className="support-facts">
                  <div>
                    <dt>신청 대상</dt>
                    <dd>{program.audience}</dd>
                  </div>
                  <div>
                    <dt>지원 내용</dt>
                    <dd>{program.support}</dd>
                  </div>
                  <div className="support-fact-wide">
                    <dt>신청 경로</dt>
                    <dd>{program.route}</dd>
                  </div>
                </dl>
                <a
                  href={program.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="support-link focus-ring"
                >
                  {program.linkLabel}
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <p className="support-notice">
            실제 자격·서류·본인부담금은 사업과 지역, 시기에 따라 달라요. 제출 전 공식 공고를 확인해
            주세요.
          </p>
        </section>

        <aside className="support-checklist">
          <div className="support-checklist-head">
            <h2>신청 전에 챙겨볼 것</h2>
            <span>
              {checkedCount}/{checklist.length}
            </span>
          </div>
          <ul className="support-checks">
            {checklist.map((item) => (
              <li key={item}>
                <label className="support-check">
                  <input
                    type="checkbox"
                    checked={Boolean(checkedItems[item])}
                    onChange={() => toggleChecklistItem(item)}
                    className="focus-ring"
                  />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="support-checklist-foot">
            <button type="button" onClick={() => setCheckedItems({})} className="focus-ring">
              <Check aria-hidden="true" /> 체크 지우기
            </button>
            <a href="/find" className="focus-ring">
              기관부터 찾기 <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}
