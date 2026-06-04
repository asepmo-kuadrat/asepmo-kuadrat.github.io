   // Global App State
        const state = {
            activePage: 'home',
            theme: 'dark', // default dark mode
            ytApiKey: '',
            ytPlaylistId: '',
            sandboxCode: '',
            activeEditorTab: 'edit'
        };

        // DOM Loaded Handler
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize Lucide Icons
            lucide.createIcons();

            // Setup Event Listeners
            setupEventListeners();

            // Load stored configurations (if any)
            loadStateFromLocalStorage();

            // Sync Theme to visual classes
            applyTheme();

            // Initialize Sandbox Editor Preview
            updateLivePreview();
        });

        function setupEventListeners() {
            const btnDrawerToggle = document.getElementById('btnDrawerToggle');
            const btnDrawerClose = document.getElementById('btnDrawerClose');
            const drawerBackdrop = document.getElementById('drawerBackdrop');
            const navDrawer = document.getElementById('navDrawer');
            const btnDropdownToggle = document.getElementById('btnDropdownToggle');
            const optionsDropdown = document.getElementById('optionsDropdown');

            // Drawer Handlers
            btnDrawerToggle.addEventListener('click', () => {
                navDrawer.classList.remove('-translate-x-full');
                drawerBackdrop.classList.remove('hidden');
            });

            btnDrawerClose.addEventListener('click', closeDrawer);
            drawerBackdrop.addEventListener('click', closeDrawer);

            function closeDrawer() {
                navDrawer.classList.add('-translate-x-full');
                drawerBackdrop.classList.add('hidden');
            }

            // Options Dropdown Handler
            btnDropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                optionsDropdown.classList.toggle('hidden');
            });

            document.addEventListener('click', () => {
                optionsDropdown.classList.add('hidden');
            });
        }

        // Navigation system
        function navigateTo(pageId) {
            // Update State
            state.activePage = pageId;

            // Hide all pages
            document.querySelectorAll('.page-view').forEach(view => {
                view.classList.add('hidden');
            });

            // Show target page
            const targetPage = document.getElementById(`page-${pageId}`);
            if (targetPage) {
                targetPage.classList.remove('hidden');
            }

            // Sync Breadcrumbs visually
            updateBreadcrumbText(pageId);

            // Sync active navigation drawer styling
            document.querySelectorAll('.nav-item').forEach(item => {
                const itemPage = item.getAttribute('data-page');
                if (itemPage === pageId) {
                    item.classList.add('bg-brand-50', 'text-brand-600', 'dark:bg-slate-800', 'dark:text-white');
                } else {
                    item.classList.remove('bg-brand-50', 'text-brand-600', 'dark:bg-slate-800', 'dark:text-white');
                }
            });

            // Auto-close Drawer on navigate
            document.getElementById('navDrawer').classList.add('-translate-x-full');
            document.getElementById('drawerBackdrop').classList.add('hidden');

            // Smooth scroll to top of viewport
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function updateBreadcrumbText(pageId) {
            const breadcrumbEl = document.getElementById('globalBreadcrumb');
            const uppercaseMap = {
                'home': 'Home',
                'about': 'Home | About',
                'gallery': 'Home | Gallery',
                'service': 'Home | Services',
                'article': 'Home | Articles',
                'contact': 'Home | Contact',
                'editor': 'Home | Code Sandbox',
                'youtube': 'Home | YouTube Channel',
                'settings': 'Home | Settings'
            };
            breadcrumbEl.textContent = uppercaseMap[pageId] || 'Home';
        }

        // Theme Management (Light / Dark)
        function setThemeMode(mode) {
            state.theme = mode;
            applyTheme();
            showNotification(`Tema visual berhasil diubah ke mode ${mode === 'dark' ? 'gelap' : 'terang'}!`);
        }

        function applyTheme() {
            const htmlEl = document.documentElement;
            const checkLight = document.getElementById('checkThemeLight');
            const checkDark = document.getElementById('checkThemeDark');

            if (state.theme === 'dark') {
                htmlEl.classList.add('dark');
                if (checkDark) checkDark.classList.remove('hidden');
                if (checkLight) checkLight.classList.add('hidden');
            } else {
                htmlEl.classList.remove('dark');
                if (checkLight) checkLight.classList.remove('hidden');
                if (checkDark) checkDark.classList.add('hidden');
            }
        }

        // Settings Persistence
        function saveSettings() {
            const key = document.getElementById('inputYTApiKey').value;
            const playlist = document.getElementById('inputYTPlaylistID').value;

            state.ytApiKey = key;
            state.ytPlaylistId = playlist;

            localStorage.setItem('tailwind_mastery_state', JSON.stringify(state));
            showNotification('Konfigurasi pengaturan Anda sukses disimpan!');
            
            // If API key is available, adjust Youtube notification badge
            const badge = document.getElementById('ytConfigBadge');
            if (badge) {
                if (key) {
                    badge.innerHTML = `
                        <i data-lucide="check" class="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500"></i>
                        <div>
                            <p class="font-bold text-emerald-600">YouTube API Key Tersambung</p>
                            <p class="text-xs text-emerald-500 mt-1">Sistem sekarang siap melakukan pemanggilan endpoint dinamis untuk memuat playlist video Anda.</p>
                        </div>
                    `;
                    lucide.createIcons();
                }
            }
        }

        function resetSettings() {
            state.theme = 'dark';
            state.ytApiKey = '';
            state.ytPlaylistId = '';
            document.getElementById('inputYTApiKey').value = '';
            document.getElementById('inputYTPlaylistID').value = '';
            applyTheme();
            showNotification('Pengaturan dikembalikan ke konfigurasi pabrik!');
        }

        function loadStateFromLocalStorage() {
            const raw = localStorage.getItem('tailwind_mastery_state');
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    state.theme = parsed.theme || 'dark';
                    state.ytApiKey = parsed.ytApiKey || '';
                    state.ytPlaylistId = parsed.ytPlaylistId || '';
                    
                    // Pre-populate input fields
                    document.getElementById('inputYTApiKey').value = state.ytApiKey;
                    document.getElementById('inputYTPlaylistID').value = state.ytPlaylistId;
                } catch (e) {
                    console.error("Gagal mengurai state dari localStorage:", e);
                    // Reset cache yang rusak jika terjadi parsing error
                    localStorage.removeItem('tailwind_mastery_state');
                }
            }
        }

        // Sandbox Editor Logic
        function updateLivePreview() {
            const code = document.getElementById('sandboxCodeEditor').value;
            const iframe = document.getElementById('sandboxPreviewIframe');
            
            // Build temporary HTML document with Tailwind CDN injected (Escaped closing script tag)
            const sandboxDocument = `
                <!DOCTYPE html>
                <html class="h-full">
                <head>
                    <script src="https://cdn.tailwindcss.com"><\/script>
                    <style>
                        body { display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
	</style>
	</head>
	<body class="bg-transparent">
	  ${code}
</body>
</html>
`;

const doc = iframe.contentDocument || iframe.contentWindow.document;
doc.open();
doc.write(sandboxDocument);
doc.close();
}

