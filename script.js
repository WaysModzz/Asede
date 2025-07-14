// Konfigurasi JSONBIN.io
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3/b';
const JSONBIN_API_KEY = '$2a$10$5qjBcGPykZ9qn.1yqHumA.z1H/vpoGv0ER43u1A2KkgINVD1Ov8cq'; // Ganti dengan API key Anda
const JSONBIN_BIN_ID = '6874dd826063391d31ad52b1'; // Ganti dengan bin ID Anda

let appData = {
    users: []
    bots: [],
    logs: [],
    settings: {}
};

// DOM Elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');
const logoutButton = document.getElementById('logoutButton');
const adminLogoutButton = document.getElementById('adminLogoutButton');
const notification = document.getElementById('notification');
const adminNotification = document.getElementById('adminNotification');

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info', element = notification) {
    element.textContent = message;
    element.style.borderLeftColor = `var(--${type}-color)`;
    element.classList.add('show');
    
    setTimeout(() => {
        element.classList.remove('show');
    }, 3000);
}

// Fungsi untuk memuat data dari JSONBIN.io
async function loadData() {
    try {
        const response = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Gagal memuat data');
        
        const data = await response.json();
        appData = data.record;
        
        // Jika data kosong, inisialisasi dengan data default
        if (!appData.users) appData.users = [];
        if (!appData.bots) appData.bots = [];
        if (!appData.logs) appData.logs = [];
        if (!appData.settings) appData.settings = {};
        
        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        return false;
    }
}

// Fungsi untuk menyimpan data ke JSONBIN.io
async function saveData() {
    try {
        const response = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appData)
        });
        
        if (!response.ok) throw new Error('Gagal menyimpan data');
        
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

// Fungsi untuk login
async function login(username, password) {
    await loadData();
    
    const user = appData.users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Simpan sesi login
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        
        // Tambahkan log
        appData.logs.push({
            timestamp: new Date().toISOString(),
            event: 'login',
            username: user.username,
            message: 'User logged in successfully'
        });
        
        await saveData();
        
        // Redirect berdasarkan role
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'home.html';
        }
        
        return true;
    }
    
    return false;
}

// Fungsi untuk logout
function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
}

// Fungsi untuk memeriksa sesi login
function checkLogin() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    
    if (!user) {
        logout();
        return;
    }
    
    // Update UI berdasarkan role
    if (document.getElementById('loggedInUser')) {
        document.getElementById('loggedInUser').textContent = user.username;
    }
    
    if (document.getElementById('adminUsername')) {
        document.getElementById('adminUsername').textContent = user.username;
    }
    
    return user;
}

// Fungsi untuk menangani bug Android
async function sendBug(targetNumber, method) {
    try {
        // Simulasi pengiriman bug
        const timestamp = new Date().toISOString();
        
        // Tambahkan log
        appData.logs.push({
            timestamp,
            event: 'bug_sent',
            target: targetNumber,
            method,
            status: 'success',
            message: `Bug ${method} berhasil dikirim ke ${targetNumber}`
        });
        
        await saveData();
        
        // Tampilkan log di UI
        if (document.getElementById('bugLogsContent')) {
            const logsContent = document.getElementById('bugLogsContent');
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `
                <span class="log-time">${new Date(timestamp).toLocaleTimeString()}</span>
                <span class="log-message success">Bug ${method} berhasil dikirim ke ${targetNumber}</span>
            `;
            logsContent.prepend(logEntry);
        }
        
        return true;
    } catch (error) {
        console.error('Error sending bug:', error);
        
        // Tambahkan log error
        appData.logs.push({
            timestamp: new Date().toISOString(),
            event: 'bug_sent',
            target: targetNumber,
            method,
            status: 'error',
            message: `Gagal mengirim bug ${method} ke ${targetNumber}: ${error.message}`
        });
        
        await saveData();
        
        return false;
    }
}

