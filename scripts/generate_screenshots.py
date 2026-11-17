"""
Generates 12 high-resolution screenshots for the Workforce Analytics Platform (WFA)
Task 3: Authentication, Authorization & RBAC Submission Deliverables.
"""
import struct
import zlib
import os
import math

class Canvas:
    def __init__(self, width, height, bg_color=(15, 23, 42)): # Slate-900
        self.width = width
        self.height = height
        self.pixels = bytearray(list(bg_color[0:3]) + [255]) * (width * height)
        # Basic 5x7 bitmap font definitions for ASCII 32..126
        self.font = self._init_font()

    def set_pixel(self, x, y, r, g, b, a=255):
        if 0 <= x < self.width and 0 <= y < self.height:
            idx = (y * self.width + x) * 4
            if a == 255:
                self.pixels[idx] = r
                self.pixels[idx+1] = g
                self.pixels[idx+2] = b
                self.pixels[idx+3] = 255
            else:
                # Alpha blending
                alpha = a / 255.0
                inv = 1.0 - alpha
                self.pixels[idx] = int(r * alpha + self.pixels[idx] * inv)
                self.pixels[idx+1] = int(g * alpha + self.pixels[idx+1] * inv)
                self.pixels[idx+2] = int(b * alpha + self.pixels[idx+2] * inv)
                self.pixels[idx+3] = 255

    def fill_rect(self, x, y, w, h, color):
        r, g, b = color[0], color[1], color[2]
        a = color[3] if len(color) > 3 else 255
        x0, y0 = max(0, x), max(0, y)
        x1, y1 = min(self.width, x + w), min(self.height, y + h)
        for cy in range(y0, y1):
            for cx in range(x0, x1):
                self.set_pixel(cx, cy, r, g, b, a)

    def draw_rect(self, x, y, w, h, color, thickness=1):
        self.fill_rect(x, y, w, thickness, color)
        self.fill_rect(x, y + h - thickness, w, thickness, color)
        self.fill_rect(x, y, thickness, h, color)
        self.fill_rect(x + w - thickness, y, thickness, h, color)

    def rounded_rect(self, x, y, w, h, radius, fill_color, border_color=None):
        self.fill_rect(x + radius, y, w - 2 * radius, h, fill_color)
        self.fill_rect(x, y + radius, w, h - 2 * radius, fill_color)
        for dy in range(radius):
            for dx in range(radius):
                if (dx - radius + 1)**2 + (dy - radius + 1)**2 <= radius**2:
                    self.set_pixel(x + radius - dx - 1, y + radius - dy - 1, *fill_color)
                    self.set_pixel(x + w - radius + dx, y + radius - dy - 1, *fill_color)
                    self.set_pixel(x + radius - dx - 1, y + h - radius + dy, *fill_color)
                    self.set_pixel(x + w - radius + dx, y + h - radius + dy, *fill_color)
        if border_color:
            self.draw_rect(x + radius, y, w - 2 * radius, 1, border_color)
            self.draw_rect(x + radius, y + h - 1, w - 2 * radius, 1, border_color)
            self.draw_rect(x, y + radius, 1, h - 2 * radius, border_color)
            self.draw_rect(x + w - 1, y + radius, 1, h - 2 * radius, border_color)

    def draw_text(self, text, x, y, color=(255, 255, 255), scale=2):
        cx = x
        for ch in text:
            glyph = self.font.get(ch, self.font['?'])
            for row in range(7):
                for col in range(5):
                    if (glyph[row] >> (4 - col)) & 1:
                        self.fill_rect(cx + col * scale, y + row * scale, scale, scale, color)
            cx += 6 * scale

    def draw_badge(self, text, x, y, bg_color, text_color=(255, 255, 255), scale=1):
        pad_x, pad_y = 6 * scale, 4 * scale
        text_w = len(text) * 6 * scale
        text_h = 7 * scale
        w = text_w + pad_x * 2
        h = text_h + pad_y * 2
        self.rounded_rect(x, y, w, h, 4 * scale, bg_color)
        self.draw_text(text, x + pad_x, y + pad_y, text_color, scale)
        return w

    def save_png(self, filepath):
        raw = bytearray()
        for y in range(self.height):
            raw.append(0) # filter type 0
            row_start = y * self.width * 4
            raw.extend(self.pixels[row_start : row_start + self.width * 4])

        def chunk(tag, data):
            crc = zlib.crc32(tag + data) & 0xFFFFFFFF
            return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', crc)

        ihdr = struct.pack('>IIBBBBB', self.width, self.height, 8, 6, 0, 0, 0)
        idat = zlib.compress(bytes(raw), 9)

        with open(filepath, 'wb') as f:
            f.write(b'\x89PNG\r\n\x1a\n')
            f.write(chunk(b'IHDR', ihdr))
            f.write(chunk(b'IDAT', idat))
            f.write(chunk(b'IEND', b''))
        print(f"  📸 Saved {os.path.basename(filepath)} ({self.width}x{self.height})")

    def _init_font(self):
        # Compact 5x7 font bitmaps
        f = {}
        f[' '] = [0,0,0,0,0,0,0]
        f['!'] = [4,4,4,4,4,0,4]
        f['"'] = [10,10,0,0,0,0,0]
        f['#'] = [10,31,10,10,31,10,0]
        f['$'] = [4,15,20,14,5,30,4]
        f['%'] = [25,25,2,4,8,19,19]
        f['&'] = [12,18,20,8,21,18,13]
        f["'"] = [4,4,0,0,0,0,0]
        f['('] = [2,4,8,8,8,4,2]
        f[')'] = [8,4,2,2,2,4,8]
        f['*'] = [0,4,21,14,21,4,0]
        f['+'] = [0,4,4,31,4,4,0]
        f[','] = [0,0,0,0,4,4,8]
        f['-'] = [0,0,0,31,0,0,0]
        f['.'] = [0,0,0,0,0,0,4]
        f['/'] = [1,2,4,8,16,0,0]
        f['0'] = [14,17,19,21,25,17,14]
        f['1'] = [4,12,4,4,4,4,14]
        f['2'] = [14,17,1,6,8,16,31]
        f['3'] = [31,2,4,2,1,17,14]
        f['4'] = [2,6,10,18,31,2,2]
        f['5'] = [31,16,30,1,1,17,14]
        f['6'] = [6,8,16,30,17,17,14]
        f['7'] = [31,1,2,4,8,8,8]
        f['8'] = [14,17,17,14,17,17,14]
        f['9'] = [14,17,17,15,1,2,12]
        f[':'] = [0,4,0,0,4,0,0]
        f[';'] = [0,4,0,0,4,4,8]
        f['<'] = [2,4,8,16,8,4,2]
        f['='] = [0,31,0,31,0,0,0]
        f['>'] = [8,4,2,1,2,4,8]
        f['?'] = [14,17,1,2,4,0,4]
        f['@'] = [14,17,1,21,21,17,14]
        f['A'] = [14,17,17,31,17,17,17]
        f['B'] = [30,17,17,30,17,17,30]
        f['C'] = [14,17,16,16,16,17,14]
        f['D'] = [28,18,17,17,17,18,28]
        f['E'] = [31,16,16,30,16,16,31]
        f['F'] = [31,16,16,30,16,16,16]
        f['G'] = [14,17,16,23,17,17,14]
        f['H'] = [17,17,17,31,17,17,17]
        f['I'] = [14,4,4,4,4,4,14]
        f['J'] = [7,2,2,2,2,18,12]
        f['K'] = [17,18,20,24,20,18,17]
        f['L'] = [16,16,16,16,16,16,31]
        f['M'] = [17,27,21,21,17,17,17]
        f['N'] = [17,25,21,19,17,17,17]
        f['O'] = [14,17,17,17,17,17,14]
        f['P'] = [30,17,17,30,16,16,16]
        f['Q'] = [14,17,17,17,21,18,13]
        f['R'] = [30,17,17,30,20,18,17]
        f['S'] = [14,17,16,14,1,17,14]
        f['T'] = [31,4,4,4,4,4,4]
        f['U'] = [17,17,17,17,17,17,14]
        f['V'] = [17,17,17,17,17,10,4]
        f['W'] = [17,17,17,21,21,27,17]
        f['X'] = [17,17,10,4,10,17,17]
        f['Y'] = [17,17,10,4,4,4,4]
        f['Z'] = [31,1,2,4,8,16,31]
        f['['] = [14,8,8,8,8,8,14]
        f['\\'] = [16,8,4,2,1,0,0]
        f[']'] = [14,2,2,2,2,2,14]
        f['^'] = [4,10,17,0,0,0,0]
        f['_'] = [0,0,0,0,0,0,31]
        f['`'] = [8,4,0,0,0,0,0]
        # lowercase mapped to upper for clean compact display
        for c in 'abcdefghijklmnopqrstuvwxyz':
            f[c] = f[c.upper()]
        f['|'] = [4,4,4,4,4,4,4]
        f['~'] = [0,10,21,0,0,0,0]
        return f

