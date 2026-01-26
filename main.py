# v1.0.1
import secrets
import asyncio
import json
import os
import uuid
from pathlib import Path

import httpx
import jwt
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Header
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Base directory for file paths
BASE_DIR = Path(__file__).resolve().parent

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT settings (must match .NET API)
JWT_SECRET = os.getenv("JWT_SECRET", "YourSuperSecretKeyThatShouldBeAtLeast32CharactersLong!")
JWT_ALGORITHM = "HS256"

def validate_jwt_token(token: str):
    """Validate JWT token and extract claims"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], audience="ChatApp.Client", issuer="ChatApp.API")
        return {
            "user_id": payload.get("sub"),
            "username": payload.get("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"),
            "email": payload.get("email"),
            "role": payload.get("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
        }
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "widget")), name="static")

# Serve config.js
@app.get("/config.js")
def serve_config():
    return FileResponse(BASE_DIR / "config.js", media_type="application/javascript")
@app.get("/admin-dashboard.css")
def serve_admin_css():
    return FileResponse(BASE_DIR / "admin-dashboard.css", media_type="text/css")
@app.get("/site-admin.css")
def site_admin_css():
    return FileResponse(BASE_DIR / "site-admin.css", media_type="text/css")
@app.get("/Support.css")
def support_css():
    return FileResponse(BASE_DIR / "Support.css", media_type="text/css")
# Serve branding.js
@app.get("/branding.js")
def serve_branding():
    return FileResponse(BASE_DIR / "branding.js", media_type="application/javascript")

# .NET API Base URL
API_BASE_URL = os.getenv("API_BASE_URL", "https://chatapp.code2night.com/api")

# Create uploads directory
UPLOADS_DIR = BASE_DIR / "uploads"
try:
    UPLOADS_DIR.mkdir(exist_ok=True)
except Exception:
    pass  # May fail on read-only filesystems

# Allowed file types
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.zip'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

SUPPORT = "support"
CUSTOMER = "customer"
ADMIN = "admin"

# token -> { username, site_id, user_id }
ACTIVE_TOKENS = {}

# visitorId -> { internal_visitor_id, conversation_id }
VISITOR_DATA = {}

# siteId -> state
connections = {}

# ------------------ PAGES ------------------

@app.get("/")
def landing_page():
    return FileResponse(BASE_DIR / "index.html")


@app.get("/index.html")
def landing_page_html():
    return FileResponse(BASE_DIR / "index.html")


@app.get("/register")
def register_page():
    return FileResponse(BASE_DIR / "register.html")


@app.get("/guide")
def guide_page():
    return FileResponse(BASE_DIR / "guide.html")


@app.get("/guide.html")
def guide_page_html():
    return FileResponse(BASE_DIR / "guide.html")


@app.get("/tutorials")
def tutorials_page():
    return FileResponse(BASE_DIR / "tutorials.html")


@app.get("/tutorials.html")
def tutorials_page_html():
    return FileResponse(BASE_DIR / "tutorials.html")


@app.get("/register.html")
def register_page_html():
    return FileResponse(BASE_DIR / "register.html")


@app.get("/login")
def unified_login_page():
    return FileResponse(BASE_DIR / "login.html")


@app.get("/login.html")
def unified_login_page_html():
    return FileResponse(BASE_DIR / "login.html")


@app.get("/forgot-password")
def forgot_password_page():
    return FileResponse(BASE_DIR / "forgot-password.html")


@app.get("/forgot-password.html")
def forgot_password_page_html():
    return FileResponse(BASE_DIR / "forgot-password.html")


@app.get("/reset-password")
def reset_password_page():
    return FileResponse(BASE_DIR / "reset-password.html")


@app.get("/reset-password.html")
def reset_password_page_html():
    return FileResponse(BASE_DIR / "reset-password.html")


@app.get("/privacy-policy")
def privacy_policy_page():
    return FileResponse(BASE_DIR / "privacy-policy.html")


@app.get("/privacy-policy.html")
def privacy_policy_page_html():
    return FileResponse(BASE_DIR / "privacy-policy.html")


@app.get("/terms-of-service")
def terms_of_service_page():
    return FileResponse(BASE_DIR / "terms-of-service.html")


@app.get("/terms-of-service.html")
def terms_of_service_page_html():
    return FileResponse(BASE_DIR / "terms-of-service.html")


@app.get("/cookie-policy")
def cookie_policy_page():
    return FileResponse(BASE_DIR / "cookie-policy.html")


@app.get("/cookie-policy.html")
def cookie_policy_page_html():
    return FileResponse(BASE_DIR / "cookie-policy.html")


@app.get("/gdpr")
def gdpr_page():
    return FileResponse(BASE_DIR / "gdpr.html")


@app.get("/gdpr.html")
def gdpr_page_html():
    return FileResponse(BASE_DIR / "gdpr.html")


@app.get("/admin-login")
def admin_login_page():
    return FileResponse(BASE_DIR / "admin" / "admin-login.html")


@app.get("/admin-login.html")
def admin_login_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-login.html")


@app.get("/admin-dashboard")
def admin_dashboard_page():
    return FileResponse(BASE_DIR / "admin" / "admin-dashboard.html")


@app.get("/admin-dashboard.html")
def admin_dashboard_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-dashboard.html")


@app.get("/support/login")
def support_login_page():
    return FileResponse(BASE_DIR / "login.html")


@app.get("/support")
def support_page():
    return FileResponse(BASE_DIR / "Support.html")


@app.get("/Support.html")
def support_page_html():
    return FileResponse(BASE_DIR / "Support.html")


# Serve admin shared JS
@app.get("/js/admin-shared.js")
def serve_admin_shared_js():
    return FileResponse(BASE_DIR / "admin" / "js" / "admin-shared.js", media_type="application/javascript")


# Serve visitor tracker JS
@app.get("/js/visitor-tracker.js")
def serve_visitor_tracker_js():
    return FileResponse(BASE_DIR / "js" / "visitor-tracker.js", media_type="application/javascript")


# Admin page routes
@app.get("/admin-users")
def admin_users_page():
    return FileResponse(BASE_DIR / "admin" / "admin-users.html")


@app.get("/admin-users.html")
def admin_users_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-users.html")


@app.get("/admin-conversations")
def admin_conversations_page():
    return FileResponse(BASE_DIR / "admin" / "admin-conversations.html")


@app.get("/admin-conversations.html")
def admin_conversations_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-conversations.html")


@app.get("/admin-plans")
def admin_plans_page():
    return FileResponse(BASE_DIR / "admin" / "admin-plans.html")


@app.get("/admin-plans.html")
def admin_plans_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-plans.html")


@app.get("/admin-payments")
def admin_payments_page():
    return FileResponse(BASE_DIR / "admin" / "admin-payments.html")


@app.get("/admin-payments.html")
def admin_payments_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-payments.html")


@app.get("/admin-subscriptions")
def admin_subscriptions_page():
    return FileResponse(BASE_DIR / "admin" / "admin-subscriptions.html")


@app.get("/admin-subscriptions.html")
def admin_subscriptions_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-subscriptions.html")


@app.get("/admin-email-logs")
def admin_email_logs_page():
    return FileResponse(BASE_DIR / "admin" / "admin-email-logs.html")


@app.get("/admin-email-logs.html")
def admin_email_logs_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-email-logs.html")


@app.get("/admin-smtp-settings")
def admin_smtp_settings_page():
    return FileResponse(BASE_DIR / "admin" / "admin-smtp-settings.html")


@app.get("/admin-smtp-settings.html")
def admin_smtp_settings_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-smtp-settings.html")


@app.get("/admin-settings")
def admin_settings_page():
    return FileResponse(BASE_DIR / "admin" / "admin-settings.html")


@app.get("/admin-settings.html")
def admin_settings_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-settings.html")


@app.get("/admin-visitors")
def admin_visitors_page():
    return FileResponse(BASE_DIR / "admin" / "admin-visitors.html")


@app.get("/admin-visitors.html")
def admin_visitors_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-visitors.html")


@app.get("/admin-tutorials")
def admin_tutorials_page():
    return FileResponse(BASE_DIR / "admin" / "admin-tutorials.html")


@app.get("/admin-tutorials.html")
def admin_tutorials_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-tutorials.html")


@app.get("/profile.html")
def profile_page():
    return FileResponse(BASE_DIR / "profile.html")


@app.get("/welcome-messages.html")
def welcome_messages_page():
    return FileResponse(BASE_DIR / "welcome-messages.html")


@app.get("/site-login")
def site_login_page():
    return FileResponse(BASE_DIR / "login.html")


@app.get("/site-login.html")
def site_login_page_html():
    return FileResponse(BASE_DIR / "login.html")


@app.get("/site-admin.html")
def site_admin_page():
    # Redirect to the new overview page
    return FileResponse(BASE_DIR / "site-admin" / "site-admin-overview.html")


# Site admin pages (split from monolithic site-admin.html)
@app.get("/site-admin-overview.html")
def site_admin_overview():
    return FileResponse(BASE_DIR / "site-admin" / "site-admin-overview.html")


@app.get("/site-admin-agents.html")
def site_admin_agents():
    return FileResponse(BASE_DIR / "site-admin" / "site-admin-agents.html")


@app.get("/site-admin-messages.html")
def site_admin_messages():
    return FileResponse(BASE_DIR / "site-admin" / "site-admin-messages.html")


@app.get("/site-admin-settings.html")
def site_admin_settings():
    return FileResponse(BASE_DIR / "site-admin" / "site-admin-settings.html")


@app.get("/site-admin-widget.html")
def site_admin_widget():
    return FileResponse(BASE_DIR / "site-admin" / "site-admin-widget.html")


@app.get("/site-admin-subscription.html")
def site_admin_subscription():
    return FileResponse(BASE_DIR / "site-admin" / "site-admin-subscription.html")


@app.get("/site-admin-billing.html")
def site_admin_billing():
    return FileResponse(BASE_DIR / "site-admin" / "site-admin-billing.html")


# Serve site admin shared JS
@app.get("/js/site-admin-shared.js")
def serve_site_admin_shared_js():
    return FileResponse(BASE_DIR / "site-admin" / "js" / "site-admin-shared.js", media_type="application/javascript")


@app.get("/knowledge-base.html")
def knowledge_base_page():
    return FileResponse(BASE_DIR / "knowledge-base.html")

@app.get("/test-widget")
def test_widget_page():
    return FileResponse(BASE_DIR / "test-widget.html")

@app.get("/test-widget.html")
def test_widget_page_html():
    return FileResponse(BASE_DIR / "test-widget.html")


# ------------------ REGISTRATION ------------------

@app.post("/api/auth/register")
async def register_user(data: dict):
    """Proxy registration to .NET API and auto-login to get token"""
    async with httpx.AsyncClient(verify=False) as client:
        try:
            # Step 1: Register
            response = await client.post(
                f"{API_BASE_URL}/auth/register",
                json=data
            )

            result = response.json()

            if response.status_code != 200 or not result.get("success"):
                raise HTTPException(status_code=response.status_code, detail=result.get("message", "Registration failed"))

            # Step 2: Auto-login to get access token
            login_response = await client.post(
                f"{API_BASE_URL}/auth/login",
                json={
                    "Email": data.get("Email"),
                    "Password": data.get("Password")
                }
            )

            if login_response.status_code == 200:
                login_result = login_response.json()
                if login_result.get("success"):
                    # Merge the access token into the registration response
                    result["data"]["accessToken"] = login_result.get("data", {}).get("accessToken")
                    result["data"]["refreshToken"] = login_result.get("data", {}).get("refreshToken")

            return result

        except HTTPException:
            raise
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Registration service unavailable")


# ------------------ SITE CREATION ------------------

@app.post("/api/sites")
async def create_site(data: dict, authorization: str = Header(None)):
    """Proxy site creation to .NET API"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/sites",
                json=data,
                headers={"Authorization": authorization}
            )

            result = response.json()

            if response.status_code == 200 or response.status_code == 201:
                return result
            else:
                raise HTTPException(status_code=response.status_code, detail=result.get("message", "Site creation failed"))

        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Site service unavailable")


