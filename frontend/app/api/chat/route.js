import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, Output, safeValidateUIMessages, streamText } from "ai"
import { z } from "zod"
import { nextChatStage, normalizeChatStage } from "../../../lib/chat-stages.js"
import { getModelConfig, LLMConfigurationError } from "../../../lib/server/llm.js"
import { chatFocusInstructions, chatStageInstructions, getChatInstructions } from "../../../lib/server/prompts.js"
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
    const focus = normalizeChatStage(body.focus)
    const nextFocus = nextChatStage(focus)
    const allowedStages = nextFocus === focus ? [focus] : [focus, nextFocus]
    const modelMessages = await convertToModelMessages(validation.data)
    const result = streamText({
      ...getModelConfig("chat"),
      instructions: [
        getChatInstructions(focus),
        chatStageInstructions[focus],
        nextFocus !== focus
          ? `현재 단계는 ${focus}입니다. 직전 챗봇 답변에서 다음 단계로 넘어가자고 제안했고 사용자가 이번 메시지에서 그 제안에 명확히 동의한 경우에만 replyStage를 ${nextFocus}로 정하세요. 이 경우 이번 답변부터 다음 단계 지침을 적용하고 같은 답변에서 또 다른 전환을 제안하지 마세요. 다음 단계 지침: ${chatFocusInstructions[nextFocus]}
전환 조건이 처음 충족되었거나 사용자가 현재 단계를 건너뛰고 싶어 하면, 다음 단계로 넘어가도 괜찮은지 한 번만 묻고 replyStage는 ${focus}로 유지하세요. 전환을 제안하는 답변에서는 다음 단계의 질문을 함께 하지 마세요.
사용자가 거절하거나 동의가 불분명하면 replyStage를 ${focus}로 유지하세요. 거절한 제안은 반복하지 마세요.`
          : `replyStage는 ${focus}로 유지하세요.`,
        `replyStage는 이번 답변이 실제로 진행하는 단계입니다. 사용자가 더 이야기하고 싶지 않다고 하면 replyStage를 ${focus}로 유지하고 짧게 마무리하세요. 위기 상황에서는 전환을 제안하거나 진행하지 말고 replyStage를 ${focus}로 유지하며 안전 안내를 우선하세요. situation, feelings, consultation 같은 내부 단계 코드는 사용자에게 보여주지 마세요.`,
      ].join("\n\n"),
      messages: modelMessages,
      abortSignal: request.signal,
      output: Output.object({
        schema: z.object({ replyStage: z.enum(allowedStages), reply: z.string() }),
      }),
      maxOutputTokens: 420,
      // Log only the provider status, since the full error can include request details.
      onError({ error }) {
        console.error("Chat generation failed", error?.lastError?.statusCode ?? error?.statusCode ?? "unknown")
      },
    })
    const stream = createUIMessageStream({
      async execute({ writer }) {
        const id = "reply"
        let displayed = ""
        writer.write({ type: "start" })
        writer.write({ type: "text-start", id })
        for await (const partial of result.partialOutputStream) {
          const reply = partial.reply
          if (reply?.startsWith(displayed) && reply.length > displayed.length) {
            writer.write({ type: "text-delta", id, delta: reply.slice(displayed.length) })
            displayed = reply
          }
        }
        const finishReason = await result.finishReason
        const { reply, replyStage } = await result.output
        if (finishReason !== "stop" || !reply.trim() || !reply.startsWith(displayed)) {
          throw new Error("Incomplete chat reply")
        }
        if (reply.length > displayed.length) {
          writer.write({ type: "text-delta", id, delta: reply.slice(displayed.length) })
        }
        writer.write({ type: "text-end", id })
        if (replyStage !== focus) {
          writer.write({ type: "data-chat-stage", data: { from: focus, to: replyStage } })
        }
        writer.write({ type: "finish", finishReason })
      },
      onError(error) {
        const status = error?.lastError?.statusCode ?? error?.statusCode
        return status === 429 || status === 503 ? "CHAT_PROVIDER_UNAVAILABLE" : "CHAT_GENERATION_FAILED"
      },
    })
    return createUIMessageStreamResponse({ stream })
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
