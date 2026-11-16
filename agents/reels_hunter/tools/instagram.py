"""Получение публичных рилсов чужих аккаунтов через Instagram Graph API (Business Discovery).

Работает только для аккаунтов «Автор»/«Бизнес». Нужны:
  IG_USER_ID      — ID твоего Instagram-аккаунта «Автор»/«Бизнес» (не ник, а число)
  IG_ACCESS_TOKEN — токен доступа Meta с правами instagram_basic и pages_show_list
"""
import json
import urllib.error
import urllib.parse
import urllib.request

MEDIA_FIELDS = "id,caption,like_count,comments_count,media_type,media_product_type,permalink,timestamp"


class InstagramError(Exception):
    def __init__(self, message: str, code=None):
        super().__init__(message)
        self.code = code


def fetch_account(ig_user_id: str, token: str, username: str, limit: int, api_version: str = "") -> dict:
    """Возвращает {'username', 'followers_count', 'media': [...]}."""
    fields = (
        f"business_discovery.username({username})"
        f"{{username,followers_count,media_count,media.limit({limit}){{{MEDIA_FIELDS}}}}}"
    )
    base = "https://graph.facebook.com"
    if api_version:
        base += f"/{api_version}"
    url = f"{base}/{ig_user_id}?" + urllib.parse.urlencode({"fields": fields, "access_token": token})
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            body = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read().decode()).get("error", {})
        except Exception:
            err = {}
        raise InstagramError(err.get("message", str(e)), err.get("code")) from None

    bd = body.get("business_discovery", {})
    return {
        "username": bd.get("username", username),
        "followers_count": bd.get("followers_count"),
        "media": bd.get("media", {}).get("data", []),
    }
