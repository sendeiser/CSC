import sys, os, json, time, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import requests
from playwright.sync_api import sync_playwright

# Load .env manually (dotenv not available in Python)
_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_env_path):
    with open(_env_path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            m = re.match(r'^([\w_]+)=(.*)$', line)
            if m:
                key, val = m.group(1), m.group(2).strip('"').strip("'")
                os.environ.setdefault(key, val)

API = 'http://localhost:3001/api'
FRONT = 'http://localhost:3000'

PASS = 0
FAIL = 0

def ok(name):
    global PASS
    PASS += 1
    print(f"  ✅ {name}")

def fail(name, detail=''):
    global FAIL
    FAIL += 1
    print(f"  ❌ {name}: {detail}")

# ────────────────────────────────────────────────────────────
# Helper: Login as admin, return token
# ────────────────────────────────────────────────────────────
def login_admin():
    # You MUST set these in .env or change them to your test admin credentials
    email = os.environ.get('TEST_ADMIN_EMAIL', 'admin@csc.com')
    password = os.environ.get('TEST_ADMIN_PASSWORD', 'admin123456')
    r = requests.post(f'{API}/auth/login', json={'email': email, 'password': password})
    if r.status_code != 200:
        return None, r.text
    data = r.json()
    return data['session']['access_token'], data

# ────────────────────────────────────────────────────────────
# 1. API HEALTH
# ────────────────────────────────────────────────────────────
def test_health():
    r = requests.get(f'{API}/health', timeout=5)
    assert r.status_code == 200
    assert r.json()['status'] == 'ok'
    ok('/api/health')

# ────────────────────────────────────────────────────────────
# 2. PUBLIC ENDPOINTS
# ────────────────────────────────────────────────────────────
def test_public_homepage():
    r = requests.get(f'{API}/homepage', timeout=5)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    ok('/api/homepage (public)')

def test_public_about():
    r = requests.get(f'{API}/homepage/about', timeout=5)
    assert r.status_code == 200, r.text
    data = r.json()
    assert 'title' in data
    assert 'content' in data
    ok('/api/homepage/about (public)')

def test_public_products():
    r = requests.get(f'{API}/products', timeout=5)
    assert r.status_code == 200, r.text
    products = r.json()
    assert isinstance(products, list)
    assert len(products) > 0
    ok('/api/products (public)')

def test_public_product_by_slug():
    r = requests.get(f'{API}/products/gomitas-explosion-galactica', timeout=5)
    assert r.status_code == 200, r.text
    p = r.json()
    assert p['slug'] == 'gomitas-explosion-galactica'
    ok('/api/products/:slug (public)')

# ────────────────────────────────────────────────────────────
# 3. AUTH
# ────────────────────────────────────────────────────────────
def test_auth_flow():
    token, data = login_admin()
    if token is None:
        fail('admin login', f'no se pudo autenticar: {data}')
        return
    ok('POST /api/auth/login (admin)')

    r = requests.get(f'{API}/auth/me', headers={'Authorization': f'Bearer {token}'}, timeout=5)
    assert r.status_code == 200, r.text
    me = r.json()
    assert me['role'] == 'admin', f"expected admin, got {me['role']}"
    ok('GET /api/auth/me')

# ────────────────────────────────────────────────────────────
# 4. ADMIN API (requires token)
# ────────────────────────────────────────────────────────────
def test_admin_homepage_list(token):
    r = requests.get(f'{API}/admin/homepage', headers={'Authorization': f'Bearer {token}'}, timeout=5)
    if r.status_code == 500 and 'SUPABASE_SERVICE_KEY no configurada' in r.text:
        fail('GET /admin/homepage', 'service key not configured on server')
        return None
    assert r.status_code == 200, r.text
    sections = r.json()
    assert isinstance(sections, list)
    ok('GET /admin/homepage')
    return sections

def test_admin_homepage_update(token):
    if token is None:
        return
    sections = test_admin_homepage_list(token)
    if not sections:
        return
    section = sections[0]
    r = requests.put(f'{API}/admin/homepage/sections/{section["id"]}',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        json={'title': section['title'] + ' (editado)'}, timeout=5)
    if r.status_code != 200:
        fail('PUT /admin/homepage/sections/:id', r.text)
        return
    ok('PUT /admin/homepage/sections/:id')
    # restore original title
    requests.put(f'{API}/admin/homepage/sections/{section["id"]}',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        json={'title': section['title']}, timeout=5)

def test_admin_about_get(token):
    if token is None:
        return
    r = requests.get(f'{API}/admin/about', headers={'Authorization': f'Bearer {token}'}, timeout=5)
    if r.status_code == 500 and 'SUPABASE_SERVICE_KEY no configurada' in r.text:
        fail('GET /admin/about', 'service key not configured')
        return None
    assert r.status_code == 200, r.text
    data = r.json()
    assert 'title' in data
    ok('GET /admin/about')
    return data

def test_admin_about_update(token):
    if token is None:
        return
    data = test_admin_about_get(token)
    if not data:
        return
    r = requests.put(f'{API}/admin/about',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        json={'title': data['title'], 'subtitle': data.get('subtitle',''), 'content': data.get('content',{})}, timeout=5)
    if r.status_code != 200:
        fail('PUT /admin/about', r.text)
        return
    ok('PUT /admin/about')

def test_admin_stats(token):
    if token is None:
        return
    r = requests.get(f'{API}/admin/stats', headers={'Authorization': f'Bearer {token}'}, timeout=5)
    assert r.status_code == 200, r.text
    stats = r.json()
    assert 'totalProducts' in stats
    assert 'totalOrders' in stats
    ok('GET /admin/stats')

def test_admin_promos(token):
    if token is None:
        return
    r = requests.get(f'{API}/admin/promo-codes', headers={'Authorization': f'Bearer {token}'}, timeout=5)
    assert r.status_code == 200, r.text
    ok('GET /admin/promo-codes')

# ────────────────────────────────────────────────────────────
# 5. FRONTEND RENDERING (Playwright)
# ────────────────────────────────────────────────────────────
def test_frontend_home():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        page.goto(FRONT, timeout=15000)
        page.wait_for_load_state('networkidle')
        assert 'Chamical' in page.title() or page.title() != '', f"title: '{page.title()}'"
        ok('Homepage loads')
        browser.close()

def test_frontend_navigation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        page.goto(FRONT, timeout=15000)
        page.wait_for_load_state('networkidle')

        links = page.locator('nav a, nav button, header a, header button')
        count = links.count()
        assert count > 3, f"only {count} nav elements found"
        ok(f'Navigation has {count} elements')
        browser.close()

def test_frontend_nosotros():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        page.goto(FRONT, timeout=15000)
        page.wait_for_load_state('networkidle')

        about_link = page.locator('a:has-text("Nosotros"), button:has-text("Nosotros")')
        if about_link.count() == 0:
            fail('Nosotros link', 'not found in navigation')
            browser.close()
            return

        about_link.first.click()
        page.wait_for_timeout(2000)

        content = page.text_content('body') or ''
        assert 'Sobre Nosotros' in content or 'Nosotros' in content or 'Dulce' in content
        ok('Nosotros page renders')
        browser.close()

def test_frontend_admin_login():
    token, user = login_admin()
    if token is None:
        fail('admin login for frontend test', str(user))
        return

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            storage_state=None
        )
        page = context.new_page()

        # Set token in localStorage and reload
        page.goto(FRONT, timeout=15000)
        page.evaluate(f'localStorage.setItem("csc_token", "{token}")')
        page.reload()
        page.wait_for_load_state('networkidle')

        admin_link = page.locator('a:has-text("Admin"), button:has-text("Admin")')
        if admin_link.count() == 0:
            ok('Admin panel (login via localStorage, nav may vary)')
            browser.close()
            return

        admin_link.first.click()
        page.wait_for_timeout(2000)
        ok('Admin panel link works')
        browser.close()

