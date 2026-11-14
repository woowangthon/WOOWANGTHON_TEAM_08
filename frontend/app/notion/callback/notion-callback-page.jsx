"use client"
import { useEffect, useState } from "react"
import { ArrowRight, CircleAlert, ExternalLink, LoaderCircle } from "lucide-react"
import { ActionLink } from "@/components/action-link"
import { Card, CardContent } from "@/components/ui/card"
import { clearTemp, MEMO_KEY, peekTemp, putTemp, RESULT_KEY, STATE_KEY } from "@/lib/notion-client"
import "./notion-callback-page.css"

// Notion이 돌려보낸 일회용 코드는 한 번만 쓸 수 있어요.
// 개발 모드에서는 화면이 두 번 만들어지기도 해서, 저장 작업은 이 파일 안에서 딱 한 번만 하고
// 결과를 모든 화면이 함께 써요. (컴포넌트 안의 ref는 다시 만들어질 때 초기화돼서 막지 못해요)
let savePromise = null

// 이미 저장이 끝난 코드라면 그 결과 주소를 돌려줘요. (페이지가 다시 열려도 성공 화면을 보여주기 위해서)
function readResult(code) {
  const raw = peekTemp(RESULT_KEY)
  if (!raw || !code) return null
  try {
    const saved = JSON.parse(raw)
    return saved?.code === code && typeof saved.pageUrl === "string" ? saved.pageUrl : null
  } catch {
    return null
  }
}

// 같은 코드를 다른 화면이 저장하는 중일 수 있어서 잠깐 기다려 봐요.
async function waitForResult(code) {
  for (let index = 0; index < 20; index += 1) {
    const pageUrl = readResult(code)
    if (pageUrl) return pageUrl
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  return null
}

function finish() {
  clearTemp(MEMO_KEY)
  clearTemp(STATE_KEY)
}

async function runSave() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get("code")
  const state = params.get("state")

  const doneUrl = readResult(code)
  if (doneUrl) return { status: "done", pageUrl: doneUrl }

  const savedState = peekTemp(STATE_KEY)
  const memo = peekTemp(MEMO_KEY)

  if (params.get("error")) {
    finish()
    return {
      status: "error",
      message: "Notion 연결을 허용하지 않아서 저장하지 않았어요. 메모는 그대로 복사해서 쓸 수 있어요.",
      reason: `notion-${params.get("error")}`,
    }
  }
  // 어느 확인에서 막혔는지 알 수 있게 이유 코드를 함께 보여줘요. (값 자체는 보여주지 않아요)
  const failed = !code
    ? "no-code-in-url"
    : !state
      ? "no-state-in-url"
      : !savedState
        ? "no-saved-state"
        : state !== savedState
          ? "state-mismatch"
          : ""
  if (failed) {
    const lateUrl = code ? await waitForResult(code) : null
    if (lateUrl) return { status: "done", pageUrl: lateUrl }
    finish()
    return {
      status: "error",
      message: "연결 정보를 확인하지 못했어요. 메모 화면에서 다시 시도해 주세요.",
      reason: failed,
    }
  }
  if (!memo) {
    finish()
    return {
      status: "error",
      message: "저장할 메모를 찾지 못했어요. 메모를 다시 만든 뒤 시도해 주세요.",
      reason: "no-saved-memo",
    }
  }

  try {
    const response = await fetch("/api/notion/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, memo }),
    })
    const result = await response.json()
    if (!response.ok || typeof result?.url !== "string") {
      throw new Error(typeof result?.error === "string" ? result.error : "")
    }
    putTemp(RESULT_KEY, JSON.stringify({ code, pageUrl: result.url }))
    finish()
    return { status: "done", pageUrl: result.url }
  } catch (error) {
    const lateUrl = await waitForResult(code)
    if (lateUrl) return { status: "done", pageUrl: lateUrl }
    finish()
    return {
      status: "error",
      message: error instanceof Error && error.message ? error.message : "Notion에 저장하지 못했어요.",
      reason: "save-failed",
    }
  }
}

// Notion에서 "허용"을 누르면 이 주소로 돌아와요. (주소 끝에 일회용 코드가 붙어 있어요)
export function NotionCallbackPage() {
  const [result, setResult] = useState({ status: "working" })

  useEffect(() => {
    let active = true
    savePromise ??= runSave()
    savePromise.then((next) => {
      if (active) setResult(next)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="notion-callback">
      <Card className="surface-card">
        <CardContent className="notion-callback-body">
          {result.status === "working" && (
            <>
              <LoaderCircle className="notion-callback-spin" aria-hidden="true" />
              <h1>Notion에 메모를 만들고 있어요</h1>
              <p role="status">잠시만 기다려 주세요. 이 창을 닫지 말아 주세요.</p>
            </>
          )}
          {result.status === "done" && (
            <>
              <h1>내 Notion에 저장했어요</h1>
              <p>Notion 최상위에 “상담 전 마음 메모” 페이지가 만들어졌어요.</p>
              <a className="notion-callback-link" href={result.pageUrl} target="_blank" rel="noreferrer">
                Notion에서 열기 <ExternalLink aria-hidden="true" />
              </a>
              <ActionLink href="/summary" variant="outline">
                메모 화면으로 <ArrowRight aria-hidden="true" />
              </ActionLink>
            </>
          )}
          {result.status === "error" && (
            <>
              <CircleAlert className="notion-callback-warn" aria-hidden="true" />
              <h1>Notion에 저장하지 못했어요</h1>
              <p role="alert">{result.message}</p>
              {result.reason && <p className="notion-callback-reason">원인 코드: {result.reason}</p>}
              <ActionLink href="/summary" variant="outline">
                메모 화면으로 <ArrowRight aria-hidden="true" />
              </ActionLink>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