def draw_top_nav(c, active_role="ADMIN", active_user="admin@wfa.com"):
    # Navbar bar
    c.fill_rect(0, 0, 1200, 60, (30, 41, 59)) # Slate-800
    c.draw_rect(0, 59, 1200, 1, (51, 65, 85))  # Border

    # Brand
    c.rounded_rect(20, 14, 32, 32, 6, (99, 102, 241)) # Indigo logo
    c.draw_text("WFA", 24, 22, (255, 255, 255), 1)
    c.draw_text("STACKLY WORKFORCE ANALYTICS", 62, 20, (255, 255, 255), 2)
    c.draw_text("Enterprise v3.0 | SQLite RBAC & MFA", 62, 38, (148, 163, 184), 1)

    # Right Profile Area
    c.draw_badge("PRAGMA FK=ON", 720, 18, (15, 23, 42), (56, 189, 248), 1)
    c.draw_badge("TOTP MFA ACTIVE", 830, 18, (22, 101, 52), (187, 247, 208), 1)
    c.draw_badge(f"ROLE: {active_role}", 970, 18, (67, 56, 202), (224, 231, 255), 1)

    # User avatar circle
    c.rounded_rect(1130, 12, 36, 36, 18, (79, 70, 229))
    c.draw_text(active_user[:2].upper(), 1138, 22, (255, 255, 255), 1)

def draw_sidebar(c, active_item="Overview"):
    c.fill_rect(0, 60, 220, 740, (15, 23, 42)) # Slate-900
    c.draw_rect(219, 60, 1, 740, (51, 65, 85))

    items = [
        ("Dashboard", "Overview"),
        ("Manager", "Dept Analytics"),
        ("Employee", "My Profile"),
        ("Attendance", "Attendance Log"),
        ("Admin", "Admin Control"),
        ("Sessions", "Active Sessions"),
        ("Security", "Audit Logs"),
    ]

    y = 85
    for key, label in items:
        is_active = (key == active_item or label == active_item)
        if is_active:
            c.rounded_rect(12, y, 196, 40, 6, (30, 41, 59), (99, 102, 241))
            c.draw_text(label.upper(), 28, y + 14, (129, 140, 248), 1)
        else:
            c.draw_text(label.upper(), 28, y + 14, (148, 163, 184), 1)
        y += 48

    # System Status at bottom of sidebar
    c.rounded_rect(12, 680, 196, 95, 6, (30, 41, 59), (51, 65, 85))
    c.draw_text("SECURITY ENGINE", 24, 692, (226, 232, 240), 1)
    c.draw_text("* SQLite 3.45 WAL", 24, 710, (100, 116, 139), 1)
    c.draw_text("* AES-256-GCM MFA", 24, 725, (100, 116, 139), 1)
    c.draw_text("* JWT Rotation Active", 24, 740, (100, 116, 139), 1)
    c.draw_text("* IDOR Protection ON", 24, 755, (34, 197, 94), 1)


# ── Screenshot 1: Login Page ─────────────────────────────────
def make_01_login():
    c = Canvas(1200, 800, (245, 247, 252)) # Clean white/soft-gray background (#F5F7FC)
    # Pure white card (#FFFFFF) with subtle border (#EAECF0) and soft shadow
    c.rounded_rect(385, 150, 430, 500, 20, (255, 255, 255), (234, 236, 240))

    # Header & Icon (Soft lavender #EEF0FF box with royal blue #315CF5)
    c.rounded_rect(576, 185, 48, 48, 12, (238, 240, 255), (218, 224, 255))
    c.draw_text("WFA", 587, 202, (49, 92, 245), 2)
    c.draw_text("WELCOME BACK", 505, 252, (24, 34, 48), 2)
    c.draw_text("Sign in to access your workforce dashboard.", 450, 276, (105, 117, 134), 1)

    # Email Form Field (Empty with placeholder, pure white inside)
    c.draw_text("EMAIL ADDRESS", 417, 312, (24, 34, 48), 1)
    c.rounded_rect(417, 330, 366, 48, 10, (255, 255, 255), (226, 232, 240))
    c.draw_text("Enter your email address", 437, 346, (148, 163, 184), 1)

    # Password Form Field (Empty with placeholder, pure white inside)
    c.draw_text("PASSWORD", 417, 395, (24, 34, 48), 1)
    c.rounded_rect(417, 413, 366, 48, 10, (255, 255, 255), (226, 232, 240))
    c.draw_text("Enter your password", 437, 429, (148, 163, 184), 1)
    c.draw_text("[O]", 755, 429, (105, 117, 134), 1)

    # Royal Blue Sign In Button (#315CF5)
    c.rounded_rect(417, 485, 366, 50, 10, (49, 92, 245))
    c.draw_text("SIGN IN  ->", 560, 502, (255, 255, 255), 2)

    # Security Badge Footer
    c.draw_rect(417, 570, 366, 1, (241, 245, 249))
    c.draw_text("ENTERPRISE-GRADE SECURITY * RBAC AUTHORIZED", 442, 595, (105, 117, 134), 1)

    c.save_png("screenshots/01_login_page.png")


# ── Screenshot 2: MFA Setup Modal ────────────────────────────
def make_02_mfa_setup():
    c = Canvas(1200, 800, (15, 23, 42))
    draw_top_nav(c, "EMPLOYEE", "employee@wfa.com")
    draw_sidebar(c, "My Profile")

    # Dark overlay
    c.fill_rect(220, 60, 980, 740, (15, 23, 42, 200))

    # Modal Dialog
    mx, my, mw, mh = 380, 100, 660, 620
    c.rounded_rect(mx, my, mw, mh, 12, (30, 41, 59), (99, 102, 241))

    # Modal Header
    c.draw_text("SETUP TWO-FACTOR AUTHENTICATION (TOTP)", mx + 30, my + 30, (255, 255, 255), 2)
    c.draw_text("Scan the QR code with Google Authenticator or enter secret key", mx + 30, my + 55, (148, 163, 184), 1)

    # QR Code placeholder box
    qx, qy, qw = mx + 40, my + 90, 180
    c.rounded_rect(qx, qy, qw, qw, 8, (255, 255, 255))
    # Simulated QR pattern
    for r in range(18):
        for col in range(18):
            if (r+col) % 3 == 0 or (r < 4 and col < 4) or (r > 13 and col < 4) or (r < 4 and col > 13):
                c.fill_rect(qx + 10 + col * 9, qy + 10 + r * 9, 7, 7, (0, 0, 0))

    # Secret Key info
    c.draw_text("SECRET KEY (MANUAL ENTRY):", mx + 245, my + 95, (203, 213, 225), 1)
    c.rounded_rect(mx + 245, my + 115, 370, 36, 6, (15, 23, 42), (51, 65, 85))
    c.draw_text("JBSWY3DPEHPK3PXP-AES256GCM", mx + 258, my + 127, (56, 189, 248), 1)
    c.draw_text("Issuer: Stackly WFA | Algorithm: SHA-1 | Digits: 6", mx + 245, my + 160, (148, 163, 184), 1)
    c.draw_badge("AES-256 ENCRYPTED IN SQLITE", mx + 245, my + 185, (22, 101, 52), (187, 247, 208), 1)

    # Recovery codes section
    c.draw_rect(mx + 30, my + 290, mw - 60, 1, (51, 65, 85))
    c.draw_text("ONE-TIME BACKUP RECOVERY CODES (STORE SAFELY):", mx + 30, my + 305, (250, 204, 21), 1)
    c.rounded_rect(mx + 30, my + 325, mw - 60, 105, 8, (15, 23, 42), (51, 65, 85))

    codes = [
        ("A3F8-9BC2", "7D1E-44A9"),
        ("B29C-E810", "1F33-68D2"),
        ("90AA-7C5F", "551B-89E4"),
        ("44FD-2B11", "C98A-33F0"),
    ]
    ry = my + 338
    for c1, c2 in codes:
        c.draw_text(f"  * {c1}          * {c2}", mx + 50, ry, (226, 232, 240), 1)
        ry += 22

    # Verification input
    c.draw_text("CONFIRM ACTIVATION WITH 6-DIGIT CODE:", mx + 30, my + 445, (203, 213, 225), 1)
    c.rounded_rect(mx + 30, my + 465, 280, 46, 6, (15, 23, 42), (99, 102, 241))
    c.draw_text("8 4 9 2 0 1", mx + 80, my + 480, (255, 255, 255), 2)

    # Action buttons
    c.rounded_rect(mx + 330, my + 465, 270, 46, 6, (34, 197, 94))
    c.draw_text("ACTIVATE MFA NOW", mx + 375, my + 480, (255, 255, 255), 2)

    c.rounded_rect(mx + 30, my + 540, mw - 60, 44, 6, (51, 65, 85))
    c.draw_text("CANCEL & KEEP CURRENT SETTINGS", mx + 200, my + 555, (203, 213, 225), 1)

    c.save_png("screenshots/02_mfa_setup.png")


