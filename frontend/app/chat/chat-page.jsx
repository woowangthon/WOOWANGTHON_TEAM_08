"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ClipboardList,
  Heart,
  MessageCircle,
  Search,
  Send,
} from "lucide-react"
import { ActionLink } from "@/components/action-link"
import { BrandMark } from "@/components/brand-logo"
import { ChatHistory } from "@/components/chat-history"
import { useChatSession } from "@/components/chat-session-provider"
import { PageHeading } from "@/components/page-heading"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import "./chat-page.css"
// 답변을 만드는 동안 차례로 켜지는 표시용 단계입니다. 클릭해서 고르는 항목이 아닙니다.
const processStages = [
  {
    id: "situation",
    Icon: Search,
    label: "상황부터 정리하기",
    status: "말씀하신 상황을 읽고 있어요",
    detail: "보낸 말에서 무슨 일이 있었는지부터 읽어요. 빠진 부분은 추측하지 않고 하나씩 되물어요.",
  },
  {
    id: "feelings",
    Icon: Heart,
    label: "감정 살펴보기",
    status: "마음에 가까운 표현을 찾고 있어요",
    detail: "직접 표현한 감정과 몸의 신호를 바탕으로 해요. 감정 이름을 대신 붙이지 않고 부드럽게 물어봐요.",
  },
  {
    id: "consultation",
    Icon: ClipboardList,
    label: "상담 준비하기",
    status: "상담에 가져갈 내용을 정리하며 답변을 쓰고 있어요",
    detail: "상담에서 나누고 싶은 이야기를 정리해요. 모인 내용은 '상담 메모'에서 볼 수 있어요.",
  },
]
const idleStageDetail =
  "메시지를 보내면 마음결이 답변을 만드는 동안 세 단계가 차례로 켜져요. 진단이나 치료 조언은 하지 않아요."
const SLOW_WAIT_SECONDS = 8