// Fungsi untuk menghitung uptime server (simulasi)
function calculateUptime() {
    const startTime = new Date('2023-01-01T00:00:00Z'); // Waktu mulai tetap untuk simulasi
    const now = new Date();
    const diff = now - startTime;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Fungsi untuk update uptime secara realtime
function startUptimeCounter() {
    const uptimeElements = document.querySelectorAll('#serverUptime, #adminServerUptime');
    
    if (uptimeElements.length > 0) {
        setInterval(() => {
            uptimeElements.forEach(el => {
                el.textContent = calculateUptime();
            });
        }, 1000);
    }
}

// Fungsi untuk memuat logs
function loadLogs() {
    if (document.getElementById('activityLogs')) {
        const logsContent = document.getElementById('activityLogs');
        logsContent.innerHTML = '';
        
        // Ambil 50 log terbaru
        const recentLogs = [...appData.logs].reverse().slice(0, 50);
        
        recentLogs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const logClass = log.status === 'success' ? 'success' : 
                            log.status === 'error' ? 'error' : 'info';
            
            logEntry.innerHTML = `
                <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
                <span class="log-message ${logClass}">${log.message}</span>
            `;
            
            logsContent.appendChild(logEntry);
        });
    }
}

// Fungsi untuk memuat daftar bot
function loadBots() {
    if (document.getElementById('connectedBotsList')) {
        const botsList = document.getElementById('connectedBotsList');
        botsList.innerHTML = '';
        
        if (appData.bots.length === 0) {
            botsList.innerHTML = `
                <div class="no-bots">
                    <i class="fas fa-robot"></i>
                    <p>Tidak ada bot yang terhubung</p>
                </div>
            `;
            return;
        }
        
        appData.bots.forEach(bot => {
            const botCard = document.createElement('div');
            botCard.className = `bot-card ${bot.status === 'offline' ? 'offline' : ''}`;
            botCard.innerHTML = `
                <div class="bot-name">
                    ${bot.name}
                    <i class="fas fa-circle"></i>
                </div>
                <div class="bot-number">${bot.number}</div>
                <div class="bot-status">Terhubung: ${new Date(bot.connectedAt).toLocaleDateString()}</div>
            `;
            botsList.appendChild(botCard);
        });
    }
}

// Fungsi untuk memuat daftar user
function loadUsers() {
    if (document.getElementById('usersTable')) {
        const usersTable = document.getElementById('usersTable').querySelector('tbody');
        usersTable.innerHTML = '';
        
        appData.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Belum pernah login'}</td>
                <td>
                    <div class="user-actions">
                        <button class="user-action-btn edit" data-username="${user.username}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="user-action-btn delete" data-username="${user.username}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            usersTable.appendChild(row);
        });
    }
}

// Fungsi untuk membuat user baru
async function createUser(username, password, role) {
    // Validasi input
    if (!username || !password || !role) {
        showNotification('Semua field harus diisi', 'error', adminNotification);
        return false;
    }
    
    // Cek apakah username sudah ada
    if (appData.users.some(u => u.username === username)) {
        showNotification('Username sudah digunakan', 'error', adminNotification);
        return false;
    }
    
    // Tambahkan user baru
    appData.users.push({
        username,
        password,
        role,
        createdAt: new Date().toISOString()
    });
    
    // Simpan data
    const saved = await saveData();
    
    if (saved) {
        showNotification('User berhasil dibuat', 'success', adminNotification);
        loadUsers();
        return true;
    } else {
        showNotification('Gagal menyimpan user', 'error', adminNotification);
        return false;
    }
}

