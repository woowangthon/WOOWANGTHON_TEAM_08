# 마음결

청년 마음건강 첫걸음 서비스 (Next.js 16 + AI SDK).

## 실행 방법

1. Node.js 20 이상 설치
2. 이 `frontend` 폴더를 VS Code로 엽니다.
3. 터미널에서 패키지 설치:
   ```
   npm install
   ```
4. `.env.example`을 복사해 `.env.local`을 만들고 아래 제공업체 설정을 채웁니다. 실제 API 키는 저장소에 커밋하지 않습니다.
5. 개발 서버 실행:
   ```
   npm run dev
   ```
6. 브라우저에서 http://localhost:3000 을 엽니다.

## AI 제공업체 설정

채팅(`/api/chat`)은 사용자가 선택한 대화 말투에 따라 모델을 고릅니다. **따뜻하게 들어주기**(`warm`, 기본값)는 Gemini를, **차분하게 정리하기**(`structured`)는 Groq를 사용합니다. 대화 중 말투를 바꾸면 다음 요청부터 최근 대화가 새로 선택된 제공업체에 전달됩니다. 상담 메모(`/api/summary`)의 모델은 서버 환경변수 `LLM_PROVIDER`로 정합니다.

| 상담 메모의 `LLM_PROVIDER` | 제공업체 | 필수 키 | 모델 환경변수와 기본값 |
| --- | --- | --- | --- |
| `1` 또는 미설정 | Gemini | `GOOGLE_GENERATIVE_AI_API_KEY` | `GEMINI_MODEL=gemini-3.5-flash-lite` |
| `2` | Groq | `GROQ_API_KEY` | `GROQ_MODEL=openai/gpt-oss-120b` |

Gemini 키는 [Google AI Studio](https://aistudio.google.com/)에서, Groq 키는 [Groq Console](https://console.groq.com/keys)에서 발급합니다. Groq 기본 모델은 [Groq의 지원 모델 목록](https://console.groq.com/docs/models)에 있는 `openai/gpt-oss-120b`입니다. 다른 모델을 쓰려면 해당 제공업체의 모델 환경변수를 지원되는 모델 ID로 바꾸세요. 두 채팅 말투를 모두 사용하려면 두 제공업체의 키가 필요합니다. 선택한 제공업체의 키가 없으면 해당 요청에 설정 오류를 반환합니다. 상담 메모는 `LLM_PROVIDER`에 `1` 또는 `2`를 사용합니다.

챗봇 프롬프트는 [`lib/server/prompts.js`](lib/server/prompts.js)에서 편집합니다. `baseChatInstructions`는 기본 지침, `chatFocusInstructions`는 세 가지 대화 방향별 지침, `additionalChatInstructions`는 개발자 추가 지침입니다. 추가 지침은 처음에 빈 문자열이며 필요한 내용을 여기에 작성하면 됩니다. 상담 메모는 별도의 `summaryInstructions`를 사용합니다. 이 설정은 요청마다 지침을 전달하며 모델 학습이나 파인튜닝은 하지 않습니다.

`.env.local`을 변경한 뒤에는 개발 서버를 종료하고 `npm run dev`로 다시 시작하세요. 배포 환경에서는 환경변수를 수정한 뒤 재배포해야 적용됩니다. 프롬프트 파일을 변경한 경우에도 새 배포가 필요합니다.

## 페이지

- `/` 홈 · `/chat` 마음 정리 · `/summary` 상담 메모 · `/find` 상담기관 찾기 · `/support` 지원제도 탐색 · `/login` 로그인 · `/signup` 회원가입

로그인과 회원가입은 Supabase Auth를 사용합니다. 로그인과 대화 저장·불러오기를 쓰려면 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`도 설정하세요. 이 값이 없어도 게스트 채팅과 상담 메모는 사용할 수 있습니다.
