import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import '../styles/Home.css';

export default function Register() {
  const { register } = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username.trim() || !password) {
      alert('ユーザー名とパスワードを入力してください');
      return;
    }
    setSubmitting(true);
    const ok = await register(username.trim(), password, email.trim() || undefined);
    setSubmitting(false);
    if (ok) {
      navigate('/login');
    } else {
      alert('登録に失敗しました。別のユーザー名を試してください。');
    }
  };

  return (
    <div className="home">
      <header className="home-header">
        <div className="container">
          <h1 className="logo">SlideQuick</h1>
          <p className="tagline">アカウントを作成して始めましょう</p>
        </div>
      </header>

      <main className="home-main">
        <div style={{ maxWidth: 480, margin: '0 auto' }} className="container">
          <div className="modal">
            <h2>アカウント登録</h2>
            <input
              type="text"
              placeholder="ユーザー名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="email"
              placeholder="メールアドレス (任意)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="modal-actions" style={{ marginTop: 8 }}>
              <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                ログインへ
              </Link>
              <button className="btn-primary" onClick={handleRegister} disabled={submitting}>
                {submitting ? '登録中...' : '登録'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}