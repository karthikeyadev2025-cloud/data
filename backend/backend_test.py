"""
Nikki Tech Labs Contact Scraper — Comprehensive Backend API Test Suite
Tests all endpoints with real credentials and validates responses.
"""
import requests
import sys
import time
from datetime import datetime

# Backend URL from env
BASE_URL = "https://contact-scraper-13.preview.emergentagent.com/api"

# Test credentials
SUPER_ADMIN_EMAIL = "adexosindia@gmail.com"
SUPER_ADMIN_PASSWORD = "Karthi@20252026"
DEMO_EMAIL = "demo@nikkitechlabs.com"
DEMO_PASSWORD = "Demo@1234"

class APITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.super_admin_token = None
        self.demo_token = None
        self.demo_tenant_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def test(self, name, method, endpoint, expected_status, data=None, token=None, 
             params=None, validate_fn=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 [{self.tests_run}] {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=timeout)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                # Additional validation if provided
                if validate_fn:
                    try:
                        resp_data = response.json() if response.text else {}
                        validation_result = validate_fn(resp_data)
                        if not validation_result:
                            success = False
                            print(f"❌ Failed - Validation failed")
                            self.failed_tests.append(f"{name}: Validation failed")
                        else:
                            self.tests_passed += 1
                            print(f"✅ Passed - Status: {response.status_code}")
                    except Exception as e:
                        success = False
                        print(f"❌ Failed - Validation error: {e}")
                        self.failed_tests.append(f"{name}: Validation error - {e}")
                else:
                    self.tests_passed += 1
                    print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")

            return success, response.json() if response.text and 'application/json' in response.headers.get('content-type', '') else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def run_all_tests(self):
        print("=" * 80)
        print("NIKKI TECH LABS CONTACT SCRAPER - BACKEND API TEST SUITE")
        print("=" * 80)

        # ========== AUTH TESTS ==========
        print("\n" + "=" * 80)
        print("AUTH TESTS")
        print("=" * 80)

        # Test 1: Super admin login
        success, resp = self.test(
            "Super admin login",
            "POST", "auth/login", 200,
            data={"email": SUPER_ADMIN_EMAIL, "password": SUPER_ADMIN_PASSWORD},
            validate_fn=lambda r: r.get("user", {}).get("role") == "super_admin" and "token" in r
        )
        if success:
            self.super_admin_token = resp.get("token")
            print(f"   Super admin token obtained")

        # Test 2: Demo tenant login
        success, resp = self.test(
            "Demo tenant login",
            "POST", "auth/login", 200,
            data={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
            validate_fn=lambda r: (r.get("user", {}).get("role") == "tenant_admin" and 
                                   "tenant" in r and r.get("tenant", {}).get("credits_balance") is not None)
        )
        if success:
            self.demo_token = resp.get("token")
            self.demo_tenant_id = resp.get("tenant", {}).get("id")
            self.demo_credits = resp.get("tenant", {}).get("credits_balance")
            print(f"   Demo tenant token obtained, credits: {self.demo_credits}")

        # Test 3: Signup new tenant
        test_email = f"test_{int(time.time())}@test.com"
        success, resp = self.test(
            "Signup new tenant",
            "POST", "auth/signup", 200,
            data={"email": test_email, "password": "Test@1234", "full_name": "Test User"},
            validate_fn=lambda r: r.get("tenant", {}).get("credits_balance") == 25
        )
        new_tenant_token = resp.get("token") if success else None
        new_tenant_id = resp.get("tenant", {}).get("id") if success else None

        # Test 4: GET /auth/me with demo token
        self.test(
            "GET /auth/me (demo tenant)",
            "GET", "auth/me", 200,
            token=self.demo_token,
            validate_fn=lambda r: r.get("user", {}).get("email") == DEMO_EMAIL
        )

        # Test 5: Invalid credentials
        self.test(
            "Login with invalid credentials",
            "POST", "auth/login", 401,
            data={"email": "wrong@test.com", "password": "wrong"}
        )

        # Test 6: No token (401)
        self.test(
            "GET /auth/me without token",
            "GET", "auth/me", 401
        )

        # ========== TENANT ROUTES TESTS ==========
        print("\n" + "=" * 80)
        print("TENANT ROUTES TESTS")
        print("=" * 80)

        # Test 7: GET /plans
        self.test(
            "GET /plans",
            "GET", "plans", 200,
            validate_fn=lambda r: len(r.get("plans", [])) == 4
        )

        # Test 8: GET /branding
        self.test(
            "GET /branding",
            "GET", "branding", 200,
            validate_fn=lambda r: "Nikki Tech Labs" in r.get("footer_text", "")
        )

        # Test 9: GET /dashboard/stats
        self.test(
            "GET /dashboard/stats (demo tenant)",
            "GET", "dashboard/stats", 200,
            token=self.demo_token,
            validate_fn=lambda r: "credits_balance" in r
        )

        # Test 10: GET /transactions
        self.test(
            "GET /transactions (demo tenant)",
            "GET", "transactions", 200,
            token=self.demo_token,
            validate_fn=lambda r: "transactions" in r
        )

        # ========== SEARCH TESTS ==========
        print("\n" + "=" * 80)
        print("SEARCH TESTS")
        print("=" * 80)

        # Test 11: Google Maps search (REAL - allow 90 seconds)
        print("   ⏳ This test may take up to 90 seconds (real Google Places API + website enrichment)...")
        success, resp = self.test(
            "POST /search (google_maps) - REAL",
            "POST", "search", 200,
            data={
                "scraper_type": "google_maps",
                "query": "restaurants",
                "location": "Chennai, India",
                "max_results": 5
            },
            token=self.demo_token,
            timeout=120,
            validate_fn=lambda r: (r.get("results_count", 0) >= 3 and
                                   sum(1 for res in r.get("results", []) if res.get("phone")) >= 2)
        )
        google_maps_job_id = resp.get("job_id") if success else None

        # Test 12: YouTube search
        success, resp = self.test(
            "POST /search (youtube)",
            "POST", "search", 200,
            data={
                "scraper_type": "youtube",
                "query": "south indian recipes",
                "max_results": 3
            },
            token=self.demo_token,
            timeout=30,
            validate_fn=lambda r: (r.get("results_count", 0) >= 3 and
                                   all(res.get("extra", {}).get("video_id") for res in r.get("results", [])))
        )
        youtube_job_id = resp.get("job_id") if success else None

        # Test 13: Website scraper
        success, resp = self.test(
            "POST /search (website)",
            "POST", "search", 200,
            data={
                "scraper_type": "website",
                "query": "https://razorpay.com",
                "max_results": 1
            },
            token=self.demo_token,
            timeout=30,
            validate_fn=lambda r: r.get("results_count", 0) == 1
        )
        website_job_id = resp.get("job_id") if success else None

        # Test 14: Google Search (should fail - no SerpAPI key)
        self.test(
            "POST /search (google_search) - no SerpAPI key",
            "POST", "search", 400,
            data={
                "scraper_type": "google_search",
                "query": "test query",
                "max_results": 5
            },
            token=self.demo_token
        )

        # Test 15: Instagram (should fail - no Apify token)
        self.test(
            "POST /search (instagram) - no Apify token",
            "POST", "search", 400,
            data={
                "scraper_type": "instagram",
                "query": "test",
                "max_results": 5
            },
            token=self.demo_token
        )

        # Test 16: GET /search (list searches)
        self.test(
            "GET /search (list searches)",
            "GET", "search", 200,
            token=self.demo_token,
            validate_fn=lambda r: len(r.get("searches", [])) >= 3
        )

        # Test 17: GET /search/{job_id}
        if google_maps_job_id:
            self.test(
                "GET /search/{job_id}",
                "GET", f"search/{google_maps_job_id}", 200,
                token=self.demo_token,
                validate_fn=lambda r: r.get("job", {}).get("id") == google_maps_job_id
            )

        # Test 18: Export CSV
        if google_maps_job_id:
            success, _ = self.test(
                "GET /search/{job_id}/export?format=csv",
                "GET", f"search/{google_maps_job_id}/export", 200,
                token=self.demo_token,
                params={"format": "csv"}
            )

        # Test 19: Export XLSX
        if google_maps_job_id:
            success, _ = self.test(
                "GET /search/{job_id}/export?format=xlsx",
                "GET", f"search/{google_maps_job_id}/export", 200,
                token=self.demo_token,
                params={"format": "xlsx"}
            )

        # Test 20: Insufficient credits (create new tenant with 25 credits, request 40)
        if new_tenant_token:
            self.test(
                "POST /search with insufficient credits",
                "POST", "search", 402,
                data={
                    "scraper_type": "google_maps",
                    "query": "test",
                    "location": "test",
                    "max_results": 40
                },
                token=new_tenant_token
            )

        # Test 21: Cross-tenant access (try to access demo's search with new tenant token)
        if new_tenant_token and google_maps_job_id:
            self.test(
                "GET /search/{job_id} - cross-tenant (403)",
                "GET", f"search/{google_maps_job_id}", 403,
                token=new_tenant_token
            )

        # ========== PAYMENT TESTS ==========
        print("\n" + "=" * 80)
        print("PAYMENT TESTS")
        print("=" * 80)

        # Test 22: GET /payments/config (Razorpay not configured)
        self.test(
            "GET /payments/config (not configured)",
            "GET", "payments/config", 200,
            token=self.demo_token,
            validate_fn=lambda r: r.get("enabled") == False
        )

        # Test 23: POST /payments/create-order (should fail - no Razorpay)
        self.test(
            "POST /payments/create-order (no Razorpay)",
            "POST", "payments/create-order", 400,
            data={"credits": 100},
            token=self.demo_token
        )

        # ========== ADMIN TESTS ==========
        print("\n" + "=" * 80)
        print("ADMIN TESTS")
        print("=" * 80)

        # Test 24: Admin routes require super_admin (403 with tenant token)
        self.test(
            "GET /admin/stats with tenant token (403)",
            "GET", "admin/stats", 403,
            token=self.demo_token
        )

        # Test 25: GET /admin/stats with super admin token
        self.test(
            "GET /admin/stats (super admin)",
            "GET", "admin/stats", 200,
            token=self.super_admin_token,
            validate_fn=lambda r: all(k in r for k in ["tenants_count", "active_tenants", "total_searches", "revenue_inr"])
        )

        # Test 26: GET /admin/tenants
        success, resp = self.test(
            "GET /admin/tenants",
            "GET", "admin/tenants", 200,
            token=self.super_admin_token,
            validate_fn=lambda r: len(r.get("tenants", [])) >= 2
        )

        # Test 27: PATCH /admin/tenants/{id} - add credits
        if self.demo_tenant_id:
            success, resp = self.test(
                "PATCH /admin/tenants/{id} - add 50 credits",
                "PATCH", f"admin/tenants/{self.demo_tenant_id}", 200,
                data={"add_credits": 50},
                token=self.super_admin_token,
                validate_fn=lambda r: "tenant" in r and r["tenant"].get("credits_balance") is not None
            )

        # Test 28: PATCH /admin/tenants/{id} - disable tenant
        if new_tenant_id:
            self.test(
                "PATCH /admin/tenants/{id} - disable tenant",
                "PATCH", f"admin/tenants/{new_tenant_id}", 200,
                data={"is_active": False},
                token=self.super_admin_token
            )
            
            # Test 29: Disabled tenant cannot search
            self.test(
                "POST /search with disabled tenant (403)",
                "POST", "search", 403,
                data={
                    "scraper_type": "website",
                    "query": "https://test.com",
                    "max_results": 1
                },
                token=new_tenant_token
            )

        # Test 30: GET /admin/settings
        self.test(
            "GET /admin/settings",
            "GET", "admin/settings", 200,
            token=self.super_admin_token,
            validate_fn=lambda r: "settings" in r and "google_api_key" in r["settings"]
        )

        # Test 31: PATCH /admin/settings (update brand_name)
        test_brand = f"Test Brand {int(time.time())}"
        self.test(
            "PATCH /admin/settings (update brand_name)",
            "PATCH", "admin/settings", 200,
            data={"brand_name": test_brand},
            token=self.super_admin_token,
            validate_fn=lambda r: r.get("settings", {}).get("brand_name") == test_brand
        )

        # Test 32: GET /admin/plans
        self.test(
            "GET /admin/plans",
            "GET", "admin/plans", 200,
            token=self.super_admin_token,
            validate_fn=lambda r: len(r.get("plans", [])) >= 4
        )

        # Test 33: PATCH /admin/plans/{code}
        self.test(
            "PATCH /admin/plans/pro (update price)",
            "PATCH", "admin/plans/pro", 200,
            data={"price_inr": 2999},
            token=self.super_admin_token,
            validate_fn=lambda r: r.get("plan", {}).get("price_inr") == 2999
        )

        # Test 34: GET /admin/transactions
        self.test(
            "GET /admin/transactions",
            "GET", "admin/transactions", 200,
            token=self.super_admin_token,
            validate_fn=lambda r: "transactions" in r
        )

        # Test 35: GET /admin/audit
        self.test(
            "GET /admin/audit",
            "GET", "admin/audit", 200,
            token=self.super_admin_token,
            validate_fn=lambda r: len(r.get("logs", [])) >= 2  # Should have audit logs from settings/tenant updates
        )

        # ========== SUMMARY ==========
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")

        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"  {i}. {test}")

        return self.tests_passed == self.tests_run


if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