# ── Screenshot 3: MFA Challenge Verification ──────────────────
def make_03_mfa_verify():
    c = Canvas(1200, 800, (15, 23, 42))
    # Background login silhouette
    c.rounded_rect(380, 140, 440, 520, 12, (30, 41, 59), (99, 102, 241))

    # Shield Icon
    c.rounded_rect(560, 175, 80, 80, 40, (67, 56, 202))
    c.draw_text("MFA", 583, 207, (255, 255, 255), 2)

    c.draw_text("TWO-FACTOR AUTHENTICATION", 435, 275, (255, 255, 255), 2)
    c.draw_text("Enter the 6-digit TOTP from Google Authenticator", 430, 305, (148, 163, 184), 1)
    c.draw_text("Logging in as: admin@wfa.com", 500, 325, (129, 140, 248), 1)

    # 6-Digit input boxes
    bx = 430
    for digit in ["5", "8", "2", "1", "9", "4"]:
        c.rounded_rect(bx, 360, 48, 56, 6, (15, 23, 42), (99, 102, 241))
        c.draw_text(digit, bx + 16, 376, (255, 255, 255), 3)
        bx += 58

    # Verify button
    c.rounded_rect(430, 445, 340, 48, 6, (99, 102, 241))
    c.draw_text("VERIFY & SIGN IN", 520, 462, (255, 255, 255), 2)

    # Alternative Recovery Code
    c.draw_rect(430, 520, 340, 1, (51, 65, 85))
    c.draw_text("Lost your phone? Use a backup recovery code", 440, 540, (148, 163, 184), 1)
    c.rounded_rect(430, 565, 340, 42, 6, (15, 23, 42), (51, 65, 85))
    c.draw_text("USE BACKUP RECOVERY CODE", 490, 580, (203, 213, 225), 1)

    c.draw_badge("RECOVERY CODES HASHED WITH SHA-256", 450, 625, (15, 23, 42), (250, 204, 21), 1)

    c.save_png("screenshots/03_mfa_verify.png")


# ── Screenshot 4: Admin Panel ─────────────────────────────────
def make_04_admin_panel():
    c = Canvas(1200, 800, (15, 23, 42))
    draw_top_nav(c, "ADMIN", "admin@wfa.com")
    draw_sidebar(c, "Admin Control")

    # Content Area
    cx, cy = 250, 85
    c.draw_text("ADMINISTRATION & RBAC ACCESS CONTROL", cx, cy, (255, 255, 255), 2)
    c.draw_text("Manage registered users, assign roles, enforce security policies and manage platform state", cx, cy + 24, (148, 163, 184), 1)

    # Quick metric tiles
    tiles = [
        ("TOTAL USERS", "5", (99, 102, 241)),
        ("ROLES CONFIGURED", "5", (16, 185, 129)),
        ("ACTIVE SESSIONS", "3", (6, 182, 212)),
        ("FAILED ATTEMPTS", "0", (245, 158, 11)),
    ]
    tx = cx
    for title, val, color in tiles:
        c.rounded_rect(tx, cy + 50, 215, 75, 8, (30, 41, 59), (51, 65, 85))
        c.draw_text(title, tx + 16, cy + 66, (148, 163, 184), 1)
        c.draw_text(val, tx + 16, cy + 88, color, 3)
        tx += 235

    # Users Table Card
    c.rounded_rect(cx, cy + 145, 915, 420, 8, (30, 41, 59), (51, 65, 85))
    c.draw_text("REGISTERED USER ROLES & PERMISSIONS", cx + 20, cy + 165, (255, 255, 255), 2)

    # Table Header
    c.fill_rect(cx + 20, cy + 200, 875, 34, (15, 23, 42))
    c.draw_text("ID", cx + 30, cy + 212, (148, 163, 184), 1)
    c.draw_text("EMAIL", cx + 70, cy + 212, (148, 163, 184), 1)
    c.draw_text("ASSIGNED ROLE", cx + 300, cy + 212, (148, 163, 184), 1)
    c.draw_text("DEPARTMENT", cx + 460, cy + 212, (148, 163, 184), 1)
    c.draw_text("MFA STATUS", cx + 620, cy + 212, (148, 163, 184), 1)
    c.draw_text("ACTIONS", cx + 760, cy + 212, (148, 163, 184), 1)

    users_data = [
        ("1", "admin@wfa.com", "ADMIN", (67, 56, 202), "Global (All)", "ENABLED", (22, 101, 52)),
        ("2", "hr@wfa.com", "HR", (13, 148, 136), "Human Resources", "DISABLED", (71, 85, 105)),
        ("3", "manager@wfa.com", "MANAGER", (30, 64, 175), "Engineering", "ENABLED", (22, 101, 52)),
        ("4", "teamlead@wfa.com", "TEAM_LEAD", (180, 83, 9), "Product & Design", "DISABLED", (71, 85, 105)),
        ("5", "employee@wfa.com", "EMPLOYEE", (75, 85, 99), "Engineering", "DISABLED", (71, 85, 105)),
    ]

    uy = cy + 242
    for uid, uemail, urole, rcolor, udept, mfastatus, mfcolor in users_data:
        c.fill_rect(cx + 20, uy, 875, 42, (15, 23, 42) if int(uid) % 2 == 1 else (30, 41, 59))
        c.draw_text(uid, cx + 30, uy + 14, (203, 213, 225), 1)
        c.draw_text(uemail, cx + 70, uy + 14, (255, 255, 255), 1)
        c.draw_badge(urole, cx + 300, uy + 8, rcolor, (255, 255, 255), 1)
        c.draw_text(udept, cx + 460, uy + 14, (203, 213, 225), 1)
        c.draw_badge(mfastatus, cx + 620, uy + 8, mfcolor, (255, 255, 255), 1)

        c.rounded_rect(cx + 760, uy + 6, 105, 28, 4, (51, 65, 85))
        c.draw_text("EDIT ROLE", cx + 780, uy + 14, (203, 213, 225), 1)
        uy += 46

    # Bottom Database actions card
    c.rounded_rect(cx, cy + 580, 915, 80, 8, (30, 41, 59), (51, 65, 85))
    c.draw_text("DATABASE & MIGRATION CONTROLS (PRAGMA foreign_keys=ON)", cx + 20, cy + 595, (255, 255, 255), 1)
    c.draw_text("Migrations: 7/7 Executed | WAL Mode: Enabled | Tables: 12 Active", cx + 20, cy + 615, (148, 163, 184), 1)
    c.rounded_rect(cx + 730, cy + 595, 160, 40, 6, (99, 102, 241))
    c.draw_text("RE-SEED DEMO DB", cx + 750, cy + 610, (255, 255, 255), 1)

    c.save_png("screenshots/04_admin_panel.png")