# ------------------ SUBSCRIPTION PLANS ------------------

@app.get("/api/subscriptions/plans")
async def get_subscription_plans():
    """Proxy subscription plans from .NET API (no auth required)"""
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.get(f"{API_BASE_URL}/subscriptions/plans")
            if response.status_code == 200:
                return response.json()
            else:
                return {"success": False, "data": [], "message": "Failed to fetch plans"}
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Plans service unavailable")


# ------------------ PAYMENT PROXIES ------------------

@app.post("/api/sites/{site_id}/payments/razorpay/create-order")
async def create_razorpay_order(site_id: str, data: dict, authorization: str = Header(None)):
    """Proxy Razorpay order creation to .NET API"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/sites/{site_id}/payments/razorpay/create-order",
                json=data,
                headers={"Authorization": authorization}
            )
            return response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Payment service unavailable")


@app.post("/api/sites/{site_id}/payments/razorpay/verify")
async def verify_razorpay_payment(site_id: str, data: dict, authorization: str = Header(None)):
    """Proxy Razorpay verification to .NET API"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/sites/{site_id}/payments/razorpay/verify",
                json=data,
                headers={"Authorization": authorization}
            )
            return response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Payment service unavailable")


@app.post("/api/sites/{site_id}/payments/paypal/create-order")
async def create_paypal_order(site_id: str, data: dict, authorization: str = Header(None)):
    """Proxy PayPal order creation to .NET API"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/sites/{site_id}/payments/paypal/create-order",
                json=data,
                headers={"Authorization": authorization}
            )
            return response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Payment service unavailable")


@app.post("/api/sites/{site_id}/payments/paypal/capture")
async def capture_paypal_payment(site_id: str, data: dict, authorization: str = Header(None)):
    """Proxy PayPal capture to .NET API"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/sites/{site_id}/payments/paypal/capture",
                json=data,
                headers={"Authorization": authorization}
            )
            return response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Payment service unavailable")


