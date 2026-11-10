import { generateText } from "ai"
import { z } from "zod"
import { getModelConfig, LLMConfigurationError } from "../../../lib/server/llm.js"
import { summaryFocusLabels, summaryInstructions } from "../../../lib/server/prompts.js"
export const maxDuration = 30
const requestSchema = z.object({
  transcript: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(24),
  focus: z.enum(["situation", "feelings", "consultation"]).optional(),
})
export async function POST(request) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: "대화 내용을 확인해 주세요." }, { status: 400 })
    }
    const totalCharacters = parsed.data.transcript.reduce(
      (total, message) => total + message.text.length,
      0,
    )
    if (totalCharacters > 12000) {
      return Response.json({ error: "대화가 너무 길어요." }, { status: 413 })
    }
    const focus = parsed.data.focus ?? "feelings"
    const conversation = parsed.data.transcript
      .map((message) => `${message.role === "user" ? "사용자" : "마음결"}: ${message.text}`)
      .join("\n")
    const result = await generateText({
      ...getModelConfig("summary"),
      instructions: summaryInstructions,
      prompt: `대화 방향: ${summaryFocusLabels[focus]}\n\n아래 대화를 상담 준비 메모로 정리해 주세요. 대화의 일부가 부족해도 추측하지 마세요.\n\n${conversation}`,
      maxOutputTokens: 560,
    })
    return Response.json({ summary: result.text })
  } catch (error) {
    if (error instanceof LLMConfigurationError) {
      return Response.json({ error: error.message }, { status: 500 })
    }
    return Response.json(
      { error: "요약을 준비하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    )
  }
}