// Fungsi untuk request pairing code (simulasi)
async function requestPairingCode(phoneNumber) {
    try {
        // Simulasi delay request
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate random pairing code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const formattedCode = code.match(/.{1,3}/g).join('-');
        
        // Tambahkan bot ke daftar
        appData.bots.push({
            name: `Bot ${appData.bots.length + 1}`,
            number: phoneNumber,
            status: 'pending',
            pairingCode: code,
            connectedAt: new Date().toISOString()
        });
        
        await saveData();
        
        // Tampilkan pairing code
        if (document.getElementById('pairingCodeDisplay')) {
            document.getElementById('pairingCodeDisplay').textContent = formattedCode;
            document.getElementById('pairingResult').classList.remove('hidden');
        }
        
        showNotification('Pairing code berhasil dibuat', 'success', adminNotification);
        
        return true;
    } catch (error) {
        console.error('Error requesting pairing code:', error);
        showNotification('Gagal membuat pairing code', 'error', adminNotification);
        return false;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    // Inisialisasi particles.js untuk halaman login
    if (document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: "#9c27b0" },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: "#9c27b0", opacity: 0.4, width: 1 },
                move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out" }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "repulse" },
                    onclick: { enable: true, mode: "push" }
                }
            }
        });
    }
    
    // Cek login untuk halaman selain index.html
    if (!window.location.pathname.endsWith('index.html')) {
        const user = checkLogin();
        
        // Load data aplikasi
        await loadData();
        
        // Update UI berdasarkan halaman
        if (window.location.pathname.endsWith('home.html')) {
            // Dashboard user
            document.title = `MajesticXg - ${user.username}`;
            
            // Update stats
            document.getElementById('totalRequests').textContent = 
                appData.logs.filter(l => l.event === 'bug_sent').length;
            document.getElementById('successRequests').textContent = 
                appData.logs.filter(l => l.event === 'bug_sent' && l.status === 'success').length;
            document.getElementById('failedRequests').textContent = 
                appData.logs.filter(l => l.event === 'bug_sent' && l.status === 'error').length;
            
            const lastActivity = appData.logs
                .filter(l => l.username === user.username)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            
            document.getElementById('lastActivity').textContent = 
                lastActivity ? new Date(lastActivity.timestamp).toLocaleString() : '-';
            
            // Navigation
            document.querySelectorAll('.sidebar-menu li a').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const sectionId = this.getAttribute('href').substring(1);
                    
                    // Sembunyikan semua section
                    document.querySelectorAll('.hidden-section').forEach(section => {
                        section.classList.add('hidden-section');
                    });
                    
                    // Tampilkan section yang dipilih
                    document.getElementById(`${sectionId}Section`).classList.remove('hidden-section');
                    
                    // Update active menu
                    document.querySelectorAll('.sidebar-menu li').forEach(li => {
                        li.classList.remove('active');
                    });
                    
                    this.parentElement.classList.add('active');
                    
                    // Update judul halaman
                    document.getElementById('pageTitle').textContent = 
                        this.textContent.replace(/<i.*?<\/i>/, '').trim();
                    
                    // Jika section logs, muat logs
                    if (sectionId === 'logs') {
                        loadLogs();
                    }
                    
                    // Jika section bug android, reset form
                    if (sectionId === 'bug-android') {
                        document.getElementById('targetNumber').value = '';
                        document.getElementById('methodSelection').classList.add('hidden');
                        document.getElementById('bugLogs').classList.add('hidden');
                    }
                });
            });
            
            // Event listener untuk input nomor target
            const targetNumberInput = document.getElementById('targetNumber');
            if (targetNumberInput) {
                targetNumberInput.addEventListener('input', function() {
                    if (this.value.length >= 3) {
                        document.getElementById('methodSelection').classList.remove('hidden');
                    } else {
                        document.getElementById('methodSelection').classList.add('hidden');
                    }
                });
            }
            
            // Event listener untuk method selection
            document.querySelectorAll('.method-card').forEach(card => {
                card.addEventListener('click', function() {
                    document.querySelectorAll('.method-card').forEach(c => {
                        c.classList.remove('active');
                    });
                    this.classList.add('active');
                });
            });
            
            // Event listener untuk send bug button
            const sendBugButton = document.getElementById('sendBugButton');
            if (sendBugButton) {
                sendBugButton.addEventListener('click', async function(e) {
                    e.preventDefault();
                    
                    const targetNumber = document.getElementById('targetNumber').value;
                    const selectedMethod = document.querySelector('.method-card.active')?.dataset.method;
                    
                    if (!targetNumber || !selectedMethod) {
                        showNotification('Harap isi nomor target dan pilih metode', 'error');
                        return;
                    }
                    
                    // Validasi nomor (minimal 10 digit)
                    if (targetNumber.length < 10) {
                        showNotification('Nomor target tidak valid', 'error');
                        return;
                    }
                    
                    // Tampilkan logs container
                    document.getElementById('bugLogs').classList.remove('hidden');
                    
                    // Kirim bug
                    const success = await sendBug(targetNumber, selectedMethod);
                    
                    if (success) {
                        showNotification('Bug berhasil dikirim', 'success');
                    } else {
                        showNotification('Gagal mengirim bug', 'error');
                    }
                });
            }
            
            // Event listener untuk refresh logs
            const refreshLogsButton = document.getElementById('refreshLogs');
            if (refreshLogsButton) {
                refreshLogsButton.addEventListener('click', loadLogs);
            }
            
        } else if (window.location.pathname.endsWith('admin.html')) {
            // Admin panel
            document.title = `MajesticXg - Admin Panel`;
            
                        // Navigation
            document.querySelectorAll('.sidebar-menu li a').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const sectionId = this.getAttribute('href').substring(1);
                    
                    // Sembunyikan semua section
                    document.querySelectorAll('.hidden-section').forEach(section => {
                        section.classList.add('hidden-section');
                    });
                    
                    // Tampilkan section yang dipilih
                    document.getElementById(`${sectionId}Section`).classList.remove('hidden-section');
                    
                    // Update active menu
                    document.querySelectorAll('.sidebar-menu li').forEach(li => {
                        li.classList.remove('active');
                    });
                    
                    this.parentElement.classList.add('active');
                    
                    // Update judul halaman
                    document.getElementById('pageTitle').textContent = 
                        this.textContent.replace(/<i.*?<\/i>/, '').trim();
                    
                    // Jika section logs, muat logs
                    if (sectionId === 'logs') {
                        loadLogs();
                    }
                    
                    // Jika section bug android, reset form
                    if (sectionId === 'bug-android') {
                        document.getElementById('targetNumber').value = '';
                        document.getElementById('methodSelection').classList.add('hidden');
                        document.getElementById('bugLogs').classList.add('hidden');
                    }
                });
            });
            
            // Event listener untuk input nomor target
            const targetNumberInput = document.getElementById('targetNumber');
            if (targetNumberInput) {
                targetNumberInput.addEventListener('input', function() {
                    if (this.value.length >= 3) {
                        document.getElementById('methodSelection').classList.remove('hidden');
                    } else {
                        document.getElementById('methodSelection').classList.add('hidden');
                    }
                });
            }
            
            // Event listener untuk method selection
            document.querySelectorAll('.method-card').forEach(card => {
                card.addEventListener('click', function() {
                    document.querySelectorAll('.method-card').forEach(c => {
                        c.classList.remove('active');
                    });
                    this.classList.add('active');
                });
            });
            
            // Event listener untuk send bug button
            const sendBugButton = document.getElementById('sendBugButton');
            if (sendBugButton) {
                sendBugButton.addEventListener('click', async function(e) {
                    e.preventDefault();
                    
                    const targetNumber = document.getElementById('targetNumber').value;
                    const selectedMethod = document.querySelector('.method-card.active')?.dataset.method;
                    
                    if (!targetNumber || !selectedMethod) {
                        showNotification('Harap isi nomor target dan pilih metode', 'error');
                        return;
                    }
                    
                    // Validasi nomor (minimal 10 digit)
                    if (targetNumber.length < 10) {
                        showNotification('Nomor target tidak valid', 'error');
                        return;
                    }
                    
                    // Tampilkan logs container
                    document.getElementById('bugLogs').classList.remove('hidden');
                    
                    // Kirim bug
                    const success = await sendBug(targetNumber, selectedMethod);
                    
                    if (success) {
                        showNotification('Bug berhasil dikirim', 'success');
                    } else {
                        showNotification('Gagal mengirim bug', 'error');
                    }
                });
            }
            
            // Event listener untuk refresh logs
            const refreshLogsButton = document.getElementById('refreshLogs');
            if (refreshLogsButton) {
                refreshLogsButton.addEventListener('click', loadLogs);
            }
            
        } else if (window.location.pathname.endsWith('admin.html')) {
            // Admin panel
            document.title = `MajesticXg - Admin Panel`;
            
            // Navigation
            document.querySelectorAll('.sidebar-menu li a').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const sectionId = this.getAttribute('href').substring(1);
                    
                    // Sembunyikan semua section
                    document.querySelectorAll('.admin-section').forEach(section => {
                        section.classList.add('hidden-section');
                    });
                    
                    // Tampilkan section yang dipilih
                    document.getElementById(`${sectionId}Section`).classList.remove('hidden-section');
                    
                    // Update active menu
                    document.querySelectorAll('.sidebar-menu li').forEach(li => {
                        li.classList.remove('active');
                    });
                    
                    this.parentElement.classList.add('active');
                    
                    // Update judul halaman
                    document.getElementById('adminPageTitle').textContent = 
                        this.textContent.replace(/<i.*?<\/i>/, '').trim();
                    
                    // Jika section user management, muat daftar user
                    if (sectionId === 'user-management') {
                        loadUsers();
                    }
                    
                    // Jika section bot management, muat daftar bot
                    if (sectionId === 'bot-management') {
                        loadBots();
                    }
                });
            });
            
            // Event listener untuk request pairing button
            const requestPairingButton = document.getElementById('requestPairingButton');
            if (requestPairingButton) {
                requestPairingButton.addEventListener('click', async function(e) {
                    e.preventDefault();
                    
                    const phoneNumber = document.getElementById('botNumber').value;
                    
                    if (!phoneNumber) {
                        showNotification('Harap masukkan nomor WhatsApp bot', 'error', adminNotification);
                        return;
                    }
                    
                    // Validasi nomor (minimal 10 digit)
                    if (phoneNumber.length < 10) {
                        showNotification('Nomor WhatsApp tidak valid', 'error', adminNotification);
                        return;
                    }
                    
                    // Tampilkan loading
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
                    this.disabled = true;
                    
                    // Request pairing code
                    const success = await requestPairingCode(phoneNumber);
                    
                    // Reset button
                    this.innerHTML = '<span>Request Pairing Code</span><div class="button-liquid"></div>';
                    this.disabled = false;
                });
            }
            
            // Event listener untuk create user button
            const createUserButton = document.getElementById('createUserButton');
            if (createUserButton) {
                createUserButton.addEventListener('click', async function(e) {
                    e.preventDefault();
                    
                    const username = document.getElementById('newUsername').value;
                    const password = document.getElementById('newPassword').value;
                    const role = document.getElementById('userRole').value;
                    
                    // Tampilkan loading
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Membuat...';
                    this.disabled = true;
                    
                    // Buat user baru
                    const success = await createUser(username, password, role);
                    
                    // Reset button
                    this.innerHTML = '<span>Create User</span><div class="button-liquid"></div>';
                    this.disabled = false;
                    
                    // Reset form jika berhasil
                    if (success) {
                        document.getElementById('newUsername').value = '';
                        document.getElementById('newPassword').value = '';
                        document.getElementById('userRole').value = 'user';
                    }
                });
            }
            
            // Load data awal
            loadBots();
            loadUsers();
        }
        
        // Start uptime counter
        startUptimeCounter();
    }
    
    // Event listener untuk login form
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
            
            // Tampilkan loading
            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Masuk...';
            submitButton.disabled = true;
            
            // Coba login
            const success = await login(username, password);
            
            if (!success) {
                loginError.textContent = 'Username atau password salah';
                loginError.classList.add('show');
                
                // Reset button
                submitButton.innerHTML = '<span>Login</span><div class="button-liquid"></div>';
                submitButton.disabled = false;
            }
        });
    }
    
    // Event listener untuk logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    
    if (adminLogoutButton) {
        adminLogoutButton.addEventListener('click', logout);
    }
    
    // Event listener untuk input fields
    document.querySelectorAll('.input-field').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.querySelector('.input-underline').style.width = '100%';
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.querySelector('.input-underline').style.width = '0';
            }
        });
    });
});

// Fungsi untuk koneksi WhatsApp Bot (simulasi)
async function connectWhatsAppBot() {
    // Ini adalah simulasi - implementasi sebenarnya akan menggunakan @whiskeysockets/baileys
    console.log('Simulasi koneksi WhatsApp Bot');
    
    // Dalam implementasi nyata, Anda akan menggunakan kode seperti ini:
    /*
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true
    });
    
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            // Handle reconnect
        } else if (connection === 'open') {
            console.log('Bot terhubung');
        }
    });
    */
}