function useWaitSeconds(isBusy) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!isBusy) return
    const startedAt = Date.now()
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 500)
    return () => {
      clearInterval(timer)
      setSeconds(0)
    }
  }, [isBusy])
  return seconds
}
function MessageBubble({ role, text }) {
  const isAssistant = role === "assistant"
  return (
    <div className="chat-row" data-role={role}>
      {isAssistant && <BrandMark className="chat-avatar" />}
      <div className="chat-bubble" data-role={role}>
        {isAssistant && <p className="chat-bubble-name">마음결</p>}
        <p className="chat-bubble-text">{text}</p>
      </div>
    </div>
  )
}
export function ChatPage() {
  const {
    messages, sendMessage, status, error, stop, clearError, focus, resetSession,
    userId, activeId, sessionVersion, historyLoading, historyBusy, historyNotice, saveSession,
  } = useChatSession()
  const [draftState, setDraftState] = useState({ version: sessionVersion, text: "" })
  const draft = draftState.version === sessionVersion ? draftState.text : ""
  const setDraft = (text) => setDraftState({ version: sessionVersion, text })
  const isBusy = status === "submitted" || status === "streaming"
  const composerDisabled = isBusy || historyBusy
  const waitSeconds = useWaitSeconds(isBusy)
  // 응답이 흘러오기 시작하면 마지막 단계, 그 전에는 경과 시간에 따라 1→2단계로 표시합니다.
  const activeStage = !isBusy ? -1 : status === "streaming" ? 2 : waitSeconds < 3 ? 0 : 1
  const isSlow = isBusy && waitSeconds >= SLOW_WAIT_SECONDS
  function submitMessage(event) {
    event?.preventDefault()
    const text = draft.trim()
    if (!text || composerDisabled) return
    if (status === "error") clearError()
    setDraft("")
    void sendMessage({ text }, { body: { focus } })
  }
  function handleComposerKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      event.nativeEvent.keyCode !== 229
    ) {
      event.preventDefault()
      submitMessage()
    }
  }
  const visibleMessages = messages.flatMap((message) => {
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim()
    return text && (message.role === "user" || message.role === "assistant")
      ? [{ id: message.id, role: message.role, text }]
      : []
  })
  return (
    <div className="chat-page">
      <PageHeading
        eyebrow="AI 마음정리 도우미"
        title="말로 꺼내면, 좀 정리돼요"
        description="무슨 일이 있었는지부터 이야기해요. 대화에 따라 감정을 살펴보고 상담에서 전할 내용을 정리해요."
        action={
          visibleMessages.length > 0 ? (
            <ActionLink href="/summary" variant="outline">
              상담 메모 보기
              <ArrowRight aria-hidden="true" />
            </ActionLink>
          ) : undefined
        }
      />

      <div className="chat-layout">
        <section aria-label="마음결 대화" className="chat-main">
          <ChatHistory className="md:hidden" />
          <Card className="surface-card chat-card">
            <CardHeader className="chat-head">
              <div className="chat-head-row">
                <div className="chat-head-title">
                  <CardTitle className="card-title-base">대화 진행 단계</CardTitle>
                </div>
                {visibleMessages.length > 0 && (
                  <div className="chat-record-actions">
                    {userId && (
                      <button type="button" onClick={() => void saveSession()} className="chat-reset focus-ring"
                        disabled={composerDisabled || historyLoading}>
                        {activeId ? "변경사항 저장" : "대화 저장"}
                      </button>
                    )}
                    <button type="button" onClick={resetSession} className="chat-reset focus-ring" disabled={composerDisabled}>
                      새 대화
                    </button>
                  </div>
                )}
              </div>
              <ol className="chat-focus-grid" aria-label="대화 진행 단계">
                {chatFocusOptions.map((option) => {
                  const Icon = focusIcons[option.id]
                  return (
                    <li
                      key={option.id}
                      aria-current={focus === option.id ? "step" : undefined}
                      className="chat-focus"
                    >
                      <Icon aria-hidden="true" />
                      <span className="chat-focus-text">
                        <span className="chat-focus-label">{option.label}</span>
                      </span>
                    </li>
                  )
                })}
              </ol>
            </CardHeader>

            <CardContent className="chat-body">
              <div
                role="log"
                aria-live="polite"
                aria-relevant="additions text"
                aria-label="마음결과 나눈 대화"
                className="chat-log"
              >
                {visibleMessages.length === 0 ? (
                  <div className="chat-empty">
                    <BrandMark className="chat-empty-mark" />
                    <h2>반가워요,</h2>
                    <p>요즘 자꾸 신경 쓰이는 게 있나요? 두서없어도 괜찮아요. 떠오르는 것부터 적어주세요.</p>
                    <div className="chat-prompts">
                      {[
                        "요즘 자꾸 불안해요",
                        "무슨 일인지 잘 모르겠어요",
                        "상담을 받아보고 싶어요",
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => setDraft(prompt)}
                          className="chat-prompt focus-ring"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  visibleMessages.map((message) => (
                    <MessageBubble key={message.id} role={message.role} text={message.text} />
                  ))
                )}
                {isBusy && (
                  <div className="chat-typing" aria-label="답변을 준비하고 있어요">
                    <BrandMark className="chat-avatar" />
                    <div className="chat-typing-bubble">
                      {isSlow
                        ? "평소보다 오래 걸리고 있어요. 오류가 아니니 조금만 기다려 주세요…"
                        : `${processStages[Math.max(activeStage, 0)].status}…`}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="chat-foot">
              <form onSubmit={submitMessage} className="chat-form">
                <InputGroup className="chat-composer">
                  <InputGroupTextarea
                    aria-label="마음결에게 보낼 메시지"
                    maxLength={1600}
                    rows={2}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="떠오르는 대로 적어보세요"
                    disabled={composerDisabled}
                    className="chat-textarea"
                  />
                  <InputGroupAddon align="block-end" className="chat-composer-bar">
                    <InputGroupText className="chat-hint">
                      Enter 전송 · Shift + Enter 줄바꿈
                    </InputGroupText>
                    <div className="chat-actions">
                      {isBusy && (
                        <InputGroupButton
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void stop()}
                        >
                          응답 멈추기
                        </InputGroupButton>
                      )}
                      <InputGroupButton
                        type="submit"
                        size="icon-sm"
                        aria-label="메시지 보내기"
                        disabled={!draft.trim() || composerDisabled}
                      >
                        <Send aria-hidden="true" />
                      </InputGroupButton>
                    </div>
                  </InputGroupAddon>
                </InputGroup>
              </form>
              {error && (
                <div role="alert" className="chat-error">
                  <span>{error.message === "CHAT_PROVIDER_UNAVAILABLE"
                    ? "지금 챗봇이 답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요."
                    : "응답을 완료하지 못했어요. 잠시 후 다시 시도해 주세요."}</span>
                  <button type="button" onClick={clearError}>
                    확인했어요
                  </button>
                </div>
              )}
            </CardFooter>
          </Card>

          {historyNotice && <p className="chat-privacy" role="status">{historyNotice}</p>}
          <p className="chat-privacy">
            로그인 후 저장 버튼을 누르면 대화 내용이 계정에 저장돼요. 이름·연락처 같은 민감한 정보는 적지 마세요. 지금 위험하다면{" "}
            <a href="tel:109">109</a> · <a href="tel:112">112</a> · <a href="tel:119">119</a>
          </p>
        </section>
      </div>
    </div>
  )
}