# ------------------ LOGIN ------------------

@app.post("/support/login")
async def support_login(data: dict):
    username = data.get("username")
    password = data.get("password")
    site_id = data.get("siteId")  # Optional now - auto-fetched from user's sites

    async with httpx.AsyncClient(verify=False) as client:
        try:

            # Call .NET API for authentication (siteId is optional)
            login_payload = {
                "username": username,
                "password": password
            }
            if site_id:
                login_payload["siteId"] = site_id

            response = await client.post(
                f"{API_BASE_URL}/auth/support/login",
                json=login_payload
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    api_data = result.get("data", {})
                    token = api_data.get("token")
                    user = api_data.get("user", {})

                    # Get siteId from user's sites (use first one if not specified)
                    user_sites = user.get("siteIds", [])
                    actual_site_id = site_id or (user_sites[0] if user_sites else None)

                    # Store token info locally for WebSocket auth
                    ACTIVE_TOKENS[token] = {
                        "username": user.get("username", username),
                        "site_id": actual_site_id,
                        "user_id": user.get("id")
                    }

                    return {
                        "token": token,
                        "siteId": actual_site_id,
                        "email": user.get("email"),
                        "role": user.get("role"),
                        "siteIds": user_sites
                    }

            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid credentials")
            elif response.status_code == 403:
                raise HTTPException(status_code=403, detail="No access to any site")
            else:
                # Fallback error
                raise HTTPException(status_code=response.status_code, detail="Login failed")

        except httpx.RequestError:
            # If API is unavailable, return error
            raise HTTPException(status_code=503, detail="Authentication service unavailable")


# ------------------ FILE UPLOAD ------------------

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), siteId: str = Form(...), visitorId: str = Form(None), token: str = Form(None)):
    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")

    # Generate unique filename
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = UPLOADS_DIR / unique_name

    # Save file locally
    with open(file_path, "wb") as f:
        f.write(content)

    # Determine if it's an image
    is_image = ext in {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

    file_id = unique_name.replace(ext, "")

    # Try to upload to .NET API as well
    try:
        async with httpx.AsyncClient(verify=False) as client:
            # Reset file position for re-reading
            files = {"file": (file.filename, content, file.content_type)}
            params = {"siteId": siteId}
            if visitorId:
                params["visitorId"] = visitorId

            # Determine which endpoint to use
            if token and token in ACTIVE_TOKENS:
                response = await client.post(
                    f"{API_BASE_URL}/files/upload",
                    files=files,
                    params=params,
                    headers={"Authorization": f"Bearer {token}"}
                )
            else:
                response = await client.post(
                    f"{API_BASE_URL}/files/upload/visitor",
                    files=files,
                    params=params
                )

            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    api_data = result.get("data", {})
                    file_id = api_data.get("id", file_id)
    except Exception as e:
        print(f"Error uploading to API: {e}")

    return {
        "id": file_id,
        "filename": unique_name,
        "original_name": file.filename,
        "url": f"/uploads/{unique_name}",
        "is_image": is_image,
        "size": len(content)
    }


@app.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


# ------------------ CONVERSATIONS API (Super Admin) ------------------

@app.get("/api/conversations")
async def get_all_conversations(authorization: str = Header(None)):
    """Get all conversations across all sites (for super admin)"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")

    # Validate token
    token_data = validate_jwt_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Check if super_admin
    if token_data.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            # First get all sites
            sites_response = await client.get(
                f"{API_BASE_URL}/sites/all",
                headers={"Authorization": authorization}
            )

            if sites_response.status_code != 200:
                raise HTTPException(status_code=sites_response.status_code, detail="Failed to fetch sites")

            sites_result = sites_response.json()
            sites = sites_result.get("data", {}).get("items", []) if isinstance(sites_result.get("data"), dict) else sites_result.get("data", [])

            # Fetch conversations for each site
            all_conversations = []
            for site in sites:
                site_id = site.get("id")
                if not site_id:
                    continue

                try:
                    conv_response = await client.get(
                        f"{API_BASE_URL}/sites/{site_id}/conversations",
                        headers={"Authorization": authorization}
                    )

                    if conv_response.status_code == 200:
                        conv_result = conv_response.json()
                        conversations = conv_result.get("data", {}).get("items", []) if isinstance(conv_result.get("data"), dict) else conv_result.get("data", [])

                        # Add site info to each conversation
                        for conv in conversations:
                            conv["siteName"] = site.get("name", "Unknown Site")
                            conv["siteId"] = site_id

                        all_conversations.extend(conversations)
                except Exception as e:
                    print(f"Error fetching conversations for site {site_id}: {e}")
                    continue

            return {"success": True, "data": all_conversations}

        except HTTPException:
            raise
        except Exception as e:
            print(f"Error fetching conversations: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, authorization: str = Header(None)):
    """Get messages for a specific conversation"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")

    # Validate token
    token_data = validate_jwt_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            # Get messages from the API (route: /api/conversations/{id}/messages)
            url = f"{API_BASE_URL}/conversations/{conversation_id}/messages"
            print(f"[DEBUG] Fetching messages from: {url}")
            response = await client.get(url, headers={"Authorization": authorization})
            print(f"[DEBUG] Response status: {response.status_code}")

            if response.status_code == 200:
                result = response.json()
                return {"success": True, "data": result.get("data", {})}
            else:
                print(f"[DEBUG] Error response: {response.text[:500]}")
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch messages")

        except HTTPException:
            raise
        except Exception as e:
            print(f"Error fetching messages: {e}")
            raise HTTPException(status_code=500, detail=str(e))


# ------------------ SITE CONVERSATIONS API (Proxy) ------------------

@app.get("/api/sites/{site_id}/conversations")
async def get_site_conversations(site_id: str, authorization: str = Header(None)):
    """Get conversations for a specific site (proxy to .NET API)"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")

    # Validate token
    token_data = validate_jwt_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.get(
                f"{API_BASE_URL}/sites/{site_id}/conversations",
                headers={"Authorization": authorization}
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch conversations")

        except HTTPException:
            raise
        except Exception as e:
            print(f"Error fetching site conversations: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/sites/{site_id}/conversations/{conversation_id}")
async def delete_conversation(site_id: str, conversation_id: str, authorization: str = Header(None)):
    """Delete a conversation (proxy to .NET API)"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")

    # Validate token
    token_data = validate_jwt_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.delete(
                f"{API_BASE_URL}/sites/{site_id}/conversations/{conversation_id}",
                headers={"Authorization": authorization}
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to delete conversation")

        except HTTPException:
            raise
        except Exception as e:
            print(f"Error deleting conversation: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sites/{site_id}/agents")
async def get_site_agents(site_id: str, authorization: str = Header(None)):
    """Get agents for a specific site (proxy to .NET API)"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")

    # Validate token
    token_data = validate_jwt_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.get(
                f"{API_BASE_URL}/sites/{site_id}/agents",
                headers={"Authorization": authorization}
            )

            if response.status_code == 200:
                return response.json()
            else:
                # Return empty list if endpoint doesn't exist or fails
                return {"success": True, "data": []}

        except HTTPException:
            raise
        except Exception as e:
            print(f"Error fetching site agents: {e}")
            return {"success": True, "data": []}


# ------------------ CONVERSATION COMMENTS API ------------------

@app.get("/api/conversations/{conversation_id}/comments")
async def get_conversation_comments(conversation_id: str, authorization: str = Header(None)):
    """Get comments for a specific conversation (proxy to .NET API)"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")
    token_data = validate_jwt_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.get(
                f"{API_BASE_URL}/conversations/{conversation_id}/comments",
                headers={"Authorization": authorization}
            )

            if response.status_code == 200:
                return response.json()
            else:
                # Return empty list if endpoint doesn't exist
                return {"success": True, "data": []}

        except Exception as e:
            print(f"Error fetching conversation comments: {e}")
            return {"success": True, "data": []}