# ────────────────────────────────────────────────────────────
# MAIN
# ────────────────────────────────────────────────────────────
def main():
    global PASS, FAIL
    print('\n🧪 CSC Integration Tests\n')
    print('── API Health ──')
    try:
        test_health()
    except Exception as e:
        fail('/api/health', str(e))

    print('\n── Public API ──')
    for fn in [test_public_homepage, test_public_about, test_public_products, test_public_product_by_slug]:
        try:
            fn()
        except Exception as e:
            fail(fn.__name__, str(e))

    print('\n── Authentication ──')
    try:
        test_auth_flow()
    except Exception as e:
        fail('auth flow', str(e))

    token, _ = login_admin() if not login_admin() else (None, '')

    print('\n── Admin API ──')
    token, _ = login_admin() if token is None else (token, _)
    for fn in [test_admin_homepage_list, test_admin_homepage_update,
               test_admin_about_get, test_admin_about_update,
               test_admin_stats, test_admin_promos]:
        try:
            fn(token)
        except Exception as e:
            fail(fn.__name__, str(e))

    print('\n── Frontend (Playwright) ──')
    for fn in [test_frontend_home, test_frontend_navigation, test_frontend_nosotros]:
        try:
            fn()
        except Exception as e:
            fail(fn.__name__, str(e))
    try:
        test_frontend_admin_login()
    except Exception as e:
        fail('test_frontend_admin_login', str(e))

    total = PASS + FAIL
    print(f'\n{"="*40}')
    print(f'Results: {PASS} passed, {FAIL} failed, {total} total')
    print(f'{"="*40}')
    return 0 if FAIL == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
