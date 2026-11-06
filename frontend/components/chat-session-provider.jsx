"use client"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { createContext, useContext, useState } from "react"
export const chatFocusOptions = [
  {
    id: "situation",
    label: "상황부터 정리하기",
    description: "무슨 일이 있었는지 차분히 살펴봐요",
  },
  {
    id: "feelings",
    label: "감정 살펴보기",
    description: "지금 마음에 가까운 말을 찾아봐요",
  },
  {
    id: "consultation",
    label: "상담 준비하기",
    description: "전문가에게 전할 내용을 정리해요",
  },
]
const transport = new DefaultChatTransport({ api: "/api/chat" })
const ChatSessionContext = createContext(null)
export function ChatSessionProvider({ children }) {
  const [focus, setFocus] = useState("feelings")
  const [summary, setSummary] = useState(null)
  const chat = useChat({ transport })
  function resetSession() {
    if (chat.status === "submitted" || chat.status === "streaming") {
      void chat.stop()
    }
    chat.setMessages([])
    chat.clearError()
    setFocus("feelings")
    setSummary(null)
  }
  return (
    <ChatSessionContext.Provider
      value={{
        messages: chat.messages,
        sendMessage: chat.sendMessage,
        status: chat.status,
        error: chat.error,
        stop: chat.stop,
        clearError: chat.clearError,
        setMessages: chat.setMessages,
        focus,
        setFocus,
        summary,
        setSummary,
        resetSession,
      }}
    >
      {children}
    </ChatSessionContext.Provider>
  )
}
export function useChatSession() {
  const context = useContext(ChatSessionContext)
  if (!context) {
    throw new Error("useChatSession must be used inside ChatSessionProvider")
  }
  return context
}
