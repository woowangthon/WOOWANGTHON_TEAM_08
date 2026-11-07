"use client"
import { useEffect, useRef, useState } from "react"
import "./find-page.css"

/**
 * 상담기관 찾기 화면의 지도 영역 (네이버 지도 JavaScript API v3).
 *
 * - 키: .env.local 의 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID (네이버 클라우드 콘솔의 Maps 클라이언트 ID)
 * - items: 지도에 찍을 기관 목록. { id, title, lat, lng } 가 있는 항목만 마커로 표시해요.
 * - selectedId / onSelect: 목록에서 고른 기관과 마커를 서로 연결해요.
 */
const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
const SCRIPT_URL = "https://oapi.map.naver.com/openapi/v3/maps.js"

// 스크립트는 한 번만 불러와요 (화면을 오가도 다시 불러오지 않게)
let scriptPromise = null
function loadNaverMaps() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"))
  if (window.naver?.maps) return Promise.resolve(window.naver.maps)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      // 키가 잘못됐거나 사이트 주소가 등록되지 않았을 때 네이버가 부르는 함수
      window.navermap_authFailure = () => reject(new Error("auth"))
      const script = document.createElement("script")
      script.src = `${SCRIPT_URL}?ncpKeyId=${encodeURIComponent(CLIENT_ID)}`
      script.async = true
      script.onload = () => resolve(window.naver.maps)
      script.onerror = () => reject(new Error("load"))
      document.head.appendChild(script)
    }).catch((error) => {
      scriptPromise = null
      throw error
    })
  }
  return scriptPromise
}

const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 }

export function DirectoryMap({ className = "", items = [], selectedId = null, onSelect }) {
  const canvasRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map())
  const onSelectRef = useRef(onSelect)
  const [status, setStatus] = useState(CLIENT_ID ? "loading" : "nokey")

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  // 1. 지도 만들기 (한 번만)
  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false
    loadNaverMaps()
      .then((maps) => {
        if (cancelled || !canvasRef.current) return
        // 인증 실패(키·사이트 주소·Dynamic Map 선택 문제)는 스크립트가 로드된 뒤에 알려줘요.
        window.navermap_authFailure = () => {
          if (!cancelled) setStatus("auth")
        }
        mapRef.current = new maps.Map(canvasRef.current, {
          center: new maps.LatLng(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng),
          zoom: 11,
        })
        setStatus("ready")
      })
      .catch((error) => {
        if (!cancelled) setStatus(error.message === "auth" ? "auth" : "error")
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 지도 칸의 크기가 바뀌면(처음 배치, 화면 크기 변경) 지도 크기를 다시 재요.
  useEffect(() => {
    const canvas = canvasRef.current
    if (status !== "ready" || !canvas || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => mapRef.current?.autoResize())
    observer.observe(canvas)
    mapRef.current?.autoResize()
    return () => observer.disconnect()
  }, [status])

  // 2. 기관 목록이 바뀔 때마다 마커 다시 그리기
  useEffect(() => {
    const map = mapRef.current
    if (status !== "ready" || !map) return
    const maps = window.naver.maps

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current.clear()

    const located = items.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
    const points = located.map((item) => {
      const position = new maps.LatLng(item.lat, item.lng)
      const marker = new maps.Marker({ map, position, title: item.title })
      maps.Event.addListener(marker, "click", () => onSelectRef.current?.(item.id))
      markersRef.current.set(item.id, marker)
      return position
    })

    if (points.length === 1) {
      map.setCenter(points[0])
      map.setZoom(14)
    } else if (points.length > 1) {
      map.fitBounds(points)
    }
  }, [items, status])

  // 3. 목록에서 고른 기관으로 지도 이동
  useEffect(() => {
    const map = mapRef.current
    if (status !== "ready" || !map) return
    markersRef.current.forEach((marker, id) => marker.setZIndex(id === selectedId ? 100 : 0))
    const selected = items.find((item) => item.id === selectedId)
    if (selected && Number.isFinite(selected.lat) && Number.isFinite(selected.lng)) {
      map.panTo(new window.naver.maps.LatLng(selected.lat, selected.lng))
    }
  }, [selectedId, items, status])

  const hasLocation = items.some((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
  const note = {
    nokey: ["지도 키가 아직 없어요", "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 를 .env.local 에 넣어 주세요."],
    auth: ["지도 인증에 실패했어요", "클라이언트 ID와 등록한 사이트 주소(localhost 포함)를 확인해 주세요."],
    error: ["지도를 불러오지 못했어요", "잠시 뒤 다시 시도해 주세요."],
    loading: ["지도를 불러오는 중이에요", ""],
    empty: ["지도에 표시할 위치가 아직 없어요", "위치 정보가 있는 기관이 생기면 여기에 표시돼요."],
  }[status !== "ready" ? status : hasLocation ? "" : "empty"]

  return (
    <div className={`dir-map ${className}`}>
      <div ref={canvasRef} id="directory-map" className="dir-map-canvas" />
      {note && (
        <div className="dir-map-note">
          <p>
            <strong>{note[0]}</strong>
            {note[1]}
          </p>
        </div>
      )}
    </div>
  )
}
