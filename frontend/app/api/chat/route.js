import { convertToModelMessages, safeValidateUIMessages, streamText } from "ai"
import { getModelConfig, LLMConfigurationError } from "../../../lib/server/llm.js"
import { getChatInstructions } from "../../../lib/server/prompts.js"
export const maxDuration = 30
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
function normalizeMessages(input) {
  return input.slice(-24).flatMap((candidate, index) => {
    if (!isRecord(candidate) || !Array.isArray(candidate.parts)) return []
    if (candidate.role !== "user" && candidate.role !== "assistant") return []
    const parts = candidate.parts
      .filter((part) => isRecord(part) && part.type === "text" && typeof part.text === "string")
      .slice(0, 8)
      .map((part) => ({
        type: "text",
        text: String(part.text).slice(0, 2000),
      }))
      .filter((part) => part.text.trim().length > 0)
    if (parts.length === 0) return []
    return [
      {
        id: typeof candidate.id === "string" ? candidate.id.slice(0, 128) : `message-${index}`,
        role: candidate.role,
        parts,
      },
    ]
  })
}
export async function POST(request) {
  try {
    const body = await request.json()
    if (!isRecord(body) || !Array.isArray(body.messages) || body.messages.length > 24) {
      return Response.json({ error: "대화 내용을 확인해 주세요." }, { status: 400 })
    }
    const messages = normalizeMessages(body.messages)
    const latestMessage = messages.at(-1)
    const totalCharacters = messages.reduce(
      (total, message) =>
        total +
        message.parts.reduce(
          (messageTotal, part) => messageTotal + (part.type === "text" ? part.text.length : 0),
          0,
        ),
      0,
    )
    if (messages.length === 0 || latestMessage?.role !== "user" || totalCharacters > 12000) {
      return Response.json({ error: "메시지가 너무 길거나 올바르지 않습니다." }, { status: 400 })
    }
    const validation = await safeValidateUIMessages({ messages })
    if (!validation.success) {
      return Response.json({ error: "대화 내용을 확인해 주세요." }, { status: 400 })
    }
    const focus = body.focus
    const selectedFocus =
      focus === "situation" || focus === "consultation" || focus === "feelings" ? focus : "feelings"
    const result = streamText({
      ...getModelConfig("chat"),
      instructions: getChatInstructions(selectedFocus),
      messages: await convertToModelMessages(validation.data),
      maxOutputTokens: 420,
      // Log only the provider status, since the full error can include request details.
      onError({ error }) {
        console.error("Chat generation failed", error?.lastError?.statusCode ?? error?.statusCode ?? "unknown")
      },
    })
    return result.toUIMessageStreamResponse({
      onError(error) {
        const status = error?.lastError?.statusCode ?? error?.statusCode
        return status === 429 || status === 503 ? "CHAT_PROVIDER_UNAVAILABLE" : "CHAT_GENERATION_FAILED"
      },
    })
  } catch (error) {
    if (error instanceof LLMConfigurationError) {
      return Response.json({ error: error.message }, { status: 500 })
    }
    return Response.json(
      { error: "응답을 준비하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    )
  }
}
