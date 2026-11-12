/**
 * Notion 연동(서버 전용).
 * - 사용자가 Notion에서 "허용"하면 받는 일회용 코드(code)를 접근 권한(token)으로 바꾸고,
 * - 그 권한으로 사용자 본인의 Notion에 메모 페이지를 한 장 만들어요.
 * 권한(token)과 메모는 저장하지 않고 이 요청 안에서만 쓰고 버려요.
 */

const NOTION_API = "https://api.notion.com/v1"
const NOTION_VERSION = process.env.NOTION_VERSION?.trim() || "2026-03-11"
const TEXT_LIMIT = 1900 // Notion은 글 한 덩어리를 2000자까지만 받아요.
const BLOCK_LIMIT = 100 // 페이지를 만들 때 한 번에 보낼 수 있는 블록 수

export class NotionConfigurationError extends Error {
  constructor(message) {
    super(message)
    this.name = "NotionConfigurationError"
  }
}

export class NotionRequestError extends Error {
  constructor(message, status) {
    super(message)
    this.name = "NotionRequestError"
    this.status = status
  }
}

export function getNotionCredentials() {
  const clientId = process.env.NOTION_CLIENT_ID?.trim()
  const clientSecret = process.env.NOTION_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) {
    throw new NotionConfigurationError("NOTION_CLIENT_ID 또는 NOTION_CLIENT_SECRET이 설정되지 않았습니다.")
  }
  return { clientId, clientSecret }
}

// Notion이 허용 후 돌려보낼 주소. Notion 개발자 포털에 등록한 주소와 한 글자도 다르면 안 돼요.
export function getRedirectUri(request) {
  const fixed = process.env.NOTION_REDIRECT_URI?.trim()
  if (fixed) return fixed
  const url = new URL(request.url)
  const host = request.headers.get("x-forwarded-host") || url.host
  const protocol = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "")
  return `${protocol}://${host}/notion/callback`
}

export function buildAuthorizeUrl({ clientId, redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    owner: "user",
    redirect_uri: redirectUri,
    state,
  })
  return `${NOTION_API}/oauth/authorize?${params.toString()}`
}

// 일회용 코드 → 접근 권한(token)
export async function exchangeCodeForToken({ code, redirectUri }) {
  const { clientId, clientSecret } = getNotionCredentials()
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const response = await fetch(`${NOTION_API}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || typeof data?.access_token !== "string") {
    // 오류 본문에는 요청 정보가 섞일 수 있어서 상태 코드만 남겨요.
    console.error("Notion token exchange failed", response.status)
    throw new NotionRequestError("Notion 연결을 확인하지 못했어요.", response.status)
  }
  return data.access_token
}

// ── 메모(마크다운 모양 글) → Notion 블록 ─────────────
function richText(text) {
  const chunks = []
  for (let index = 0; index < text.length; index += TEXT_LIMIT) {
    chunks.push({ type: "text", text: { content: text.slice(index, index + TEXT_LIMIT) } })
  }
  return chunks.length > 0 ? chunks : [{ type: "text", text: { content: " " } }]
}

function block(type, text) {
  return { object: "block", type, [type]: { rich_text: richText(text) } }
}

export function memoToBlocks(memo) {
  const blocks = []
  for (const rawLine of memo.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const heading = line.match(/^#{1,6}\s+(.+)$/)
    if (heading) {
      blocks.push(block("heading_3", heading[1].trim()))
      continue
    }
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/)
    if (bullet) {
      blocks.push(block("bulleted_list_item", bullet[1].trim()))
      continue
    }
    blocks.push(block("paragraph", line))
  }
  return blocks
}

function formatDate(date) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const pick = (type) => parts.find((part) => part.type === type)?.value ?? ""
  return `${pick("year")}-${pick("month")}-${pick("day")}`
}

function notionHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  }
}

// 사용자가 Notion 허용 화면에서 "공유하기로 고른 페이지"를 찾아요.
// 연결이 볼 수 있는 페이지 중, 부모도 목록에 있는 하위 페이지를 빼고 남은 "맨 위 페이지"가
// 정확히 하나일 때만 그 페이지를 써요. 여러 개이거나 확인할 수 없으면 null이에요.
async function findSharedPageId(accessToken) {
  try {
    const response = await fetch(`${NOTION_API}/search`, {
      method: "POST",
      headers: notionHeaders(accessToken),
      body: JSON.stringify({ filter: { property: "object", value: "page" }, page_size: 100 }),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok || !Array.isArray(data?.results) || data.has_more) return null
    const pages = data.results.filter((item) => item?.object === "page" && !item.archived && !item.in_trash)
    const ids = new Set(pages.map((item) => item.id))
    const roots = pages.filter((item) => !(item.parent?.type === "page_id" && ids.has(item.parent.page_id)))
    return roots.length === 1 ? roots[0].id : null
  } catch {
    return null
  }
}

async function postPage({ accessToken, parent, title, children }) {
  const response = await fetch(`${NOTION_API}/pages`, {
    method: "POST",
    headers: notionHeaders(accessToken),
    body: JSON.stringify({
      parent,
      properties: { title: { title: [{ text: { content: title } }] } },
      children,
    }),
  })
  const data = await response.json().catch(() => null)
  return { ok: response.ok && typeof data?.url === "string", status: response.status, code: data?.code, url: data?.url }
}

// 사용자가 고른 페이지 아래에 메모 페이지를 만들고 그 주소를 돌려줘요.
// 고른 페이지를 확인할 수 없으면 Notion 최상위(개인 페이지)에 만들어요.
export async function createMemoPage({ accessToken, memo }) {
  const children = [
    block("paragraph", "마음결에서 정리한 상담 준비 메모예요. AI가 대화를 바탕으로 정리한 참고 자료이며 진단이나 평가가 아니에요."),
    ...memoToBlocks(memo),
  ].slice(0, BLOCK_LIMIT)
  const title = `상담 전 마음 메모 (${formatDate(new Date())})`

  const sharedPageId = await findSharedPageId(accessToken)
  if (sharedPageId) {
    const inPage = await postPage({ accessToken, parent: { type: "page_id", page_id: sharedPageId }, title, children })
    if (inPage.ok) return inPage.url
    console.error("Notion page creation under shared page failed", inPage.status, inPage.code ?? "unknown")
  }

  const atTop = await postPage({ accessToken, parent: { type: "workspace", workspace: true }, title, children })
  if (!atTop.ok) {
    console.error("Notion page creation failed", atTop.status, atTop.code ?? "unknown")
    throw new NotionRequestError("Notion에 메모를 만들지 못했어요.", atTop.status)
  }
  return atTop.url
}