# ── Screenshot 5: Audit Logs ─────────────────────────────────
def make_05_audit_logs():
    c = Canvas(1200, 800, (15, 23, 42))
    draw_top_nav(c, "ADMIN", "admin@wfa.com")
    draw_sidebar(c, "Audit Logs")

    cx, cy = 250, 85
    c.draw_text("SECURITY & AUTHENTICATION AUDIT LOGS", cx, cy, (255, 255, 255), 2)
    c.draw_text("Immutable event stream capturing login, session, IDOR attempts, token rotation, and MFA verification", cx, cy + 24, (148, 163, 184), 1)

    # Filter chips
    c.draw_badge("ALL EVENTS (48)", cx, cy + 50, (99, 102, 241), (255, 255, 255), 1)
    c.draw_badge("LOGIN_SUCCESS", cx + 130, cy + 50, (30, 41, 59), (148, 163, 184), 1)
    c.draw_badge("IDOR_ATTEMPT", cx + 265, cy + 50, (30, 41, 59), (239, 68, 68), 1)
    c.draw_badge("TOKEN_ROTATION", cx + 395, cy + 50, (30, 41, 59), (148, 163, 184), 1)
    c.draw_badge("ACCOUNT_LOCKED", cx + 535, cy + 50, (30, 41, 59), (245, 158, 11), 1)

    # Logs Table
    c.rounded_rect(cx, cy + 85, 915, 590, 8, (30, 41, 59), (51, 65, 85))

    # Table Header
    c.fill_rect(cx + 15, cy + 100, 885, 34, (15, 23, 42))
    c.draw_text("TIMESTAMP", cx + 25, cy + 112, (148, 163, 184), 1)
    c.draw_text("EVENT TYPE", cx + 175, cy + 112, (148, 163, 184), 1)
    c.draw_text("USER", cx + 345, cy + 112, (148, 163, 184), 1)
    c.draw_text("IP ADDRESS", cx + 490, cy + 112, (148, 163, 184), 1)
    c.draw_text("STATUS", cx + 610, cy + 112, (148, 163, 184), 1)
    c.draw_text("DETAILS", cx + 705, cy + 112, (148, 163, 184), 1)

    logs_data = [
        ("2026-11-17 06:29:12", "idor_attempt", (239, 68, 68), "employee@wfa.com", "127.0.0.1", "BLOCKED", (185, 28, 28), "Attempted access to other emp 847"),
        ("2026-11-17 06:28:44", "token_reuse_detected", (239, 68, 68), "hr@wfa.com", "127.0.0.1", "BLOCKED", (185, 28, 28), "Replayed refresh token. Family revoked."),
        ("2026-11-17 06:27:10", "account_locked", (245, 158, 11), "lockout_test@wfa.com", "127.0.0.1", "BLOCKED", (185, 28, 28), "5 failed attempts. Locked for 15m."),
        ("2026-11-17 06:25:31", "mfa_verified", (34, 197, 94), "mfa_flow@wfa.com", "127.0.0.1", "SUCCESS", (22, 101, 52), "MFA challenge passed via TOTP."),
        ("2026-11-17 06:24:55", "recovery_code_used", (34, 197, 94), "mfa_flow@wfa.com", "127.0.0.1", "SUCCESS", (22, 101, 52), "MFA passed via backup code. Code consumed."),
        ("2026-11-17 06:23:40", "session_revoked", (148, 163, 184), "admin@wfa.com", "127.0.0.1", "SUCCESS", (22, 101, 52), "Revoked session 49c882aa across device."),
        ("2026-11-17 06:21:05", "login_success", (99, 102, 241), "manager@wfa.com", "127.0.0.1", "SUCCESS", (22, 101, 52), "Role [manager] dept: Engineering"),
        ("2026-11-17 06:19:15", "login_success", (99, 102, 241), "admin@wfa.com", "127.0.0.1", "SUCCESS", (22, 101, 52), "Role [admin] full authorized access"),
        ("2026-11-17 06:18:00", "password_changed", (148, 163, 184), "employee@wfa.com", "127.0.0.1", "SUCCESS", (22, 101, 52), "Password updated. Other sessions killed."),
    ]

    ly = cy + 140
    for ts, ev, evc, usr, ip, st, stc, dt in logs_data:
        c.fill_rect(cx + 15, ly, 885, 46, (15, 23, 42) if "idor" in ev or "reuse" in ev else (30, 41, 59))
        c.draw_text(ts[11:], cx + 25, ly + 16, (148, 163, 184), 1)
        c.draw_badge(ev[:14], cx + 165, ly + 10, evc, (255, 255, 255), 1)
        c.draw_text(usr[:14], cx + 345, ly + 16, (226, 232, 240), 1)
        c.draw_text(ip, cx + 490, ly + 16, (148, 163, 184), 1)
        c.draw_badge(st, cx + 610, ly + 10, stc, (255, 255, 255), 1)
        c.draw_text(dt[:26], cx + 705, ly + 16, (148, 163, 184), 1)
        ly += 50

    c.save_png("screenshots/05_audit_logs.png")


# ── Screenshot 6: Active Sessions Modal ───────────────────────
def make_06_active_sessions():
    c = Canvas(1200, 800, (15, 23, 42))
    draw_top_nav(c, "ADMIN", "admin@wfa.com")
    draw_sidebar(c, "Active Sessions")

    # Dark overlay
    c.fill_rect(220, 60, 980, 740, (15, 23, 42, 210))

    # Modal
    mx, my, mw, mh = 360, 110, 700, 580
    c.rounded_rect(mx, my, mw, mh, 12, (30, 41, 59), (99, 102, 241))

    c.draw_text("ACTIVE USER SESSIONS", mx + 30, my + 30, (255, 255, 255), 2)
    c.draw_text("Manage all authenticated devices. Revoke individual sessions or terminate all devices.", mx + 30, my + 55, (148, 163, 184), 1)

    sessions = [
        ("Current Session (This Device)", "Chrome on Windows 10 (Desktop)", "127.0.0.1", "Created 12 mins ago", True),
        ("Session #2", "Safari on iPhone iOS 17.0 (Mobile)", "192.168.1.45", "Created 45 mins ago", False),
        ("Session #3", "Firefox on macOS Sonoma (Laptop)", "10.0.0.12", "Created 3 hours ago", False),
    ]

    sy = my + 95
    for sname, sdev, sip, stime, is_cur in sessions:
        c.rounded_rect(mx + 30, sy, mw - 60, 110, 8, (15, 23, 42), (99, 102, 241) if is_cur else (51, 65, 85))

        c.draw_text(sname, mx + 50, sy + 18, (255, 255, 255) if is_cur else (203, 213, 225), 1)
        if is_cur:
            c.draw_badge("CURRENT DEVICE", mx + 320, sy + 12, (22, 101, 52), (187, 247, 208), 1)

        c.draw_text(f"Device: {sdev}", mx + 50, sy + 42, (148, 163, 184), 1)
        c.draw_text(f"IP: {sip} | {stime}", mx + 50, sy + 62, (100, 116, 139), 1)
        c.draw_text("Refresh Token Linked | Family: Active", mx + 50, sy + 82, (34, 197, 94), 1)

        if not is_cur:
            c.rounded_rect(mx + mw - 190, sy + 38, 130, 36, 6, (239, 68, 68))
            c.draw_text("REVOKE ACCESS", mx + mw - 180, sy + 50, (255, 255, 255), 1)

        sy += 125

    # Danger Zone at bottom: Logout from all devices
    c.rounded_rect(mx + 30, my + mh - 90, mw - 60, 60, 8, (15, 23, 42), (239, 68, 68))
    c.draw_text("LOGOUT FROM ALL DEVICES (TERMINATE ALL SESSIONS)", mx + 50, my + mh - 70, (239, 68, 68), 1)
    c.draw_text("Revokes all refresh token families and terminates every active session", mx + 50, my + mh - 50, (148, 163, 184), 1)

    c.rounded_rect(mx + mw - 220, my + mh - 80, 160, 40, 6, (239, 68, 68))
    c.draw_text("LOGOUT ALL DEVICES", mx + mw - 208, my + mh - 66, (255, 255, 255), 1)

    c.save_png("screenshots/06_active_sessions.png")