function switchEditorTab(tab) {
state.activeEditorTab = tab;
const btnEdit = document.getElementById('btnEditorTabEdit');
const btnPreview = document.getElementById('btnEditorTabPreview');
const paneInput = document.getElementById('paneEditorInput');
const panePreview = document.getElementById('paneEditorPreview');

if (tab === 'edit') {
btnEdit.classList.add('border-brand-500', 'text-brand-500');
btnEdit.classList.remove('border-transparent', 'text-slate-500');
btnPreview.classList.add('border-transparent', 'text-slate-500');
btnPreview.classList.remove('border-brand-500', 'text-brand-500');
paneInput.classList.remove('hidden');
panePreview.classList.add('hidden', 'lg:block');
} else {
btnPreview.classList.add('border-brand-500', 'text-brand-500');
btnPreview.classList.remove('border-transparent', 'text-slate-500');
btnEdit.classList.add('border-transparent', 'text-slate-500');
btnEdit.classList.remove('border-brand-500', 'text-brand-500');
paneInput.classList.add('hidden');
panePreview.classList.remove('hidden', 'lg:block');

// Force preview compilation
updateLivePreview();
}
}

function downloadSandboxedCode() {
const code = document.getElementById('sandboxCodeEditor').value;
triggerDownload(code, 'sandbox_tailwind_template.html');
}

// Copy Sandbox Code Helper
function copySandboxedCode() {
const code = document.getElementById('sandboxCodeEditor').value;
copyTextToClipboard(code);
showNotification('Kode sandbox berhasil disalin ke clipboard!');
}