@app.post("/api/conversations/{conversation_id}/comments")
async def add_conversation_comment(conversation_id: str, data: dict, authorization: str = Header(None)):
    """Add a comment to a conversation (proxy to .NET API)"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")
    token_data = validate_jwt_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/conversations/{conversation_id}/comments",
                json=data,
                headers={"Authorization": authorization}
            )

            if response.status_code == 200 or response.status_code == 201:
                return response.json()
            else:
                error_text = response.text
                raise HTTPException(status_code=response.status_code, detail=f"Failed to add comment: {error_text}")

        except HTTPException:
            raise
        except Exception as e:
            print(f"Error adding conversation comment: {e}")
            raise HTTPException(status_code=500, detail=str(e))


# ------------------ SUPERVISOR API ------------------

@app.get("/api/sites/{site_id}/supervisor/overview")
async def get_supervisor_overview(site_id: str, authorization: str = Header(None)):
    """Get supervisor overview for a site - returns all agents and active conversations"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.replace("Bearer ", "")
    token_data = validate_jwt_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Check if user has supervisor permissions
    user_role = token_data.get("role", "")
    if user_role not in ["admin", "site_admin", "supervisor", "super_admin"]:
        raise HTTPException(status_code=403, detail="Supervisor access required")

    # Get real-time data from connections
    site = connections.get(site_id, {})

    # Get online agents from WebSocket connections
    online_agents = []
    for agent_id, agent_data in site.get("agents", {}).items():
        online_agents.append({
            "id": agent_id,
            "username": agent_data.get("username"),
            "status": agent_data.get("status", "online"),
            "isOnline": True
        })

    # Get active conversations
    active_conversations = []
    for visitor_id, customer_ws in site.get("customers", {}).items():
        visitor_data = VISITOR_DATA.get(visitor_id, {})
        active_conversations.append({
            "visitorId": visitor_id,
            "name": site.get("names", {}).get(visitor_id, visitor_id),
            "conversationId": visitor_data.get("conversation_id"),
            "isOnline": True
        })

    # Also fetch historical data from API
    async with httpx.AsyncClient(verify=False) as client:
        try:
            # Get all agents for the site
            agents_response = await client.get(
                f"{API_BASE_URL}/sites/{site_id}/agents",
                headers={"Authorization": authorization}
            )
            all_agents = []
            if agents_response.status_code == 200:
                result = agents_response.json()
                all_agents = result.get("data", [])

            # Merge with online status
            online_ids = {a["id"] for a in online_agents}
            for agent in all_agents:
                if agent.get("userId") not in online_ids and agent.get("id") not in online_ids:
                    online_agents.append({
                        "id": agent.get("userId") or agent.get("id"),
                        "username": agent.get("name") or agent.get("email"),
                        "status": "offline",
                        "isOnline": False
                    })

            # Get conversations
            conv_response = await client.get(
                f"{API_BASE_URL}/sites/{site_id}/conversations",
                headers={"Authorization": authorization}
            )
            if conv_response.status_code == 200:
                conv_result = conv_response.json()
                conversations = conv_result.get("data", {}).get("items", [])

                # Merge with active status
                active_ids = {c["visitorId"] for c in active_conversations}
                for conv in conversations:
                    if conv.get("visitorId") not in active_ids:
                        active_conversations.append({
                            "visitorId": conv.get("visitorId"),
                            "name": conv.get("visitorName", "Visitor"),
                            "conversationId": conv.get("id"),
                            "isOnline": False,
                            "lastMessageAt": conv.get("lastMessageAt"),
                            "assignedAgentId": conv.get("assignedAgentId")
                        })

        except Exception as e:
            print(f"Error fetching supervisor data from API: {e}")

    return {
        "success": True,
        "data": {
            "agents": online_agents,
            "conversations": active_conversations,
            "stats": {
                "totalAgents": len(online_agents),
                "onlineAgents": len([a for a in online_agents if a.get("isOnline")]),
                "totalConversations": len(active_conversations),
                "activeConversations": len([c for c in active_conversations if c.get("isOnline")])
            }
        }
    }


# ------------------ AI USAGE TRACKING ------------------

async def check_and_record_ai_usage(site_id: str, feature_type: str) -> dict:
    """Check if AI feature can be used and record usage. Returns {allowed, message, used, limit}"""
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/subscriptions/sites/{site_id}/ai-usage",
                json={"featureType": feature_type},
                timeout=10.0
            )
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    return result.get("data", {"allowed": False})
        except Exception as e:
            print(f"AI usage tracking error: {e}")

    # Default to allowed if tracking fails (graceful degradation)
    return {"allowed": True, "message": None, "used": 0, "limit": None}


async def get_ai_usage(site_id: str) -> dict:
    """Get current AI usage for a site"""
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.get(
                f"{API_BASE_URL}/subscriptions/sites/{site_id}/ai-usage",
                timeout=10.0
            )
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    return result.get("data", {})
        except Exception as e:
            print(f"Error getting AI usage: {e}")
    return {}


# ------------------ AI ANALYSIS ------------------

async def analyze_customer_message(message: str, conversation_id: str = None, visitor_id: str = None):
    """Analyze customer message using .NET API"""
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/ai/analyze-message",
                json={
                    "message": message,
                    "conversationId": conversation_id,
                    "visitorId": visitor_id
                },
                timeout=30.0
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    data = result.get("data", {})
                    return {
                        "suggested_reply": data.get("suggestedReply", ""),
                        "interest_level": data.get("interestLevel", "Medium"),
                        "conversion_percentage": data.get("conversionPercentage", 50),
                        "objection": data.get("objection"),
                        "next_action": data.get("nextAction", "")
                    }

        except Exception as e:
            print(f"AI analysis error: {e}")

    # Return default response if API fails
    return {
        "suggested_reply": "Thank you for your message.",
        "interest_level": "Medium",
        "conversion_percentage": 50,
        "objection": None,
        "next_action": "Continue conversation"
    }


