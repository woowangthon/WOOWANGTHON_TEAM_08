export const chatStages = ["situation", "feelings", "consultation"]
export const initialChatStage = chatStages[0]

export function normalizeChatStage(stage) {
  return chatStages.includes(stage) ? stage : initialChatStage
}

export function nextChatStage(stage) {
  return chatStages[chatStages.indexOf(stage) + 1] ?? stage
}