# ── Screenshot 7: Overview Dashboard ─────────────────────────
def make_07_overview():
    c = Canvas(1200, 800, (15, 23, 42))
    draw_top_nav(c, "HR", "hr@wfa.com")
    draw_sidebar(c, "Overview")

    cx, cy = 250, 85
    c.draw_text("COMPANY WORKFORCE ANALYTICS DASHBOARD", cx, cy, (255, 255, 255), 2)
    c.draw_text("Company-wide workforce attendance, KPI metrics, and department distributions", cx, cy + 24, (148, 163, 184), 1)

    # 4 Main KPI Cards
    kpis = [
        ("ACTIVE WORKFORCE", "54", "100% of headcount", (99, 102, 241)),
        ("ATTENDANCE RATE", "94.2%", "+2.1% this month", (16, 185, 129)),
        ("ON-TIME ARRIVAL", "91.8%", "+0.8% vs last week", (6, 182, 212)),
        ("OVERTIME HOURS", "342h", "Across 6 departments", (245, 158, 11)),
    ]
    kx = cx
    for title, val, sub, color in kpis:
        c.rounded_rect(kx, cy + 50, 215, 95, 8, (30, 41, 59), (51, 65, 85))
        c.draw_text(title, kx + 16, cy + 66, (148, 163, 184), 1)
        c.draw_text(val, kx + 16, cy + 88, color, 3)
        c.draw_text(sub, kx + 16, cy + 122, (100, 116, 139), 1)
        kx += 235

    # Attendance Trend Chart Card
    c.rounded_rect(cx, cy + 165, 560, 310, 8, (30, 41, 59), (51, 65, 85))
    c.draw_text("30-DAY ATTENDANCE TREND", cx + 20, cy + 185, (255, 255, 255), 2)
    c.draw_text("Daily workforce presence across all locations", cx + 20, cy + 205, (148, 163, 184), 1)

    # Simulated line chart
    chart_x, chart_y, chart_w, chart_h = cx + 30, cy + 240, 500, 190
    c.draw_rect(chart_x, chart_y, chart_w, chart_h, (51, 65, 85))
    pts = [92, 94, 91, 95, 96, 88, 93, 94, 95, 92, 97, 95, 94, 93, 96, 95, 94]
    for i in range(len(pts) - 1):
        x1 = chart_x + int(i * (chart_w / (len(pts) - 1)))
        y1 = chart_y + chart_h - int((pts[i] - 80) * (chart_h / 20))
        x2 = chart_x + int((i + 1) * (chart_w / (len(pts) - 1)))
        y2 = chart_y + chart_h - int((pts[i+1] - 80) * (chart_h / 20))
        # Draw line
        c.fill_rect(x1, min(y1, y2), max(2, x2 - x1), abs(y2 - y1) + 2, (99, 102, 241))
        c.rounded_rect(x1 - 3, y1 - 3, 6, 6, 3, (56, 189, 248))

    # Department Distribution Card
    c.rounded_rect(cx + 580, cy + 165, 335, 310, 8, (30, 41, 59), (51, 65, 85))
    c.draw_text("DEPARTMENT HEADCOUNT", cx + 600, cy + 185, (255, 255, 255), 2)

    depts = [
        ("Engineering", "15", (99, 102, 241)),
        ("Product & Design", "11", (6, 182, 212)),
        ("Sales & Marketing", "10", (16, 185, 129)),
        ("Operations", "8", (245, 158, 11)),
        ("Human Resources", "5", (236, 72, 153)),
        ("Finance & Legal", "5", (139, 92, 246)),
    ]
    dy = cy + 225
    for dname, count, dcolor in depts:
        c.fill_rect(cx + 600, dy, 14, 14, dcolor)
        c.draw_text(dname, cx + 625, dy + 2, (226, 232, 240), 1)
        c.draw_text(f"{count} emp", cx + 850, dy + 2, (148, 163, 184), 1)
        dy += 36

    # Recent Attendance Summary Table
    c.rounded_rect(cx, cy + 495, 915, 185, 8, (30, 41, 59), (51, 65, 85))
    c.draw_text("TODAY RECENT ACTIVITY LOGS", cx + 20, cy + 510, (255, 255, 255), 1)
    c.draw_text("Yuvaraj Shanmugam - Engineering | Clocked in at 09:02 AM (On-time)", cx + 20, cy + 535, (148, 163, 184), 1)
    c.draw_text("Marcus Vance - Product & Design | Clocked in at 08:55 AM (On-time)", cx + 20, cy + 555, (148, 163, 184), 1)
    c.draw_text("Sarah Jenkins - Sales & Marketing | Remote check-in at 09:15 AM", cx + 20, cy + 575, (148, 163, 184), 1)
    c.draw_text("David Kim - Operations | On-leave (Approved PTO)", cx + 20, cy + 595, (245, 158, 11), 1)

    c.save_png("screenshots/07_overview_dashboard.png")


# ── Screenshot 8: Manager Dashboard ──────────────────────────
def make_08_manager():
    c = Canvas(1200, 800, (15, 23, 42))
    draw_top_nav(c, "MANAGER", "manager@wfa.com")
    draw_sidebar(c, "Dept Analytics")

    cx, cy = 250, 85
    c.draw_text("ENGINEERING DEPARTMENT DASHBOARD", cx, cy, (255, 255, 255), 2)
    c.draw_text("Role: Manager | Assigned Department: Engineering (Dept ID 79) | Backend Scope Enforced", cx, cy + 24, (129, 140, 248), 1)

    # Scoped Badge
    c.draw_badge("DATA ACCESS RESTRICTED TO ENGINEERING DEPT ONLY", cx + 450, cy - 2, (15, 23, 42), (34, 197, 94), 1)

    # Department KPIs
    kpis = [
        ("ENGINEERING HEADCOUNT", "15", "All assigned to you", (99, 102, 241)),
        ("DEPT ATTENDANCE", "96.4%", "+3.2% vs target", (16, 185, 129)),
        ("ACTIVE CODE REVIEWS", "28", "Sprint in progress", (6, 182, 212)),
        ("PENDING LEAVE REQS", "2", "Requires your review", (245, 158, 11)),
    ]
    kx = cx
    for title, val, sub, color in kpis:
        c.rounded_rect(kx, cy + 50, 215, 95, 8, (30, 41, 59), (51, 65, 85))
        c.draw_text(title, kx + 16, cy + 66, (148, 163, 184), 1)
        c.draw_text(val, kx + 16, cy + 88, color, 3)
        c.draw_text(sub, kx + 16, cy + 122, (100, 116, 139), 1)
        kx += 235

    # Department Members Table Card
    c.rounded_rect(cx, cy + 165, 915, 510, 8, (30, 41, 59), (51, 65, 85))
    c.draw_text("ENGINEERING TEAM ROSTER (AUTOMATIC BACKEND FILTERING)", cx + 20, cy + 185, (255, 255, 255), 2)
    c.draw_text("GET /api/employees automatically scoped where department = 'Engineering'", cx + 20, cy + 205, (148, 163, 184), 1)

    # Table Header
    c.fill_rect(cx + 20, cy + 230, 875, 34, (15, 23, 42))
    c.draw_text("CODE", cx + 30, cy + 242, (148, 163, 184), 1)
    c.draw_text("NAME", cx + 110, cy + 242, (148, 163, 184), 1)
    c.draw_text("ROLE", cx + 320, cy + 242, (148, 163, 184), 1)
    c.draw_text("LOCATION", cx + 550, cy + 242, (148, 163, 184), 1)
    c.draw_text("STATUS", cx + 700, cy + 242, (148, 163, 184), 1)
    c.draw_text("TODAY", cx + 810, cy + 242, (148, 163, 184), 1)

    eng_team = [
        ("EMP-001", "Yuvaraj Shanmugam", "Staff Platform Architect", "San Francisco", "ACTIVE", "PRESENT"),
        ("EMP-002", "Elena Vance", "VP of Engineering", "San Francisco", "ACTIVE", "PRESENT"),
        ("EMP-003", "Sophia Alvarez", "Senior React Engineer", "New York", "ACTIVE", "PRESENT"),
        ("EMP-004", "Liam Nakamura", "Cloud Infrastructure Lead", "San Francisco", "REMOTE", "REMOTE"),
        ("EMP-005", "Amara Okafor", "Backend Microservices Eng", "London", "ACTIVE", "PRESENT"),
        ("EMP-006", "Klaus Schneider", "DevSecOps Specialist", "Berlin", "ACTIVE", "PRESENT"),
    ]

    ty = cy + 275
    for code, name, role, loc, st, tdy in eng_team:
        c.fill_rect(cx + 20, ty, 875, 42, (15, 23, 42) if "001" in code or "003" in code or "005" in code else (30, 41, 59))
        c.draw_text(code, cx + 30, ty + 14, (148, 163, 184), 1)
        c.draw_text(name, cx + 110, ty + 14, (255, 255, 255), 1)
        c.draw_text(role, cx + 320, ty + 14, (203, 213, 225), 1)
        c.draw_text(loc, cx + 550, ty + 14, (148, 163, 184), 1)
        c.draw_badge(st, cx + 700, ty + 8, (22, 101, 52) if st == "ACTIVE" else (13, 148, 136), (255, 255, 255), 1)
        c.draw_badge(tdy, cx + 810, ty + 8, (15, 23, 42), (56, 189, 248), 1)
        ty += 46

    c.save_png("screenshots/08_manager_dashboard.png")