async def analyze_customer_message_with_rag(message: str, site_id: str, conversation_id: str = None, visitor_id: str = None):
    """Analyze customer message using RAG (Knowledge Base) via .NET API"""
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/ai/analyze-message-with-rag",
                json={
                    "message": message,
                    "siteId": site_id,
                    "conversationId": conversation_id,
                    "visitorId": visitor_id,
                    "maxChunks": 5,
                    "minSimilarity": 0.15
                },
                timeout=30.0
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    data = result.get("data", {})
                    return {
                        "suggested_reply": data.get("suggestedReply", ""),
                        "interest_level": data.get("interestLevel", "Medium"),
                        "conversion_percentage": data.get("conversionPercentage", 50),
                        "objection": data.get("objection"),
                        "next_action": data.get("nextAction", ""),
                        "used_knowledge_base": data.get("usedKnowledgeBase", False),
                        "relevant_knowledge": data.get("relevantKnowledge", [])
                    }

        except Exception as e:
            print(f"RAG analysis error: {e}")

    # Fall back to regular analysis if RAG fails
    return await analyze_customer_message(message, conversation_id, visitor_id)


async def save_message_to_api(conversation_id: str, sender_type: str, sender_id: str, content: str, message_type: str = "text", file_id: str = None):
    """Save message to .NET API"""
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/chat/message",
                json={
                    "conversationId": conversation_id,
                    "senderType": sender_type,
                    "senderId": sender_id,
                    "content": content,
                    "messageType": message_type,
                    "fileId": file_id
                }
            )
            if response.status_code == 200:
                result = response.json()
                return result.get("data")
        except Exception as e:
            print(f"Error saving message: {e}")
    return None


async def init_chat_session(site_id: str, visitor_id: str, name: str = None, email: str = None):
    """Initialize chat session via .NET API"""
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/chat/init",
                json={
                    "siteId": site_id,
                    "visitorId": visitor_id,
                    "name": name,
                    "email": email
                }
            )
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    return result.get("data")
        except Exception as e:
            print(f"Error initializing chat: {e}")
    return None


async def get_welcome_messages(site_id: str):
    """Fetch welcome messages from .NET API"""
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.get(f"{API_BASE_URL}/sites/{site_id}/welcome-messages")
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    # Return only active messages sorted by display order
                    messages = result.get("data", [])
                    return [m for m in messages if m.get("isActive")]
        except Exception as e:
            print(f"Error fetching welcome messages: {e}")
    return []


async def send_welcome_message(site_id: str, visitor_id: str, conversation_id: str, customer_ws: WebSocket, site: dict):
    """Send welcome message to customer and save to database"""
    try:
        # Fetch welcome messages
        messages = await get_welcome_messages(site_id)

        if not messages:
            return

        # Get the first active message (lowest display order)
        welcome_msg = messages[0]

        # Get support user info (if online) or use defaults
        support_name = site.get("support_name") or "Support"
        support_user_id = site.get("support_user_id") or "bot"

        # Send to customer
        await customer_ws.send_json({
            "type": "message",
            "from": "support",
            "name": support_name,
            "message": welcome_msg.get("message"),
            "isWelcome": True
        })

        # Save to database as a support/bot message (not system)
        if conversation_id:
            await save_message_to_api(
                conversation_id=conversation_id,
                sender_id=support_user_id,
                sender_type="support",
                content=welcome_msg.get("message"),
                message_type="text"
            )

        # Notify all agents - show as auto-message, not a separate user
        await broadcast_to_agents(site, {
            "type": "welcome_sent",
            "visitorId": visitor_id,
            "message": welcome_msg.get("message"),
            "isWelcome": True
        })

    except Exception as e:
        print(f"Error sending welcome message: {e}")


# ------------------ API KEY VALIDATION ------------------

async def validate_api_key(site_id: str, api_key: str) -> bool:
    """Validate API key against the .NET API"""
    if not site_id or not api_key:
        return False

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/sites/{site_id}/validate-api-key",
                json={"apiKey": api_key},
                timeout=10.0
            )
            if response.status_code == 200:
                result = response.json()
                return result.get("success", False) and result.get("data", {}).get("valid", False)
        except Exception as e:
            print(f"API key validation error: {e}")
    return False


