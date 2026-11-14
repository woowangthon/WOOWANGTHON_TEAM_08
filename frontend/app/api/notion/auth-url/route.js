import {
  buildAuthorizeUrl,
  getNotionCredentials,
  getRedirectUri,
  NotionConfigurationError,
} from "../../../../lib/server/notion.js"

// Notion 허용 화면으로 보낼 주소를 만들어 줘요. (client secret은 여기서도 쓰지 않아요)
export async function GET(request) {
  try {
    const state = new URL(request.url).searchParams.get("state") ?? ""
    if (!/^[A-Za-z0-9-]{16,64}$/.test(state)) {
      return Response.json({ error: "요청을 확인해 주세요." }, { status: 400 })
    }
    const { clientId } = getNotionCredentials()
    const url = buildAuthorizeUrl({ clientId, redirectUri: getRedirectUri(request), state })
    return Response.json({ url })
  } catch (error) {
    if (error instanceof NotionConfigurationError) {
      return Response.json({ error: "Notion 연결 설정이 아직 되어 있지 않아요." }, { status: 500 })
    }
    return Response.json({ error: "Notion 연결을 준비하지 못했어요." }, { status: 500 })
  }
}
