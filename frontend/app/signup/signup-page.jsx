"use client"
import { useState } from "react"
import Link from "next/link"
import { PageHeading } from "@/components/page-heading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// 로그인 화면과 같은 카드 모양이라 스타일(login-*)을 같이 써요.
import "../login/login-page.css"

// ── 비밀번호 조건 (바꾸려면 여기만 고치면 돼요) ──
const PASSWORD_MIN = 8
const PASSWORD_HINT = `영문과 숫자를 함께 써서 ${PASSWORD_MIN}자 이상으로 만들어 주세요.`

function isPasswordValid(password) {
  return password.length >= PASSWORD_MIN && /[A-Za-z]/.test(password) && /[0-9]/.test(password)
}

// 회원가입 화면. 가입이 끝나면 /login 으로 보내요.
export function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordCheck, setPasswordCheck] = useState("")
  const [message, setMessage] = useState("")

  function submitForm(event) {
    event.preventDefault()
    setMessage("")
    if (!isPasswordValid(password)) {
      setMessage(`비밀번호 조건을 확인해 주세요. ${PASSWORD_HINT}`)
      return
    }
    if (password !== passwordCheck) {
      setMessage("비밀번호가 서로 달라요. 다시 확인해 주세요.")
      return
    }
    // TODO(백엔드 연결): 여기서 Supabase Auth 로 가입해요.
    //   supabase.auth.signUp({ email, password })
    // 이미 가입된 이메일이면 Supabase 가 알려주는 결과에 맞춰 setMessage(...) 로 안내해요.
    // 성공하면 로그인 화면으로 이동해요: router.push("/login")  (useRouter 는 next/navigation)
    setMessage("아직 회원가입 서버와 연결되지 않았어요.")
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <PageHeading
          title="회원가입"
          description="이메일과 비밀번호로 계정을 만들어요. 가입한 뒤에는 로그인해서 이용해요."
        />

        <form onSubmit={submitForm} className="login-form">
          <div className="login-field">
            <label htmlFor="signup-email" className="login-label">
              이메일
            </label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="login-input"
            />
          </div>

          <div className="login-field">
            <label htmlFor="signup-password" className="login-label">
              비밀번호
            </label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              required
              aria-describedby="signup-password-hint"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="login-input"
            />
            <p id="signup-password-hint" className="login-hint">
              {PASSWORD_HINT}
            </p>
          </div>

          <div className="login-field">
            <label htmlFor="signup-password-check" className="login-label">
              비밀번호 확인
            </label>
            <Input
              id="signup-password-check"
              type="password"
              autoComplete="new-password"
              required
              value={passwordCheck}
              onChange={(event) => setPasswordCheck(event.target.value)}
              className="login-input"
            />
          </div>

          {message && (
            <p role="alert" className="login-message">
              {message}
            </p>
          )}

          <Button type="submit" size="lg" className="login-submit">
            회원가입
          </Button>

          <p className="login-switch">
            이미 계정이 있나요? <Link href="/login">로그인</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
