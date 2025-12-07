import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "../styles/Home.css";

export default function Login() {
  const { login } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      alert("ユーザー名とパスワードを入力してください");
      return;
    }
    setSubmitting(true);
    const ok = await login(username.trim(), password);
    setSubmitting(false);
    if (ok) {
      navigate("/");
    } else {
      alert("ログインに失敗しました。資格情報を確認してください。");
    }
  };

  return (
    <div className="home">
      <header className="home-header">
        <div className="container">
          <h1 className="logo">SlideQuick</h1>
          <p className="tagline">アカウントにログインしてください</p>
        </div>
      </header>

      <main className="home-main">
        <div style={{ maxWidth: 480, margin: "0 auto" }} className="container">
          <div className="modal">
            <h2>ログイン</h2>
            <input
              type="text"
              placeholder="ユーザー名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="modal-actions" style={{ marginTop: 8 }}>
              <Link
                to="/register"
                className="btn-secondary"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                新規登録
              </Link>
              <button
                className="btn-primary"
                onClick={handleLogin}
                disabled={submitting}
              >
                {submitting ? "ログイン中..." : "ログイン"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
