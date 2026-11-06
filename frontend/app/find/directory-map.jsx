"use client"
import "./find-page.css"
/**
 * 상담기관 찾기 화면의 지도 영역.
 *
 * 지금은 지도 API가 연결되지 않은 자리 표시입니다.
 * 카카오 지도 등을 붙일 때는 `id="directory-map"` div를 지도 컨테이너로 쓰면 돼요.
 * 스타일은 find-page.css 의 .dir-map 에 있어요.
 */
export function DirectoryMap({ className = "" }) {
  return (
    <div className={`dir-map ${className}`}>
      <div id="directory-map" className="dir-map-canvas" />
      <div className="dir-map-note">
        <p>
          <strong>지도는 곧 연결돼요</strong>
          연결되면 내 주변 기관이 여기에 표시돼요.
        </p>
      </div>
    </div>
  )
}