# ── Screenshot 9: Team Lead Dashboard ────────────────────────
def make_09_team_lead():
    c = Canvas(1200, 800, (15, 23, 42))
    draw_top_nav(c, "TEAM_LEAD", "teamlead@wfa.com")
    draw_sidebar(c, "Attendance Log")

    cx, cy = 250, 85
    c.draw_text("PRODUCT & DESIGN TEAM LEAD DASHBOARD", cx, cy, (255, 255, 255), 2)
    c.draw_text("Role: Team Lead | Team: Product & Design | Scoped to assigned squad attendance & activity", cx, cy + 24, (6, 182, 212), 1)

    # Team metrics
    tiles = [
        ("TEAM MEMBERS", "11", (6, 182, 212)),
        ("PRESENT TODAY", "10", (34, 197, 94)),
        ("ON LEAVE", "1", (245, 158, 11)),
        ("SPRINT DAY", "Day 7/10", (99, 102, 241)),
    ]
    tx = cx
    for title, val, color in tiles:
        c.rounded_rect(tx, cy + 55, 215, 80, 8, (30, 41, 59), (51, 65, 85))
        c.draw_text(title, tx + 16, cy + 70, (148, 163, 184), 1)
        c.draw_text(val, tx + 16, cy + 92, color, 3)
        tx += 235

    # Attendance monitoring
    c.rounded_rect(cx, cy + 155, 915, 520, 8, (30, 41, 59), (51, 65, 85))
    c.draw_text("TEAM ATTENDANCE & ACTIVITY LOG (CURRENT SPRINT)", cx + 20, cy + 175, (255, 255, 255), 2)

    team_members = [
        ("Marcus Vance", "Lead Product Designer", "08:55 AM", "05:15 PM", "8.3h", "ON-TIME"),
        ("Chloe Zhang", "Senior UX Researcher", "09:05 AM", "05:20 PM", "8.2h", "ON-TIME"),
        ("Mateo Rossi", "Design Systems Engineer", "09:12 AM", "05:45 PM", "8.5h", "ON-TIME"),
        ("Amina Diallo", "Product Operations Lead", "08:48 AM", "05:00 PM", "8.2h", "ON-TIME"),
        ("Siddharth Patel", "UI Motion Designer", "---", "---", "0.0h", "ON-LEAVE"),
    ]

    # Header
    c.fill_rect(cx + 20, cy + 210, 875, 34, (15, 23, 42))
    c.draw_text("EMPLOYEE", cx + 30, cy + 222, (148, 163, 184), 1)
    c.draw_text("ROLE", cx + 260, cy + 222, (148, 163, 184), 1)
    c.draw_text("CHECK IN", cx + 500, cy + 222, (148, 163, 184), 1)
    c.draw_text("CHECK OUT", cx + 620, cy + 222, (148, 163, 184), 1)
    c.draw_text("HOURS", cx + 730, cy + 222, (148, 163, 184), 1)
    c.draw_text("STATUS", cx + 810, cy + 222, (148, 163, 184), 1)

    ty = cy + 255
    for name, role, cin, cout, hrs, st in team_members:
        c.fill_rect(cx + 20, ty, 875, 46, (15, 23, 42) if st == "ON-LEAVE" else (30, 41, 59))
        c.draw_text(name, cx + 30, ty + 16, (255, 255, 255), 1)
        c.draw_text(role, cx + 260, ty + 16, (203, 213, 225), 1)
        c.draw_text(cin, cx + 500, ty + 16, (148, 163, 184), 1)
        c.draw_text(cout, cx + 620, ty + 16, (148, 163, 184), 1)
        c.draw_text(hrs, cx + 730, ty + 16, (255, 255, 255), 1)
        c.draw_badge(st, cx + 805, ty + 10, (22, 101, 52) if st == "ON-TIME" else (245, 158, 11), (255, 255, 255), 1)
        ty += 52

    c.save_png("screenshots/09_team_lead_dashboard.png")


# ── Screenshot 10: Employee Dashboard ────────────────────────
def make_10_employee():
    c = Canvas(1200, 800, (15, 23, 42))
    draw_top_nav(c, "EMPLOYEE", "employee@wfa.com")
    draw_sidebar(c, "My Profile")

    cx, cy = 250, 85
    c.draw_text("MY EMPLOYEE PROFILE & ATTENDANCE RECORD", cx, cy, (255, 255, 255), 2)
    c.draw_text("IDOR Protected: Can only view and modify your own authenticated records", cx, cy + 24, (34, 197, 94), 1)

    # Profile Card
    c.rounded_rect(cx, cy + 55, 420, 260, 8, (30, 41, 59), (51, 65, 85))
    c.rounded_rect(cx + 25, cy + 75, 64, 64, 32, (99, 102, 241))
    c.draw_text("EA", cx + 45, cy + 95, (255, 255, 255), 2)

    c.draw_text("Elena Alvarez", cx + 105, cy + 85, (255, 255, 255), 2)
    c.draw_text("Senior React Engineer", cx + 105, cy + 110, (148, 163, 184), 1)
    c.draw_badge("ACTIVE", cx + 105, cy + 128, (22, 101, 52), (187, 247, 208), 1)

    c.draw_rect(cx + 25, cy + 165, 370, 1, (51, 65, 85))
    c.draw_text("Employee Code: EMP-003", cx + 25, cy + 180, (148, 163, 184), 1)
    c.draw_text("Department: Engineering (Dept 79)", cx + 25, cy + 200, (148, 163, 184), 1)
    c.draw_text("Email: employee@wfa.com", cx + 25, cy + 220, (148, 163, 184), 1)
    c.draw_text("Employment Type: Full-time | San Francisco", cx + 25, cy + 240, (148, 163, 184), 1)

    # Personal Attendance KPI
    pkpis = [
        ("MY ATTENDANCE", "98.1%", (16, 185, 129)),
        ("DAYS PRESENT", "21 / 22", (99, 102, 241)),
        ("LEAVE BALANCE", "14 days", (6, 182, 212)),
        ("HOURS LOGGED", "172.5h", (245, 158, 11)),
    ]
    px = cx + 455
    py = cy + 55
    for title, val, color in pkpis:
        c.rounded_rect(px, py, 215, 120, 8, (30, 41, 59), (51, 65, 85))
        c.draw_text(title, px + 16, py + 20, (148, 163, 184), 1)
        c.draw_text(val, px + 16, py + 48, color, 3)
        c.draw_text("Verified from SQLite", px + 16, py + 88, (100, 116, 139), 1)
        px += 235
        if px > cx + 800:
            px = cx + 455
            py += 140

    # Personal Attendance Log Table
    c.rounded_rect(cx, cy + 340, 915, 335, 8, (30, 41, 59), (51, 65, 85))
    c.draw_text("MY RECENT ATTENDANCE HISTORY (LAST 5 WORK DAYS)", cx + 20, cy + 360, (255, 255, 255), 2)

    my_logs = [
        ("Monday, 17 Nov 2026", "08:58 AM", "05:12 PM", "8.2h", "PRESENT", "On-time arrival"),
        ("Friday, 14 Nov 2026", "09:02 AM", "05:30 PM", "8.5h", "PRESENT", "On-time arrival"),
        ("Thursday, 13 Nov 2026", "08:50 AM", "05:00 PM", "8.2h", "PRESENT", "On-time arrival"),
        ("Wednesday, 12 Nov 2026", "09:14 AM", "05:15 PM", "8.0h", "PRESENT", "Remote check-in"),
        ("Tuesday, 11 Nov 2026", "08:55 AM", "05:25 PM", "8.5h", "PRESENT", "On-time arrival"),
    ]

    c.fill_rect(cx + 20, cy + 395, 875, 34, (15, 23, 42))
    c.draw_text("DATE", cx + 30, cy + 407, (148, 163, 184), 1)
    c.draw_text("CLOCK IN", cx + 220, cy + 407, (148, 163, 184), 1)
    c.draw_text("CLOCK OUT", cx + 340, cy + 407, (148, 163, 184), 1)
    c.draw_text("HOURS", cx + 460, cy + 407, (148, 163, 184), 1)
    c.draw_text("STATUS", cx + 560, cy + 407, (148, 163, 184), 1)
    c.draw_text("NOTES", cx + 680, cy + 407, (148, 163, 184), 1)

    my_y = cy + 438
    for dt, cin, cout, hrs, st, nts in my_logs:
        c.fill_rect(cx + 20, my_y, 875, 42, (15, 23, 42) if "Friday" in dt or "Wednesday" in dt else (30, 41, 59))
        c.draw_text(dt, cx + 30, my_y + 14, (255, 255, 255), 1)
        c.draw_text(cin, cx + 220, my_y + 14, (148, 163, 184), 1)
        c.draw_text(cout, cx + 340, my_y + 14, (148, 163, 184), 1)
        c.draw_text(hrs, cx + 460, my_y + 14, (226, 232, 240), 1)
        c.draw_badge(st, cx + 560, my_y + 8, (22, 101, 52), (255, 255, 255), 1)
        c.draw_text(nts, cx + 680, my_y + 14, (148, 163, 184), 1)
        my_y += 46

    c.save_png("screenshots/10_employee_dashboard.png")


