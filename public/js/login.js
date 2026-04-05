document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('errMsg');
  btn.textContent = 'Logging in...'; btn.disabled = true; err.style.display = 'none';
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    window.location.href = data.role === 'admin' ? '/admin' : '/accountant';
  } catch(e) {
    err.textContent = e.message; err.style.display = 'block';
    btn.textContent = 'Login'; btn.disabled = false;
  }
});