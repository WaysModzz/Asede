// Data Aplikasi Lokal
let appData = {
    users: [
        { username: "admin", password: "admin123", role: "admin" },
        { username: "user", password: "123456", role: "user" }
    ]
};

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');

// Fungsi login lokal
async function login(username, password) {
    const user = appData.users.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        window.location.href = user.role === 'admin' ? 'admin.html' : 'home.html';
        return true;
    }

    return false;
}

// Cek sesi login
function checkLogin() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    return user;
}

// Logout
function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
}

// Event listener saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', function() {
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) {
                loginError.textContent = 'Username dan password harus diisi';
                loginError.classList.add('show');
                return;
            }

            const button = this.querySelector('button[type="submit"]');
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Masuk...';
            button.disabled = true;

            const success = await login(username, password);

            if (!success) {
                loginError.textContent = 'Username atau password salah';
                loginError.classList.add('show');
                button.innerHTML = '<span>Login</span><div class="button-liquid"></div>';
                button.disabled = false;
            }
        });
    }
});