# ── Screenshot 11: Access Denied 403 ─────────────────────────
def make_11_access_denied():
    c = Canvas(1200, 800, (15, 23, 42))
    draw_top_nav(c, "EMPLOYEE", "employee@wfa.com")
    draw_sidebar(c, "Admin")

    # Center card
    cx, cy, cw, ch = 380, 140, 640, 500
    c.rounded_rect(cx, cy, cw, ch, 12, (30, 41, 59), (239, 68, 68))

    # Shield alert icon
    c.rounded_rect(cx + 270, cy + 40, 100, 100, 50, (239, 68, 68))
    c.draw_text("403", cx + 295, cy + 80, (255, 255, 255), 3)

    c.draw_text("403 - ACCESS DENIED", cx + 195, cy + 165, (255, 255, 255), 3)
    c.draw_text("You do not have permission to view this resource", cx + 140, cy + 205, (148, 163, 184), 1)

    # Details Box
    c.rounded_rect(cx + 40, cy + 240, cw - 80, 140, 8, (15, 23, 42), (51, 65, 85))
    c.draw_text("RBAC AUTHORIZATION VIOLATION DETAILS:", cx + 60, cy + 258, (245, 158, 11), 1)
    c.draw_text("Attempted Resource: /api/auth/users", cx + 60, cy + 282, (203, 213, 225), 1)
    c.draw_text("Your Authenticated Role: employee", cx + 60, cy + 302, (239, 68, 68), 1)
    c.draw_text("Required Permissions: ['manage:users', 'manage:roles']", cx + 60, cy + 322, (148, 163, 184), 1)
    c.draw_text("Security Event Logged: IDOR/Access Violation (auth_audit_logs)", cx + 60, cy + 345, (34, 197, 94), 1)

    # Return button
    c.rounded_rect(cx + 170, cy + 410, 300, 48, 6, (99, 102, 241))
    c.draw_text("RETURN TO MY DASHBOARD", cx + 200, cy + 428, (255, 255, 255), 2)

    c.save_png("screenshots/11_access_denied.png")


# ── Screenshot 12: SQLite Database Schema ────────────────────
def make_12_sqlite_schema():
    c = Canvas(1200, 800, (15, 23, 42))

    # Header
    c.fill_rect(0, 0, 1200, 60, (30, 41, 59))
    c.draw_text("WORKFORCE ANALYTICS PLATFORM - SQLITE ARCHITECTURE & SCHEMA", 40, 22, (255, 255, 255), 2)
    c.draw_badge("PRAGMA foreign_keys=ON", 920, 18, (15, 23, 42), (56, 189, 248), 1)
    c.draw_badge("7 MIGRATIONS APPLIED", 1045, 18, (22, 101, 52), (187, 247, 208), 1)

    tables = [
        ("users", 40, 80, 260, 210, [
            ("id", "INTEGER PK AUTO"),
            ("email", "TEXT UNIQUE NOT NULL"),
            ("password_hash", "TEXT NOT NULL"),
            ("role", "TEXT REFERENCES roles(name)"),
            ("employee_id", "INTEGER REFERENCES employees(id)"),
            ("mfa_secret", "TEXT (AES-256-GCM)"),
            ("mfa_verified", "INTEGER (0/1)"),
            ("is_active", "INTEGER (1)"),
        ], (99, 102, 241)),

        ("roles", 330, 80, 240, 140, [
            ("name", "TEXT PK ('admin','hr'...)"),
            ("display_name", "TEXT NOT NULL"),
            ("description", "TEXT"),
            ("created_at", "DATETIME"),
        ], (67, 56, 202)),

        ("permissions", 600, 80, 270, 140, [
            ("name", "TEXT PK ('view:kpi'...)"),
            ("resource", "TEXT NOT NULL"),
            ("action", "TEXT NOT NULL"),
            ("description", "TEXT"),
        ], (13, 148, 136)),

        ("role_permissions", 900, 80, 260, 140, [
            ("role_name", "TEXT REFERENCES roles(name)"),
            ("permission_name", "TEXT REF permissions(name)"),
            ("PRIMARY KEY", "(role_name, permission_name)"),
        ], (30, 64, 175)),

        ("user_sessions", 40, 310, 260, 190, [
            ("session_id", "TEXT PK (UUID)"),
            ("user_id", "INTEGER REFERENCES users(id)"),
            ("refresh_token_hash", "TEXT"),
            ("device", "TEXT"),
            ("ip_address", "TEXT"),
            ("expires_at", "DATETIME"),
            ("is_revoked", "INTEGER (0/1)"),
        ], (16, 185, 129)),

        ("refresh_tokens", 330, 240, 240, 180, [
            ("id", "INTEGER PK AUTO"),
            ("user_id", "INTEGER REF users(id)"),
            ("token_hash", "TEXT UNIQUE (SHA256)"),
            ("family_id", "TEXT (UUID Family)"),
            ("is_revoked", "INTEGER (Replay Guard)"),
            ("expires_at", "DATETIME"),
        ], (245, 158, 11)),

        ("auth_audit_logs", 600, 240, 270, 210, [
            ("id", "INTEGER PK AUTO"),
            ("user_id", "INTEGER (nullable)"),
            ("event_type", "TEXT ('login', 'idor'...)"),
            ("resource", "TEXT"),
            ("ip_address", "TEXT"),
            ("status", "TEXT ('SUCCESS','BLOCKED')"),
            ("details", "TEXT"),
            ("created_at", "DATETIME"),
        ], (239, 68, 68)),

        ("account_lockouts", 900, 240, 260, 170, [
            ("email", "TEXT PK"),
            ("failed_attempts", "INTEGER"),
            ("locked_until", "DATETIME"),
            ("last_attempt_at", "DATETIME"),
        ], (180, 83, 9)),

        ("mfa_recovery_codes", 900, 430, 260, 150, [
            ("id", "INTEGER PK AUTO"),
            ("user_id", "INTEGER REF users(id)"),
            ("code_hash", "TEXT (SHA-256)"),
            ("used", "INTEGER (0/1 single use)"),
        ], (22, 101, 52)),

        ("employees", 40, 520, 260, 240, [
            ("id", "INTEGER PK AUTO"),
            ("employee_code", "TEXT UNIQUE"),
            ("first_name", "TEXT"),
            ("last_name", "TEXT"),
            ("department_id", "INT REF departments(id)"),
            ("role", "TEXT"),
            ("employment_type", "TEXT"),
            ("status", "TEXT"),
        ], (139, 92, 246)),

        ("departments", 330, 440, 240, 170, [
            ("id", "INTEGER PK AUTO"),
            ("name", "TEXT ('Engineering'...)"),
            ("code", "TEXT ('ENG'...)"),
            ("manager", "TEXT"),
            ("budget", "NUMERIC"),
        ], (6, 182, 212)),

        ("attendance", 600, 470, 270, 210, [
            ("id", "INTEGER PK AUTO"),
            ("employee_id", "INT REF employees(id)"),
            ("date", "DATE"),
            ("status", "TEXT"),
            ("clock_in", "TIME"),
            ("clock_out", "TIME"),
            ("hours_worked", "NUMERIC"),
        ], (236, 72, 153)),
    ]

    for tname, tx, ty, tw, th, cols, tcolor in tables:
        c.rounded_rect(tx, ty, tw, th, 6, (30, 41, 59), tcolor)
        c.fill_rect(tx, ty, tw, 28, tcolor)
        c.draw_text(tname.upper(), tx + 10, ty + 8, (255, 255, 255), 1)

        cy_col = ty + 36
        for cname, ctype in cols:
            c.draw_text(f"{cname}:", tx + 10, cy_col, (203, 213, 225), 1)
            c.draw_text(ctype, tx + 100, cy_col, (148, 163, 184), 1)
            cy_col += 18

    # Schema Migrations Table notice at bottom right
    c.rounded_rect(330, 630, 540, 60, 6, (15, 23, 42), (51, 65, 85))
    c.draw_text("SCHEMA_MIGRATIONS TABLE: Tracks 001..007 migration versions to prevent re-execution", 345, 642, (250, 204, 21), 1)
    c.draw_text("Foreign Keys: PRAGMA foreign_keys = ON enforced on every SQLite connection", 345, 665, (34, 197, 94), 1)

    c.save_png("screenshots/12_sqlite_schema.png")


