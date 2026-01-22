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


@app.get("/register.html")
def register_page_html():
    return FileResponse(BASE_DIR / "register.html")


@app.get("/login")
def unified_login_page():
    return FileResponse(BASE_DIR / "login.html")


@app.get("/login.html")
def unified_login_page_html():
    return FileResponse(BASE_DIR / "login.html")


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


@app.get("/admin-settings")
def admin_settings_page():
    return FileResponse(BASE_DIR / "admin" / "admin-settings.html")


@app.get("/admin-settings.html")
def admin_settings_page_html():
    return FileResponse(BASE_DIR / "admin" / "admin-settings.html")


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
    return FileResponse(BASE_DIR / "site-admin.html")

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


async def init_chat_session(site_id: str, visitor_id: str, name: str = None):
    """Initialize chat session via .NET API"""
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{API_BASE_URL}/chat/init",
                json={
                    "siteId": site_id,
                    "visitorId": visitor_id,
                    "name": name
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

        # Notify support dashboard - show as auto-message, not a separate user
        if site.get("support"):
            await site["support"].send_json({
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
            "support": None,
            "support_name": None,
            "support_user_id": None,
            "customers": {},
            "names": {},
            "analysis_enabled": False,  # Default OFF
            "auto_reply_enabled": False  # Default OFF
        }

    site = connections[site_id]

    # -------- REGISTER ROLE --------
    if role == SUPPORT:
        site["support"] = ws
        site["support_name"] = auth["username"]
        site["support_user_id"] = auth.get("user_id")

        # notify existing customers
        for vid, cws in site["customers"].items():
            visitor_data = VISITOR_DATA.get(vid, {})
            await ws.send_json({
                "type": "user_joined",
                "visitorId": vid,
                "name": site["names"].get(vid, vid),
                "conversationId": visitor_data.get("conversation_id")
            })

        # notify customers support joined
        for cws in site["customers"].values():
            await cws.send_json({
                "type": "support_joined",
                "name": site["support_name"]
            })

    elif role == CUSTOMER:
        site["customers"][visitor_id] = ws

    else:
        await ws.close()
        return

    # -------- MESSAGE LOOP --------
    try:
        while True:
            data = await ws.receive_json()

            # ----- STATE REQUEST -----
            if data.get("type") == "get_state" and role == CUSTOMER:
                if site["support_name"]:
                    await ws.send_json({
                        "type": "support_joined",
                        "name": site["support_name"]
                    })

            # ----- INIT USER -----
            elif data.get("type") == "init" and role == CUSTOMER:
                name = data.get("name", visitor_id)
                site["names"][visitor_id] = name

                # Initialize chat session with API (creates visitor & conversation)
                chat_data = await init_chat_session(site_id, visitor_id, name)
                conversation_id = None
                if chat_data:
                    conversation_id = chat_data.get("conversationId")
                    VISITOR_DATA[visitor_id] = {
                        "internal_visitor_id": chat_data.get("visitorId"),
                        "conversation_id": conversation_id
                    }

                if site["support"]:
                    await site["support"].send_json({
                        "type": "user_joined",
                        "visitorId": visitor_id,
                        "name": name,
                        "conversationId": conversation_id
                    })

                # Send welcome message to customer
                await send_welcome_message(site_id, visitor_id, conversation_id, ws, site)

            # ----- TYPING INDICATORS -----
            elif data.get("type") == "typing_start" and role == CUSTOMER:
                if site["support"]:
                    await site["support"].send_json({
                        "type": "typing_start",
                        "visitorId": visitor_id,
                        "name": site["names"].get(visitor_id, visitor_id)
                    })

            elif data.get("type") == "typing_stop" and role == CUSTOMER:
                if site["support"]:
                    await site["support"].send_json({
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

                if site["support"]:
                    msg_payload = {
                        "type": "message",
                        "from": visitor_id,
                        "name": site["names"].get(visitor_id, visitor_id),
                        "message": msg
                    }

                    if file_data:
                        msg_payload["file"] = file_data

                    await site["support"].send_json(msg_payload)

                    # Run AI analysis if analysis or auto-reply is enabled
                    should_analyze = site.get("analysis_enabled", False) or site.get("auto_reply_enabled", False)
                    if msg and not file_data and should_analyze:
                        analysis = None
                        analysis_usage = None

                        # Check and record AI analysis usage if analysis is enabled
                        if site.get("analysis_enabled", False):
                            analysis_usage = await check_and_record_ai_usage(site_id, "analysis")
                            if analysis_usage.get("allowed"):
                                analysis = await analyze_customer_message(msg, conversation_id, internal_visitor_id)
                                # Send analysis to support dashboard
                                await site["support"].send_json({
                                    "type": "analysis",
                                    "from": visitor_id,
                                    "analysis": analysis
                                })
                                # Send usage update to support dashboard
                                await site["support"].send_json({
                                    "type": "ai_usage_update",
                                    "feature": "analysis",
                                    "used": analysis_usage.get("used"),
                                    "limit": analysis_usage.get("limit")
                                })
                            else:
                                # Limit reached - notify support
                                await site["support"].send_json({
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

                                # Save auto-reply to API
                                if conversation_id and site.get("support_user_id"):
                                    await save_message_to_api(
                                        conversation_id,
                                        "agent",
                                        site["support_user_id"],
                                        auto_msg,
                                        "text",
                                        None
                                    )

                                # Send to customer
                                await ws.send_json({
                                    "type": "message",
                                    "from": "support",
                                    "name": site.get("support_name", "Support"),
                                    "message": auto_msg
                                })

                                # Notify support dashboard of auto-reply with usage
                                await site["support"].send_json({
                                    "type": "auto_reply_sent",
                                    "to": visitor_id,
                                    "message": auto_msg
                                })
                                await site["support"].send_json({
                                    "type": "ai_usage_update",
                                    "feature": "auto_reply",
                                    "used": auto_reply_usage.get("used"),
                                    "limit": auto_reply_usage.get("limit")
                                })
                            else:
                                # Limit reached - notify support
                                await site["support"].send_json({
                                    "type": "ai_limit_reached",
                                    "feature": "auto_reply",
                                    "message": auto_reply_usage.get("message"),
                                    "used": auto_reply_usage.get("used"),
                                    "limit": auto_reply_usage.get("limit")
                                })

            # ----- SUPPORT MESSAGE -----
            elif role == SUPPORT:
                to = data.get("to")
                msg = data.get("message", "")
                file_data = data.get("file")

                # Get conversation ID for target visitor
                visitor_data = VISITOR_DATA.get(to, {})
                conversation_id = visitor_data.get("conversation_id")

                # Save message to API
                if conversation_id and site.get("support_user_id"):
                    await save_message_to_api(
                        conversation_id,
                        "agent",
                        site["support_user_id"],
                        msg,
                        "file" if file_data else "text",
                        file_data.get("id") if file_data else None
                    )

                if to in site["customers"]:
                    msg_payload = {
                        "type": "message",
                        "from": "support",
                        "name": site.get("support_name", "Support"),
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

            if site["support"]:
                await site["support"].send_json({
                    "type": "user_left",
                    "visitorId": visitor_id
                })

        elif role == SUPPORT:
            site["support"] = None
            site["support_name"] = None
            site["support_user_id"] = None

            for cws in site["customers"].values():
                await cws.send_json({
                    "type": "support_left"
                })

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