async def update_agent_status(token: str, status: str):
    """Update agent online/offline status via .NET API"""
    if not token:
        return False

    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.put(
                f"{API_BASE_URL}/auth/me/status",
                json={"status": status},
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            if response.status_code == 200:
                print(f"Agent status updated to: {status}")
                return True
            else:
                print(f"Failed to update agent status: {response.status_code}")
        except Exception as e:
            print(f"Error updating agent status: {e}")
    return False


async def broadcast_to_admins(site: dict, message: dict):
    """Broadcast a message to all connected admins for a site"""
    admins_to_remove = []
    for admin_id, admin_ws in site.get("admins", {}).items():
        try:
            await admin_ws.send_json(message)
        except Exception as e:
            print(f"Failed to send to admin {admin_id}: {e}")
            admins_to_remove.append(admin_id)
    # Remove disconnected admins
    for admin_id in admins_to_remove:
        site["admins"].pop(admin_id, None)


async def broadcast_to_agents(site: dict, message: dict, exclude_agent: str = None):
    """Broadcast a message to all connected agents for a site"""
    agents_to_remove = []
    for agent_id, agent_data in site.get("agents", {}).items():
        if agent_id == exclude_agent:
            continue
        try:
            await agent_data["ws"].send_json(message)
        except Exception as e:
            print(f"Failed to send to agent {agent_id}: {e}")
            agents_to_remove.append(agent_id)
    # Remove disconnected agents
    for agent_id in agents_to_remove:
        site["agents"].pop(agent_id, None)


async def send_to_agent(site: dict, agent_id: str, message: dict) -> bool:
    """Send a message to a specific agent"""
    agent_data = site.get("agents", {}).get(agent_id)
    if agent_data:
        try:
            await agent_data["ws"].send_json(message)
            return True
        except Exception as e:
            print(f"Failed to send to agent {agent_id}: {e}")
    return False


def get_first_available_agent(site: dict) -> tuple:
    """Get the first online agent for a site, returns (agent_id, agent_data) or (None, None)"""
    for agent_id, agent_data in site.get("agents", {}).items():
        if agent_data.get("status") == "online":
            return agent_id, agent_data
    # Return first agent if none are online
    agents = site.get("agents", {})
    if agents:
        agent_id = next(iter(agents))
        return agent_id, agents[agent_id]
    return None, None


# ------------------ WEBSOCKET ------------------

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()

    site_id = ws.query_params.get("siteId")
    role = ws.query_params.get("role")
    visitor_id = ws.query_params.get("visitorId")
    token = ws.query_params.get("token")
    api_key = ws.query_params.get("apiKey")

    # -------- AUTH SUPPORT --------
    auth = None
    if role == SUPPORT:
        # First try JWT validation (for tokens from .NET API)
        auth = validate_jwt_token(token)
        if not auth:
            # Fall back to ACTIVE_TOKENS (for tokens from Python login)
            auth = ACTIVE_TOKENS.get(token)
        if not auth:
            await ws.close()
            return

    # -------- AUTH CUSTOMER (API Key validation) --------
    if role == CUSTOMER:
        is_valid = await validate_api_key(site_id, api_key)
        if not is_valid:
            print(f"Invalid API key for site {site_id}")
            await ws.close(code=4001, reason="Invalid API key")
            return

    # -------- INIT SITE --------
    if site_id not in connections:
        connections[site_id] = {
            "agents": {},  # agent_user_id -> {"ws": WebSocket, "username": str, "status": str, "token": str}
            "supervisors": {},  # supervisor_user_id -> WebSocket
            "customers": {},
            "names": {},
            "admins": {},  # admin user_id -> WebSocket
            "analysis_enabled": False,  # Default OFF
            "auto_reply_enabled": False,  # Default OFF
            "agent_chats": {}  # Stores agent-to-agent chat messages
        }

    site = connections[site_id]

    # -------- AUTH ADMIN --------
    if role == ADMIN:
        auth = validate_jwt_token(token)
        if not auth:
            auth = ACTIVE_TOKENS.get(token)
        if not auth:
            await ws.close()
            return

    # -------- REGISTER ROLE --------
    if role == SUPPORT:
        agent_user_id = auth.get("user_id")
        agent_username = auth["username"]
        agent_role = auth.get("role", "agent")

        # Register agent in multi-agent structure
        site["agents"][agent_user_id] = {
            "ws": ws,
            "username": agent_username,
            "status": "online",
            "token": token,
            "role": agent_role
        }

        # Also register as supervisor if role allows
        if agent_role in ["admin", "site_admin", "supervisor"]:
            site["supervisors"][agent_user_id] = ws

        # Update agent status to online via API
        await update_agent_status(token, "online")

        # Broadcast to admins that agent is online
        await broadcast_to_admins(site, {
            "type": "agent_online",
            "userId": agent_user_id,
            "username": agent_username,
            "status": "online"
        })

        # Broadcast to other agents that this agent joined
        await broadcast_to_agents(site, {
            "type": "agent_joined",
            "agentId": agent_user_id,
            "username": agent_username,
            "status": "online"
        }, exclude_agent=agent_user_id)

        # Send list of online agents to the newly connected agent
        online_agents = {
            aid: {"username": adata["username"], "status": adata["status"]}
            for aid, adata in site["agents"].items()
            if aid != agent_user_id
        }
        await ws.send_json({
            "type": "online_agents_list",
            "agents": online_agents
        })

        # Notify existing customers that support is available
        for vid, cws in site["customers"].items():
            visitor_data = VISITOR_DATA.get(vid, {})
            await ws.send_json({
                "type": "user_joined",
                "visitorId": vid,
                "name": site["names"].get(vid, vid),
                "conversationId": visitor_data.get("conversation_id")
            })

        # Notify customers support joined with status
        for cws in site["customers"].values():
            await cws.send_json({
                "type": "support_joined",
                "name": agent_username
            })
            await cws.send_json({
                "type": "agent_status_broadcast",
                "status": "online",
                "agentName": agent_username
            })

    elif role == CUSTOMER:
        site["customers"][visitor_id] = ws

    elif role == ADMIN:
        admin_id = auth.get("user_id", token)
        site["admins"][admin_id] = ws

        # Send current agents status to admin
        for agent_id, agent_data in site.get("agents", {}).items():
            await ws.send_json({
                "type": "agent_online",
                "userId": agent_id,
                "username": agent_data.get("username"),
                "status": agent_data.get("status", "online")
            })

    else:
        await ws.close()
        return

    # -------- MESSAGE LOOP --------
    try:
        while True:
            data = await ws.receive_json()

            # ----- STATE REQUEST -----
            if data.get("type") == "get_state" and role == CUSTOMER:
                # Notify customer about available agents
                first_agent_id, first_agent = get_first_available_agent(site)
                if first_agent:
                    await ws.send_json({
                        "type": "support_joined",
                        "name": first_agent.get("username", "Support")
                    })
                    # Also send current agent status
                    await ws.send_json({
                        "type": "agent_status_broadcast",
                        "status": first_agent.get("status", "online"),
                        "agentName": first_agent.get("username", "Support")
                    })

            # ----- INIT USER -----
            elif data.get("type") == "init" and role == CUSTOMER:
                name = data.get("name", visitor_id)
                email = data.get("email")
                site["names"][visitor_id] = name

                # Initialize chat session with API (creates visitor & conversation)
                chat_data = await init_chat_session(site_id, visitor_id, name, email)
                conversation_id = None
                if chat_data:
                    conversation_id = chat_data.get("conversationId")
                    VISITOR_DATA[visitor_id] = {
                        "internal_visitor_id": chat_data.get("visitorId"),
                        "conversation_id": conversation_id
                    }

                # Notify all agents about user joined
                await broadcast_to_agents(site, {
                    "type": "user_joined",
                    "visitorId": visitor_id,
                    "name": name,
                    "email": email,
                    "conversationId": conversation_id
                })

                # Send welcome message to customer
                await send_welcome_message(site_id, visitor_id, conversation_id, ws, site)

            # ----- TYPING INDICATORS -----
            elif data.get("type") == "typing_start" and role == CUSTOMER:
                await broadcast_to_agents(site, {
                    "type": "typing_start",
                    "visitorId": visitor_id,
                    "name": site["names"].get(visitor_id, visitor_id)
                })

            elif data.get("type") == "typing_stop" and role == CUSTOMER:
                await broadcast_to_agents(site, {
                    "type": "typing_stop",
                    "visitorId": visitor_id
                })

            elif data.get("type") == "support_typing" and role == SUPPORT:
                to = data.get("to")
                if to in site["customers"]:
                    await site["customers"][to].send_json({
                        "type": "support_typing"
                    })

            elif data.get("type") == "support_typing_stop" and role == SUPPORT:
                to = data.get("to")
                if to in site["customers"]:
                    await site["customers"][to].send_json({
                        "type": "support_typing_stop"
                    })

            # ----- TOGGLE ANALYSIS -----
            elif data.get("type") == "toggle_analysis" and role == SUPPORT:
                site["analysis_enabled"] = data.get("enabled", False)
                print(f"Analysis toggled: {site['analysis_enabled']}")

            # ----- TOGGLE AUTO REPLY -----
            elif data.get("type") == "toggle_auto_reply" and role == SUPPORT:
                site["auto_reply_enabled"] = data.get("enabled", False)
                print(f"Auto Reply toggled: {site['auto_reply_enabled']}")

            # ----- GET ONLINE AGENTS -----
            elif data.get("type") == "get_online_agents" and role == SUPPORT:
                agent_user_id = auth.get("user_id")
                online_agents = {
                    aid: {"username": adata["username"], "status": adata["status"]}
                    for aid, adata in site["agents"].items()
                    if aid != agent_user_id
                }
                await ws.send_json({
                    "type": "online_agents_list",
                    "agents": online_agents
                })

            # ----- AGENT-TO-AGENT MESSAGE -----
            elif data.get("type") == "agent_message" and role == SUPPORT:
                from_agent_id = auth.get("user_id")
                from_agent_name = auth.get("username")
                to_agent_id = data.get("toAgentId")
                message = data.get("message", "")
                timestamp = data.get("timestamp")

                if to_agent_id and message:
                    # Store message in agent chats
                    chat_key = tuple(sorted([from_agent_id, to_agent_id]))
                    if "agent_chats" not in site:
                        site["agent_chats"] = {}
                    if chat_key not in site["agent_chats"]:
                        site["agent_chats"][chat_key] = []

                    msg_obj = {
                        "from": from_agent_id,
                        "fromName": from_agent_name,
                        "to": to_agent_id,
                        "message": message,
                        "timestamp": timestamp
                    }
                    site["agent_chats"][chat_key].append(msg_obj)

                    # Send to target agent
                    sent = await send_to_agent(site, to_agent_id, {
                        "type": "agent_message",
                        "fromAgentId": from_agent_id,
                        "fromAgentName": from_agent_name,
                        "message": message,
                        "timestamp": timestamp
                    })

                    # Confirm to sender
                    await ws.send_json({
                        "type": "agent_message_sent",
                        "toAgentId": to_agent_id,
                        "message": message,
                        "timestamp": timestamp,
                        "delivered": sent
                    })

            # ----- AGENT TYPING TO AGENT -----
            elif data.get("type") == "agent_typing_start" and role == SUPPORT:
                from_agent_id = auth.get("user_id")
                from_agent_name = auth.get("username")
                to_agent_id = data.get("toAgentId")

                if to_agent_id:
                    await send_to_agent(site, to_agent_id, {
                        "type": "agent_typing_start",
                        "fromAgentId": from_agent_id,
                        "fromAgentName": from_agent_name
                    })

            elif data.get("type") == "agent_typing_stop" and role == SUPPORT:
                from_agent_id = auth.get("user_id")
                to_agent_id = data.get("toAgentId")

                if to_agent_id:
                    await send_to_agent(site, to_agent_id, {
                        "type": "agent_typing_stop",
                        "fromAgentId": from_agent_id
                    })

            # ----- GET AGENT CHAT HISTORY -----
            elif data.get("type") == "get_agent_chat_history" and role == SUPPORT:
                from_agent_id = auth.get("user_id")
                with_agent_id = data.get("withAgentId")

                if with_agent_id:
                    chat_key = tuple(sorted([from_agent_id, with_agent_id]))
                    messages = site.get("agent_chats", {}).get(chat_key, [])
                    await ws.send_json({
                        "type": "agent_chat_history",
                        "withAgentId": with_agent_id,
                        "messages": messages
                    })

            # ----- BROADCAST NEW COMMENT -----
            elif data.get("type") == "new_comment" and role == SUPPORT:
                # When an agent adds a comment, broadcast to all agents
                conversation_id = data.get("conversationId")
                comment = data.get("comment", {})
                author_id = auth.get("user_id")
                author_name = auth.get("username")

                # Broadcast to all agents (they can filter by conversationId)
                await broadcast_to_agents(site, {
                    "type": "new_comment",
                    "conversationId": conversation_id,
                    "comment": {
                        **comment,
                        "authorId": author_id,
                        "authorName": author_name
                    }
                }, exclude_agent=author_id)

                # Handle mentions in the comment
                mentions = data.get("mentions", [])
                if mentions:
                    for mentioned_id in mentions:
                        if mentioned_id in site.get("agents", {}):
                            await send_to_agent(site, mentioned_id, {
                                "type": "mention_notification",
                                "conversationId": conversation_id,
                                "fromAgent": author_name,
                                "fromAgentId": author_id,
                                "preview": comment.get("content", "")[:100],
                                "commentId": comment.get("id")
                            })

            # ----- REQUEST SUPERVISOR DATA -----
            elif data.get("type") == "get_supervisor_data" and role == SUPPORT:
                agent_user_id = auth.get("user_id")
                agent_role = auth.get("role", "")

                # Check if user has supervisor permissions
                if agent_role in ["admin", "site_admin", "supervisor", "super_admin"]:
                    # Get online agents
                    online_agents = [
                        {"id": aid, "username": adata["username"], "status": adata["status"]}
                        for aid, adata in site.get("agents", {}).items()
                    ]

                    # Get active conversations
                    active_conversations = [
                        {
                            "visitorId": vid,
                            "name": site.get("names", {}).get(vid, vid),
                            "conversationId": VISITOR_DATA.get(vid, {}).get("conversation_id")
                        }
                        for vid in site.get("customers", {}).keys()
                    ]

                    await ws.send_json({
                        "type": "supervisor_data",
                        "agents": online_agents,
                        "conversations": active_conversations
                    })
                else:
                    await ws.send_json({
                        "type": "error",
                        "message": "Supervisor access required"
                    })

            # ----- AGENT STATUS CHANGE -----
            elif data.get("type") == "agent_status_change" and role == SUPPORT:
                status = data.get("status", "online")
                agent_user_id = auth.get("user_id")
                agent_username = auth.get("username", "Support")

                # Update agent status in multi-agent structure
                if agent_user_id in site["agents"]:
                    site["agents"][agent_user_id]["status"] = status

                print(f"Agent {agent_username} status changed to: {status}")

                # Broadcast to other agents
                await broadcast_to_agents(site, {
                    "type": "agent_status_changed",
                    "agentId": agent_user_id,
                    "username": agent_username,
                    "status": status
                }, exclude_agent=agent_user_id)

                # Broadcast to all connected customers
                for vid, cws in site["customers"].items():
                    try:
                        await cws.send_json({
                            "type": "agent_status_broadcast",
                            "status": status,
                            "agentName": agent_username
                        })
                    except Exception as e:
                        print(f"Failed to send status to customer {vid}: {e}")

            # ----- CLOSE CONVERSATION -----
            elif data.get("type") == "close_conversation" and role == SUPPORT:
                target_visitor = data.get("visitorId")
                send_csat = data.get("sendCsat", True)
                close_status = data.get("status", "resolved")
                close_note = data.get("note", "")

                print(f"Closing conversation for visitor: {target_visitor}, status: {close_status}")

                # Send CSAT request to customer if enabled and customer is connected
                if send_csat and target_visitor in site["customers"]:
                    try:
                        agent_username = auth.get("username", "Support")
                        await site["customers"][target_visitor].send_json({
                            "type": "csat_request",
                            "agentName": agent_username
                        })
                    except Exception as e:
                        print(f"Failed to send CSAT request: {e}")

                # Notify customer that conversation is closed
                if target_visitor in site["customers"]:
                    try:
                        await site["customers"][target_visitor].send_json({
                            "type": "conversation_closed",
                            "status": close_status,
                            "message": "This conversation has been closed. Thank you for chatting with us!"
                        })
                    except Exception as e:
                        print(f"Failed to send close notification: {e}")

                # Confirm to support
                await ws.send_json({
                    "type": "conversation_closed",
                    "visitorId": target_visitor,
                    "status": close_status
                })

            # ----- CSAT RESPONSE FROM CUSTOMER -----
            elif data.get("type") == "csat_response" and role == CUSTOMER:
                rating = data.get("rating", 0)
                feedback = data.get("feedback", "")

                print(f"CSAT received from {visitor_id}: {rating}/5")

                # Notify all agents of the rating
                await broadcast_to_agents(site, {
                    "type": "csat_received",
                    "visitorId": visitor_id,
                    "rating": rating,
                    "feedback": feedback
                })

            # ----- CUSTOMER MESSAGE -----
            elif role == CUSTOMER and ("message" in data or "file" in data):
                msg = data.get("message", "")
                file_data = data.get("file")

                # Get conversation ID for this visitor
                visitor_data = VISITOR_DATA.get(visitor_id, {})
                conversation_id = visitor_data.get("conversation_id")
                internal_visitor_id = visitor_data.get("internal_visitor_id", visitor_id)

                # Save message to API
                if conversation_id:
                    await save_message_to_api(
                        conversation_id,
                        "visitor",
                        internal_visitor_id,
                        msg,
                        "file" if file_data else "text",
                        file_data.get("id") if file_data else None
                    )

                # Send message to all agents
                msg_payload = {
                    "type": "message",
                    "from": visitor_id,
                    "name": site["names"].get(visitor_id, visitor_id),
                    "message": msg
                }

                if file_data:
                    msg_payload["file"] = file_data

                await broadcast_to_agents(site, msg_payload)

                # Run AI analysis if analysis or auto-reply is enabled
                should_analyze = site.get("analysis_enabled", False) or site.get("auto_reply_enabled", False)
                if msg and not file_data and should_analyze and site.get("agents"):
                    analysis = None
                    analysis_usage = None

                    # Check and record AI analysis usage if analysis is enabled
                    if site.get("analysis_enabled", False):
                        analysis_usage = await check_and_record_ai_usage(site_id, "analysis")
                        if analysis_usage.get("allowed"):
                            analysis = await analyze_customer_message(msg, conversation_id, internal_visitor_id)
                            # Send analysis to all agents
                            await broadcast_to_agents(site, {
                                "type": "analysis",
                                "from": visitor_id,
                                "analysis": analysis
                            })
                            # Send usage update to all agents
                            await broadcast_to_agents(site, {
                                "type": "ai_usage_update",
                                "feature": "analysis",
                                "used": analysis_usage.get("used"),
                                "limit": analysis_usage.get("limit")
                            })
                        else:
                            # Limit reached - notify all agents
                            await broadcast_to_agents(site, {
                                "type": "ai_limit_reached",
                                "feature": "analysis",
                                "message": analysis_usage.get("message"),
                                "used": analysis_usage.get("used"),
                                "limit": analysis_usage.get("limit")
                            })
                    elif site.get("auto_reply_enabled", False):
                        # Use RAG-enhanced analysis for auto-reply to leverage knowledge base
                        analysis = await analyze_customer_message_with_rag(msg, site_id, conversation_id, internal_visitor_id)

                    # Auto-reply if enabled
                    if site.get("auto_reply_enabled", False) and analysis and analysis.get("suggested_reply"):
                        # Check and record AI auto-reply usage
                        auto_reply_usage = await check_and_record_ai_usage(site_id, "auto_reply")
                        if auto_reply_usage.get("allowed"):
                            auto_msg = analysis["suggested_reply"]

                            # Get first available agent for saving the message
                            first_agent_id, first_agent = get_first_available_agent(site)

                            # Save auto-reply to API
                            if conversation_id and first_agent_id:
                                await save_message_to_api(
                                    conversation_id,
                                    "agent",
                                    first_agent_id,
                                    auto_msg,
                                    "text",
                                    None
                                )

                            # Send to customer
                            await ws.send_json({
                                "type": "message",
                                "from": "support",
                                "name": first_agent.get("username", "Support") if first_agent else "Support",
                                "message": auto_msg
                            })

                            # Notify all agents of auto-reply with usage
                            await broadcast_to_agents(site, {
                                "type": "auto_reply_sent",
                                "to": visitor_id,
                                "message": auto_msg
                            })
                            await broadcast_to_agents(site, {
                                "type": "ai_usage_update",
                                "feature": "auto_reply",
                                "used": auto_reply_usage.get("used"),
                                "limit": auto_reply_usage.get("limit")
                            })
                        else:
                            # Limit reached - notify all agents
                            await broadcast_to_agents(site, {
                                "type": "ai_limit_reached",
                                "feature": "auto_reply",
                                "message": auto_reply_usage.get("message"),
                                "used": auto_reply_usage.get("used"),
                                "limit": auto_reply_usage.get("limit")
                            })

            # ----- SUPPORT MESSAGE TO CUSTOMER -----
            elif role == SUPPORT and data.get("to") and not data.get("type"):
                to = data.get("to")
                msg = data.get("message", "")
                file_data = data.get("file")
                agent_user_id = auth.get("user_id")
                agent_username = auth.get("username", "Support")

                # Get conversation ID for target visitor
                visitor_data = VISITOR_DATA.get(to, {})
                conversation_id = visitor_data.get("conversation_id")

                # Save message to API
                if conversation_id and agent_user_id:
                    await save_message_to_api(
                        conversation_id,
                        "agent",
                        agent_user_id,
                        msg,
                        "file" if file_data else "text",
                        file_data.get("id") if file_data else None
                    )

                if to in site["customers"]:
                    msg_payload = {
                        "type": "message",
                        "from": "support",
                        "name": agent_username,
                        "message": msg
                    }

                    if file_data:
                        msg_payload["file"] = file_data

                    await site["customers"][to].send_json(msg_payload)

    # -------- DISCONNECT --------
    except WebSocketDisconnect:
        if role == CUSTOMER:
            site["customers"].pop(visitor_id, None)
            site["names"].pop(visitor_id, None)
            VISITOR_DATA.pop(visitor_id, None)

            # Notify all agents that user left
            await broadcast_to_agents(site, {
                "type": "user_left",
                "visitorId": visitor_id
            })

        elif role == SUPPORT:
            agent_user_id = auth.get("user_id")
            agent_data = site["agents"].get(agent_user_id, {})
            agent_token = agent_data.get("token")
            agent_username = agent_data.get("username")

            # Update agent status to offline via API
            if agent_token:
                await update_agent_status(agent_token, "offline")

            # Broadcast to admins that agent is offline
            await broadcast_to_admins(site, {
                "type": "agent_offline",
                "userId": agent_user_id,
                "username": agent_username,
                "status": "offline"
            })

            # Broadcast to other agents that this agent left
            await broadcast_to_agents(site, {
                "type": "agent_left",
                "agentId": agent_user_id,
                "username": agent_username
            }, exclude_agent=agent_user_id)

            # Remove from agents dict
            site["agents"].pop(agent_user_id, None)
            site["supervisors"].pop(agent_user_id, None)

            # Notify customers only if no agents remain
            if not site["agents"]:
                for cws in site["customers"].values():
                    await cws.send_json({
                        "type": "support_left"
                    })

        elif role == ADMIN:
            admin_id = auth.get("user_id", token) if auth else token
            site["admins"].pop(admin_id, None)

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