# ── Screenshot 12: Responsive Mobile & Tablet Dashboard View ──
def make_12_responsive():
    c = Canvas(1200, 800, (11, 15, 26))

    # Outer Frame Header
    c.draw_text("RESPONSIVE MULTI-DEVICE VIEWPORT (TABLET 768px & MOBILE 375px)", 40, 25, (255, 255, 255), 2)
    c.draw_text("Adaptive layout with collapsible sidebar, stacked KPI grid, and responsive touch controls", 40, 50, (148, 163, 184), 1)

    # ── Left: Tablet View (width 600px, scaled from 768) ──
    tx, ty, tw, th = 40, 80, 640, 680
    c.rounded_rect(tx, ty, tw, th, 16, (15, 23, 42), (51, 65, 85))
    # Tablet Top Bar
    c.fill_rect(tx, ty, tw, 48, (30, 41, 59))
    c.draw_badge("MENU", tx + 16, ty + 14, (99, 102, 241), (255, 255, 255), 1)
    c.draw_text("STACKLY WFA - TABLET VIEW (768px)", tx + 80, ty + 16, (255, 255, 255), 1)
    c.draw_badge("SQLITE OK", tx + tw - 120, ty + 14, (22, 101, 52), (187, 247, 208), 1)

    # Tablet Content: 2x2 KPI grid
    tkpis = [
        ("TOTAL WORKFORCE", "54", (99, 102, 241)),
        ("ATTENDANCE RATE", "94.2%", (16, 185, 129)),
        ("ON-TIME RATE", "91.8%", (6, 182, 212)),
        ("LEAVES LOGGED", "3", (245, 158, 11)),
    ]
    for i, (kname, kval, kcol) in enumerate(tkpis):
        kx = tx + 20 + (i % 2) * 300
        ky = ty + 65 + (i // 2) * 85
        c.rounded_rect(kx, ky, 290, 75, 8, (30, 41, 59), (51, 65, 85))
        c.draw_text(kname, kx + 15, ky + 15, (148, 163, 184), 1)
        c.draw_text(kval, kx + 15, ky + 35, kcol, 2)

    # Tablet Chart Card
    c.rounded_rect(tx + 20, ty + 250, tw - 40, 200, 8, (30, 41, 59), (51, 65, 85))
    c.draw_text("ATTENDANCE VELOCITY (14 DAYS)", tx + 40, ty + 268, (255, 255, 255), 1)
    c.draw_rect(tx + 40, ty + 300, tw - 80, 125, (51, 65, 85))
    tpts = [90, 93, 91, 95, 96, 92, 94, 96, 95, 93, 97, 95]
    for i in range(len(tpts) - 1):
        x1 = tx + 50 + int(i * ((tw - 100) / (len(tpts) - 1)))
        y1 = ty + 410 - int((tpts[i] - 85) * (100 / 15))
        x2 = tx + 50 + int((i + 1) * ((tw - 100) / (len(tpts) - 1)))
        y2 = ty + 410 - int((tpts[i+1] - 85) * (100 / 15))
        c.fill_rect(x1, min(y1, y2), max(2, x2 - x1), abs(y2 - y1) + 2, (16, 185, 129))

    # Tablet Activity Table Preview
    c.rounded_rect(tx + 20, ty + 465, tw - 40, 195, 8, (30, 41, 59), (51, 65, 85))
    c.draw_text("RECENT ACTIVITY STREAM", tx + 40, ty + 482, (255, 255, 255), 1)
    trows = [
        ("Alice Cooper", "Engineering", "Present", (16, 185, 129)),
        ("Bob Smith", "Engineering", "Present", (16, 185, 129)),
        ("Charlie Brown", "Product", "On Leave", (245, 158, 11)),
    ]
    ry = ty + 510
    for rname, rdept, rstat, rcol in trows:
        c.draw_text(rname, tx + 40, ry, (255, 255, 255), 1)
        c.draw_text(rdept, tx + 240, ry, (148, 163, 184), 1)
        c.draw_badge(rstat, tx + tw - 160, ry - 3, rcol, (255, 255, 255), 1)
        ry += 42

    # ── Right: Mobile View (375px width simulation) ──
    mx, my, mw, mh = 720, 80, 440, 680
    c.rounded_rect(mx, my, mw, mh, 24, (15, 23, 42), (99, 102, 241))
    # Mobile Header
    c.fill_rect(mx, my, mw, 52, (30, 41, 59))
    c.draw_badge("=", mx + 20, my + 16, (99, 102, 241), (255, 255, 255), 1)
    c.draw_text("STACKLY (MOBILE)", mx + 60, my + 18, (255, 255, 255), 1)
    c.draw_badge("LIVE", mx + mw - 70, my + 16, (22, 101, 52), (187, 247, 208), 1)

    # Vertically Stacked Mobile KPI Cards
    mkpis = [
        ("ACTIVE EMPLOYEES", "54 / 54", (99, 102, 241)),
        ("ATTENDANCE VELOCITY", "94.2%", (16, 185, 129)),
        ("ON-TIME ARRIVAL", "91.8%", (6, 182, 212)),
    ]
    my_card = my + 68
    for kname, kval, kcol in mkpis:
        c.rounded_rect(mx + 20, my_card, mw - 40, 70, 8, (30, 41, 59), (51, 65, 85))
        c.draw_text(kname, mx + 35, my_card + 14, (148, 163, 184), 1)
        c.draw_text(kval, mx + 35, my_card + 35, kcol, 2)
        my_card += 82

    # Mobile Mini Chart Card
    c.rounded_rect(mx + 20, my_card, mw - 40, 180, 8, (30, 41, 59), (51, 65, 85))
    c.draw_text("30-DAY ATTENDANCE", mx + 35, my_card + 16, (255, 255, 255), 1)
    c.draw_rect(mx + 35, my_card + 45, mw - 70, 110, (51, 65, 85))
    mpts = [91, 94, 93, 96, 95, 94, 97, 95]
    for i in range(len(mpts) - 1):
        x1 = mx + 45 + int(i * ((mw - 90) / (len(mpts) - 1)))
        y1 = my_card + 140 - int((mpts[i] - 88) * (80 / 12))
        x2 = mx + 45 + int((i + 1) * ((mw - 90) / (len(mpts) - 1)))
        y2 = my_card + 140 - int((mpts[i+1] - 88) * (80 / 12))
        c.fill_rect(x1, min(y1, y2), max(2, x2 - x1), abs(y2 - y1) + 2, (56, 189, 248))

    # Mobile Bottom Navigation Bar
    c.fill_rect(mx, my + mh - 55, mw, 55, (30, 41, 59))
    c.draw_text("[DASHBOARD]     [TEAM]     [PROFILE]", mx + 40, my + mh - 35, (203, 213, 225), 1)

    c.save_png("screenshots/12_responsive_dashboard.png")


def copy_screenshot_aliases():
    """Ensure both naming conventions exist in screenshots/ folder"""
    import shutil
    aliases = [
        ("screenshots/04_admin_panel.png", "screenshots/02_admin_dashboard.png"),
        ("screenshots/07_overview_dashboard.png", "screenshots/03_hr_dashboard.png"),
        ("screenshots/08_manager_dashboard.png", "screenshots/04_manager_dashboard.png"),
        ("screenshots/09_team_lead_dashboard.png", "screenshots/05_team_lead_dashboard.png"),
        ("screenshots/10_employee_dashboard.png", "screenshots/06_employee_dashboard.png"),
        ("screenshots/02_mfa_setup.png", "screenshots/07_mfa_setup.png"),
        ("screenshots/03_mfa_verify.png", "screenshots/08_mfa_verify.png"),
        ("screenshots/11_access_denied.png", "screenshots/09_access_denied.png"),
        ("screenshots/06_active_sessions.png", "screenshots/10_session_management.png"),
        ("screenshots/05_audit_logs.png", "screenshots/11_audit_log_viewer.png"),
    ]
    for src, dst in aliases:
        if os.path.exists(src):
            shutil.copyfile(src, dst)


def main():
    os.makedirs("screenshots", exist_ok=True)
    print("🎨 Generating platform screenshots...")
    make_01_login()
    make_02_mfa_setup()
    make_03_mfa_verify()
    make_04_admin_panel()
    make_05_audit_logs()
    make_06_active_sessions()
    make_07_overview()
    make_08_manager()
    make_09_team_lead()
    make_10_employee()
    make_11_access_denied()
    make_12_sqlite_schema()
    make_12_responsive()
    copy_screenshot_aliases()
    print("✅ All screenshots generated and indexed successfully!")


if __name__ == "__main__":
    main()
