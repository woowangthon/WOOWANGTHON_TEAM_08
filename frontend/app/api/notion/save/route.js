import {
  createMemoPage,
  exchangeCodeForToken,
  getRedirectUri,
  NotionConfigurationError,
  NotionRequestError,
} from "../../../../lib/server/notion.js"

export const maxDuration = 30

// 같은 코드로 요청이 다시 와도(화면이 두 번 열리는 경우 등) 페이지를 또 만들지 않고 같은 결과를 돌려줘요.
// 메모와 접근 권한은 저장하지 않고, 결과 주소만 10분 동안 이 서버 메모리에 둬요.
const recent = new Map()
const RECENT_MS = 10 * 60 * 1000

function forget() {
  const now = Date.now()
  for (const [key, entry] of recent) {
    if (now - entry.at > RECENT_MS) recent.delete(key)
  }
}

// 일회용 코드와 메모를 받아 사용자의 Notion에 페이지를 만들어요.
export async function POST(request) {
  try {
    const body = await request.json()
    const code = typeof body?.code === "string" ? body.code.trim() : ""
    const memo = typeof body?.memo === "string" ? body.memo.trim() : ""
    if (!code || code.length > 2000 || !memo || memo.length > 8000) {
      return Response.json({ error: "요청을 확인해 주세요." }, { status: 400 })
    }

    forget()
    let entry = recent.get(code)
    if (!entry) {
      const redirectUri = getRedirectUri(request)
      const promise = (async () => {
        const accessToken = await exchangeCodeForToken({ code, redirectUri })
        return createMemoPage({ accessToken, memo })
      })()
      entry = { promise, at: Date.now() }
      recent.set(code, entry)
      // 실패하면 기록을 지워서 다시 시도할 수 있게 해요.
      promise.catch(() => recent.delete(code))
    }
    const url = await entry.promise
    return Response.json({ url })
  } catch (error) {
    if (error instanceof NotionConfigurationError) {
      return Response.json({ error: "Notion 연결 설정이 아직 되어 있지 않아요." }, { status: 500 })
    }
    if (error instanceof NotionRequestError) {
      return Response.json({ error: error.message }, { status: 502 })
    }
    return Response.json({ error: "Notion에 저장하지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 500 })
  }
}
