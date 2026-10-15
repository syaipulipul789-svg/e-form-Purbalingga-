#!/usr/bin/env bash
#
# test-login.sh — Uji otomatis alur autentikasi & RBAC panel admin
#                 E-Form Kabupaten Purbalingga
#
# Prasyarat : Stack sedang berjalan (sudo make up).
# Variabel  : BASE_URL  (default http://localhost:8088/api/v1)
#             PASSWORD  (default Purbalingga2026!)
# Contoh    : ./test-login.sh
#             BASE_URL=http://localhost:8080/api/v1 ./test-login.sh
#
set -u

BASE_URL="${BASE_URL:-http://localhost:8088/api/v1}"
PASSWORD="${PASSWORD:-Purbalingga2026!}"
BASE_URL="${BASE_URL%/}"
API_ROOT="${BASE_URL%/api/v1}"
TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

PASS=0
FAIL=0

green()  { printf '\033[32m%s\033[0m\n' "$*"; }
red()    { printf '\033[31m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }

record() {
  local label="$1" ok="$2"
  if [ "$ok" = "0" ]; then
    green "  PASS  $label"
    PASS=$((PASS + 1))
  else
    red "  FAIL  $label"
    FAIL=$((FAIL + 1))
  fi
}

# json_field 'data.token' — membaca field bertingkat dari $TMP_FILE via python3.
json_field() {
  python3 -c '
import sys, json
data = json.load(sys.stdin)
cur = data
for key in sys.argv[1].split("."):
    if not isinstance(cur, dict) or key not in cur:
        sys.exit(1)
    cur = cur[key]
print(cur)
' "$1" < "$TMP_FILE" 2>/dev/null || true
}

# login_token <email> -> cetak HTTP status ke stdout; isi respon di $TMP_FILE
login_token() {
  local email="$1"
  curl -s -o "$TMP_FILE" -w '%{http_code}' \
    -X POST -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\"}" \
    "$BASE_URL/auth/login"
}

echo "=============================================================="
echo "  E-Form Purbalingga — Uji Login & RBAC"
echo "=============================================================="
yellow "  Base URL : $BASE_URL"
yellow "  API Root : $API_ROOT"
echo

# 1. Health check
code=$(curl -s -o "$TMP_FILE" -w '%{http_code}' "$API_ROOT/health")
if [ "$code" = "200" ] && grep -q '"healthy"' "$TMP_FILE"; then
  record "Health check /health" 0
else
  record "Health check /health (HTTP $code)" 1
fi

# 2. Login Super Admin
super_token=""
super_role=""
code=$(login_token "superadmin@purbalinggakab.go.id")
if [ "$code" = "200" ]; then
  super_token=$(json_field 'data.token')
  super_role=$(json_field 'data.user.role')
fi
if [ "$code" = "200" ] && [ -n "$super_token" ] && [ "$super_role" = "SUPER_ADMIN" ]; then
  record "Login Super Admin -> role SUPER_ADMIN" 0
else
  record "Login Super Admin (HTTP $code, role=$super_role)" 1
fi

# 3. /auth/me Super Admin
code=$(curl -s -o "$TMP_FILE" -w '%{http_code}' \
  -H "Authorization: Bearer $super_token" "$BASE_URL/auth/me")
me_role=$(json_field 'data.role')
if [ "$code" = "200" ] && [ "$me_role" = "SUPER_ADMIN" ]; then
  record "/auth/me Super Admin" 0
else
  record "/auth/me Super Admin (HTTP $code, role=$me_role)" 1
fi

# 4. /admin/ping Super Admin
code=$(curl -s -o "$TMP_FILE" -w '%{http_code}' \
  -H "Authorization: Bearer $super_token" "$BASE_URL/admin/ping")
ping_role=$(json_field 'data.role')
if [ "$code" = "200" ] && [ "$ping_role" = "SUPER_ADMIN" ]; then
  record "/admin/ping Super Admin" 0
else
  record "/admin/ping Super Admin (HTTP $code)" 1
fi

# 5. Login Admin Dinas Kesehatan
dinkes_token=""
code=$(login_token "admin.dinkes@purbalinggakab.go.id")
dinkes_role=$(json_field 'data.user.role')
dinkes_opd=$(json_field 'data.user.opd.kode_opd')
if [ "$code" = "200" ] && [ -n "$code" ]; then
  dinkes_token=$(json_field 'data.token')
fi
if [ "$code" = "200" ] && [ -n "$dinkes_token" ] && [ "$dinkes_role" = "ADMIN_OPD" ] && [ "$dinkes_opd" = "DINKES" ]; then
  record "Login Admin Dinkes -> role ADMIN_OPD, OPD=$dinkes_opd" 0
else
  record "Login Admin Dinkes (HTTP $code, role=$dinkes_role, opd=$dinkes_opd)" 1
fi

# 6. /admin/ping Admin Dinkes
code=$(curl -s -o "$TMP_FILE" -w '%{http_code}' \
  -H "Authorization: Bearer $dinkes_token" "$BASE_URL/admin/ping")
ping_role=$(json_field 'data.role')
if [ "$code" = "200" ] && [ "$ping_role" = "ADMIN_OPD" ]; then
  record "/admin/ping Admin Dinkes" 0
else
  record "/admin/ping Admin Dinkes (HTTP $code)" 1
fi

# 7. Login Admin Dinas Sosial
code=$(login_token "admin.dinsos@purbalinggakab.go.id")
dinsos_role=$(json_field 'data.user.role')
if [ "$code" = "200" ] && [ "$dinsos_role" = "ADMIN_OPD" ]; then
  record "Login Admin Dinsos -> role ADMIN_OPD" 0
else
  record "Login Admin Dinsos (HTTP $code, role=$dinsos_role)" 1
fi

# 8. Password salah -> 401 INVALID_CREDENTIALS
code=$(curl -s -o "$TMP_FILE" -w '%{http_code}' \
  -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"superadmin@purbalinggakab.go.id\",\"password\":\"password-salah\"}" \
  "$BASE_URL/auth/login")
err_code=$(json_field 'error.code')
if [ "$code" = "401" ] && [ "$err_code" = "INVALID_CREDENTIALS" ]; then
  record "Password salah -> 401 INVALID_CREDENTIALS" 0
else
  record "Password salah (HTTP $code, code=$err_code)" 1
fi

# 9. /auth/me tanpa token -> 401
code=$(curl -s -o "$TMP_FILE" -w '%{http_code}' "$BASE_URL/auth/me")
if [ "$code" = "401" ]; then
  record "/auth/me tanpa token -> 401" 0
else
  record "/auth/me tanpa token (HTTP $code)" 1
fi

# 10. /auth/me token acak -> 401
code=$(curl -s -o "$TMP_FILE" -w '%{http_code}' \
  -H "Authorization: Bearer token.acak.tidak.valid" "$BASE_URL/auth/me")
if [ "$code" = "401" ]; then
  record "/auth/me token acak -> 401" 0
else
  record "/auth/me token acak (HTTP $code)" 1
fi

echo
echo "--------------------------------------------------------------"
echo "  Ringkasan: $PASS lulus, $FAIL gagal"
echo "--------------------------------------------------------------"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0