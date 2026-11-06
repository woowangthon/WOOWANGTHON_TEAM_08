"use client"
import { useState } from "react"
import Link from "next/link"
import { PageHeading } from "@/components/page-heading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import "./login-page.css"

// 로그인 화면
export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  function submitForm(event) {
    event.preventDefault()
    setMessage("")
    // TODO(백엔드 연결): 여기서 Supabase Auth 를 호출해요.
    //   supabase.auth.signInWithPassword({ email, password })
    // 성공하면 받은 JWT 를 Spring Boot 요청에 실어 보내고(router.push("/chat") 등으로 이동),
    // 실패하면 setMessage(...) 로 안내해요.
    setMessage("아직 로그인 서버와 연결되지 않았어요.")
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <PageHeading
          title="로그인"
          description="계정으로 로그인해요. 마음 정리 대화는 로그인 없이도 쓸 수 있어요."
        />

        <form onSubmit={submitForm} className="login-form">
          <div className="login-field">
            <label htmlFor="login-email" className="login-label">
              이메일
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="login-input"
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password" className="login-label">
              비밀번호
            </label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="login-input"
            />
          </div>

          {message && (
            <p role="alert" className="login-message">
              {message}
            </p>
          )}

          <Button type="submit" size="lg" className="login-submit">
            로그인
          </Button>

          <p className="login-switch">
            아직 계정이 없나요? <Link href="/signup">회원가입</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
