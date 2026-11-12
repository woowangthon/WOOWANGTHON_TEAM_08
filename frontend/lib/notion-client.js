// 브라우저에서 Notion으로 다녀오는 동안 메모와 확인용 값(state)을 잠깐 보관하는 도우미예요.
// localStorage에 15분만 두고, 쓰면 바로 지워요. 서버로는 전송되지 않아요.
export const MEMO_KEY = "maeumgyeol:notion-memo"
export const STATE_KEY = "maeumgyeol:notion-state"
export const RESULT_KEY = "maeumgyeol:notion-result"
const TTL_MS = 15 * 60 * 1000

export function putTemp(key, value) {
  localStorage.setItem(key, JSON.stringify({ value, at: Date.now() }))
}

// 값을 지우지 않고 읽어요. 없거나 15분이 지났으면 null이에요.
export function peekTemp(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.value !== "string" || Date.now() - parsed.at > TTL_MS) return null
    return parsed.value
  } catch {
    return null
  }
}

export function clearTemp(key) {
  try {
    localStorage.removeItem(key)
  } catch {}
}