function shareSandboxedCode() {
copyTextToClipboard(window.location.href);
showNotification('Tautan sandbox berhasil disalin untuk dibagikan!');
}

function downloadMockTemplate(templateName) {
// Escaped inline script tag inside template literal to prevent parser bugs
const sampleHtml = `
<!DOCTYPE html>
<html lang="id">
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${templateName}</title>
<script src="https://cdn.tailwindcss.com"><\/script>
</head>
<body class="bg-slate-50 dark:bg-slate-950 flex items-center justify-center min-h-screen">
    <div class="p-8 max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl text-center border border-slate-100 dark:border-slate-800">
        <h1 class="text-2xl font-black text-slate-800 dark:text-white mb-2">\${templateName}</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">Template bootstrap yang diunduh langsung dari platform masterclass.</p>
    </div>
</body>
</html>`;
            triggerDownload(sampleHtml, `${templateName.toLowerCase().replace(/\s+/g, '_')}_template.html`);
            showNotification(`Template "${templateName}" sukses dipersiapkan dan diunduh!`);
        }

        // Form & Share Handlers
        function handleContactSubmit(e) {
            e.preventDefault();
            document.getElementById('contactForm').reset();
            showNotification('Pesan sukses terkirim! Tim dukungan akan menghubungi Anda sesaat lagi.');
        }

        function shareContent(title, fileName) {
            showNotification(`Berbagi artikel "${title}" (${fileName}) ke jaringan sosial Anda...`);
        }

        // Dynamic Full Article Viewer Content
        const articlesRepository = {
            'artikel-pemula': {
                category: 'PANDUAN PEMULA',
                title: "Mengenal Tailwind CSS: Framework 'Utility-First' untuk Pengembangan Web Modern",
                body: `
                    <h4>Mengapa Menulis CSS Inline Justru Membawa Kebaikan?</h4>
                    <p>Dalam dunia pengembangan web tradisional, developer diwajibkan untuk memisahkan logika markup HTML dan visual penataan CSS secara kaku demi menjaga kesucian pemisahan tanggung jawab (Separation of Concerns). Namun seiring bertumbuhnya kompleksitas proyek visual modern, penulisan stylesheet terpisah membuahkan ribuan baris CSS membengkak yang sulit ditelusuri.</p>
                    <p>Tailwind CSS menengahi persoalan tersebut dengan menyediakan ribuan utilitas atomik kecil siap pakai seperti <code>flex</code>, <code>pt-4</code>, dan <code>rounded-lg</code>. Anda dapat menyematkan utilitas ini langsung di file HTML.</p>
                    <div class="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs my-4">
                        &lt;button class="bg-blue-500 text-white font-bold py-2 px-4 rounded"&gt;<br>
                        &nbsp;&nbsp;Tombol Atomik<br>
                        &lt;/button&gt;
                    </div>
                    <h4>Keuntungan Utama Tailwind CSS:</h4>
                    <ul>
                        <li><strong>Kecepatan Iterasi Tanpa Tanding</strong>: Pengembang dapat merancang halaman interaktif dengan kilat tanpa perlu meninggalkan file HTML mereka untuk menulis penataan CSS kustom.</li>
                        <li><strong>Bundel Ukuran File Super Ramping</strong>: Dengan mengaktifkan JIT (Just-In-Time) compiler, Tailwind hanya akan mengompilasi kelas utilitas yang benar-benar tersurat di file markup Anda.</li>
                        <li><strong>Mencegah Peperangan Spesifisitas</strong>: Menghapus total bug akibat overriding gaya CSS antar file komponen yang bertabrakan.</li>
                    </ul>
                `
            },
            'artikel-lanjutan': {
                category: 'ULASAN LANJUTAN',
                title: "Menguak Asal-Usul Tailwind CSS Lanjutan: Sejarah, Filosofi, dan Evolusi di Balik Layar",
                body: `
                    <h4>1. Apa itu Tailwind CSS secara Arsitektural?</h4>
                    <p>Secara fundamental, Tailwind CSS adalah <strong>mesin generator CSS dinamis</strong> berbasis compiler post-processor (PostCSS/NodeJS) yang memindai file proyek secara reaktif untuk merangkum visual atomik minimalis berkinerja tinggi.</p>
                    <h4>2. Siapa Sajakah Tokoh Kunci di Baliknya?</h4>
                    <p>Inovasi ini lahir dari sumbangsih kolaborasi independen tokoh-tokoh berikut:</p>
                    <ul>
                        <li><strong>Adam Wathan</strong>: Pengembang handal asal Kanada selaku inisiator utama pembentuk cikal bakal utilitas, CEO Tailwind Labs.</li>
                        <li><strong>Steve Schoger</strong>: Desainer berbakat perancang harmonisasi palet warna, rasio spasi, dan visual estetik bawaan.</li>
                        <li><strong>Jonathan Reinink</strong> & <strong>David Hemphill</strong>: Arsitek inti pendorong transisi fungsional pustaka ke mesin modular PostCSS.</li>
                    </ul>
                    <h4>3. Mengapa Tailwind Diciptakan?</h4>
                    <p>Pemicu utama berdirinya Tailwind adalah rasa jengkel Adam Wathan terhadap migrasi mendadak framework Bootstrap dari Less ke Sass pada pertengahan 2015. Enggan mengadopsi sintaks Sass yang asing baginya, ia merancang kerangka kerja boilerplate utilitas internalnya yang kemudian dikomersialkan menjadi kesuksesan fenomenal Tailwind UI.</p>
                    <h4>4. Kapan dan Di Mana Terjadi Momentum Ini?</h4>
                    <p>Perumusan konseptual bermula organik sejak 2015 di wilayah Waterloo, Ontario, Kanada. Momentum komersial menyatukan visi terjadi saat perundingan santai di kedai Starbucks setempat, hingga merilis versi publik open-source perdana bertepatan di malam Halloween, 31 Oktober 2017.</p>
                `
            },
            'artikel-situs': {
                category: 'STUDI KASUS POPULER',
                title: "Menembus Batas Kreativitas: Contoh Website Populer Dunia yang Menggunakan Tailwind CSS",
                body: `
                    <p>Untuk membuktikan keandalan framework ini di tingkat produksi skala global dengan traffic masif, simak beberapa studi kasus platform mutakhir berikut:</p>
                    <ol>
                        <li><strong>ChatGPT (OpenAI)</strong>: Dasbor obrolan AI yang melayani jutaan percakapan harian dikonstruksikan sepenuhnya menggunakan kesederhanaan token visual Tailwind CSS guna mempertahankan performa antarmuka yang gesit dan minimalis.</li>
                        <li><strong>Linear Website</strong>: Dikenal luas di kalangan desainer global sebagai kiblat desain antarmuka modern terindah karena detail sudut, pendaran border tipis, dan gradasi mode gelap yang tajam.</li>
                        <li><strong>NASA JPL</strong>: Situs publikasi misi robotika dan sains NASA yang dioptimasi penuh agar memuat data galeri antariksa secara tangguh di koneksi internet lambat sekalipun.</li>
                    </ol>
                    <p>Pemanfaatan instrumen token layout Tailwind CSS pada portal-portal kelas dunia di atas merupakan testimoni tak terbantahkan bahwa paradigma utility-first siap menopang skalabilitas Big Tech modern.</p>
                `
            }
        };

        function openFullArticle(articleKey) {
            const data = articlesRepository[articleKey];
            if (data) {
                document.getElementById('modalArticleCategory').textContent = data.category;
                document.getElementById('modalArticleTitle').textContent = data.title;
                document.getElementById('modalArticleBody').innerHTML = data.body;
                
                // Configure modal share button dynamically
                document.getElementById('btnModalShare').onclick = () => {
                    shareContent(data.title, `${articleKey.replace('-', '_')}.md`);
                };

                // Show modal
                document.getElementById('articleModal').classList.remove('hidden');
            }
        }

        function closeArticleModal() {
            document.getElementById('articleModal').classList.add('hidden');
        }

        // General Helpers
        function copyTextToClipboard(text) {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }

        function triggerDownload(content, filename) {
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(content));
            element.setAttribute('download', filename);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }

        // Safe Notification System
        function showNotification(text) {
            const notif = document.getElementById('globalNotification');
            const notifText = document.getElementById('notifText');
            if (notif && notifText) {
                notifText.textContent = text;
                notif.classList.remove('hidden');
                setTimeout(() => {
                    notif.classList.add('hidden');
                }, 3000);
            }
        }
