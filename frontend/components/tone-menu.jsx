"use client"
import { Menu } from "@base-ui/react/menu"
import { Check, ChevronDown } from "lucide-react"
import "./tone-menu.css"

// 말투 선택지. value는 서버(/api/chat)로 보내는 값이라 바꾸면 안 돼요.
export const toneOptions = [
  { value: "warm", label: "따뜻하게", description: "감정을 먼저 받아줘요" },
  { value: "structured", label: "차분하게", description: "상황과 감정을 나눠 짚어요" },
]

// 입력창 아래줄에 두는 말투 선택: 현재 값이 보이는 작은 버튼 + 누르면 뜨는 목록.
export function ToneMenu({ value, onChange, disabled }) {
  const current = toneOptions.find((option) => option.value === value) ?? toneOptions[0]
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className="tone-trigger focus-ring" disabled={disabled}>
        <span className="tone-trigger-name">말투</span>
        <span className="tone-trigger-value">{current.label}</span>
        <ChevronDown aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="top" align="start" sideOffset={8} className="tone-positioner">
          <Menu.Popup className="tone-popup" aria-label="대화 말투">
            <Menu.RadioGroup value={value} onValueChange={onChange}>
              {toneOptions.map((option) => (
                <Menu.RadioItem
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  closeOnClick
                  className="tone-option"
                >
                  <span className="tone-option-text">
                    <span className="tone-option-label">{option.label}</span>
                    <span className="tone-option-desc">{option.description}</span>
                  </span>
                  <Menu.RadioItemIndicator className="tone-option-check">
                    <Check aria-hidden="true" />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
