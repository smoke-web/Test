"""Отправка сообщений в Telegram через Bot API (только стандартная библиотека)."""
import json
import urllib.parse
import urllib.request


def send_message(token: str, chat_id: str, text: str) -> None:
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = urllib.parse.urlencode({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": "false",
    }).encode()
    with urllib.request.urlopen(url, data=data, timeout=30) as resp:
        body = json.loads(resp.read().decode())
    if not body.get("ok"):
        raise RuntimeError(f"Telegram вернул ошибку: {body}")
