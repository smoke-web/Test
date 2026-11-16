"""Главный скрипт агента «Охотник за рилсами».

Что делает за один запуск:
  1. Для каждого аккаунта из config.json берёт последние посты через Instagram Graph API.
  2. Оставляет только рилсы не старше max_age_days.
  3. Считает «обычный» уровень лайков автора (медиана по его рилсам).
  4. Рилс считается «залетевшим», если лайков в outlier_multiplier раз больше обычного
     и не меньше min_likes. Если рилсов мало для медианы — сравнивает с числом подписчиков.
  5. Новые находки (которых ещё нет в state/seen.json) отправляет в Telegram.

Запуск:
  python agents/reels_hunter/tools/hunt.py              — боевой режим (нужны секреты в окружении)
  python agents/reels_hunter/tools/hunt.py --dry-run    — ничего не шлёт и не сохраняет, печатает
  python agents/reels_hunter/tools/hunt.py --fixture f.json --dry-run — на тестовых данных
"""
import argparse
import html
import json
import os
import statistics
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import instagram  # noqa: E402
import telegram  # noqa: E402

AGENT_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = AGENT_DIR / "config.json"
STATE_PATH = AGENT_DIR / "state" / "seen.json"
ERROR_ALERT_INTERVAL = timedelta(hours=12)


def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default


def parse_ts(ts: str) -> datetime:
    # Instagram отдаёт формат вида 2026-11-16T10:00:00+0000
    return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%S%z")


def is_reel(m: dict) -> bool:
    return m.get("media_product_type") == "REELS" or (
        m.get("media_product_type") is None and m.get("media_type") == "VIDEO"
    )


def find_hits(account: dict, cfg: dict, now: datetime) -> list:
    followers = account.get("followers_count") or 0
    reels = [m for m in account["media"] if is_reel(m) and m.get("like_count") is not None]
    if not reels:
        return []

    likes_all = [m["like_count"] for m in reels]
    use_median = len(reels) >= cfg["min_reels_for_baseline"]
    baseline = statistics.median(likes_all) if use_median else None

    max_age = timedelta(days=cfg["max_age_days"])
    hits = []
    for m in reels:
        age = now - parse_ts(m["timestamp"])
        if age > max_age:
            continue
        likes = m["like_count"]
        if likes < cfg["min_likes"]:
            continue
        if use_median:
            score = likes / max(baseline, 1)
            if score < cfg["outlier_multiplier"]:
                continue
            reason = f"в {score:.1f}× больше лайков, чем обычно у автора (~{int(baseline)})"
        else:
            if not followers or likes < followers * cfg["fallback_likes_to_followers_ratio"]:
                continue
            score = likes / followers
            reason = f"лайков = {score:.0%} от числа подписчиков"
        hits.append({
            "id": m["id"],
            "username": account["username"],
            "followers": followers,
            "likes": likes,
            "comments": m.get("comments_count", 0),
            "age_hours": age.total_seconds() / 3600,
            "permalink": m.get("permalink", ""),
            "caption": (m.get("caption") or "").strip(),
            "score": score,
            "reason": reason,
        })
    return hits


def fmt_age(hours: float) -> str:
    return f"{hours:.0f} ч назад" if hours < 48 else f"{hours / 24:.0f} дн назад"


def format_hit(h: dict) -> str:
    caption = h["caption"]
    if len(caption) > 300:
        caption = caption[:300] + "…"
    lines = [
        f"🔥 <b>Залетает рилс у @{html.escape(h['username'])}</b>",
        f"❤️ {h['likes']:,} лайков · 💬 {h['comments']:,} комм. · опубликован {fmt_age(h['age_hours'])}".replace(",", " "),
        f"👥 Подписчиков у автора: {h['followers']:,}".replace(",", " "),
        f"📈 {html.escape(h['reason'])}",
    ]
    if caption:
        lines += ["", f"<i>{html.escape(caption)}</i>"]
    lines += ["", html.escape(h["permalink"])]
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="не слать в Telegram и не сохранять состояние")
    ap.add_argument("--fixture", help="JSON с тестовыми данными вместо запроса к Instagram")
    args = ap.parse_args()

    cfg = load_json(CONFIG_PATH, None)
    state = load_json(STATE_PATH, {"seen": [], "last_error_alert": None})
    seen = set(state.get("seen", []))
    now = datetime.now(timezone.utc)

    tg_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    tg_chat = os.environ.get("TELEGRAM_CHAT_ID", "")
    ig_user = os.environ.get("IG_USER_ID", "")
    ig_token = os.environ.get("IG_ACCESS_TOKEN", "")

    def notify(text: str) -> None:
        if args.dry_run:
            print("----- сообщение в Telegram -----\n" + text + "\n")
        else:
            telegram.send_message(tg_token, tg_chat, text)

    if not args.dry_run and not (tg_token and tg_chat):
        print("Не заданы TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID", file=sys.stderr)
        return 1

    fixture = load_json(Path(args.fixture), None) if args.fixture else None
    if fixture is None and not (ig_user and ig_token):
        notify("⚠️ Охотник за рилсами: не заданы IG_USER_ID / IG_ACCESS_TOKEN в секретах GitHub.")
        return 1

    all_hits, errors = [], []
    for username in cfg["accounts"]:
        try:
            if fixture is not None:
                account = fixture[username]
            else:
                account = instagram.fetch_account(
                    ig_user, ig_token, username, cfg["media_per_account"], cfg.get("graph_api_version", "")
                )
            all_hits += find_hits(account, cfg, now)
        except instagram.InstagramError as e:
            errors.append((username, e))
            print(f"[{username}] ошибка Instagram (код {e.code}): {e}", file=sys.stderr)
        except Exception as e:  # noqa: BLE001
            errors.append((username, e))
            print(f"[{username}] ошибка: {e}", file=sys.stderr)

    new_hits = sorted((h for h in all_hits if h["id"] not in seen), key=lambda h: h["score"], reverse=True)
    for h in new_hits[: cfg["max_alerts_per_run"]]:
        notify(format_hit(h))
    # Помечаем как увиденные все новые находки, даже сверх лимита, чтобы не завалить чат повторно.
    seen_list = state.get("seen", []) + [h["id"] for h in new_hits]
    print(f"Находок всего: {len(all_hits)}, новых: {len(new_hits)}, ошибок: {len(errors)}")

    # Сообщаем об ошибках не чаще раза в 12 часов, чтобы не спамить каждые 30 минут.
    if errors:
        last = state.get("last_error_alert")
        if not last or now - datetime.fromisoformat(last) > ERROR_ALERT_INTERVAL:
            token_dead = any(getattr(e, "code", None) == 190 for _, e in errors)
            text = "⚠️ Охотник за рилсами: проблемы при проверке.\n"
            if token_dead:
                text += "Похоже, токен Instagram истёк — его нужно обновить в секретах GitHub (IG_ACCESS_TOKEN).\n"
            text += "\n".join(f"• @{html.escape(u)}: {html.escape(str(e))[:200]}" for u, e in errors)
            notify(text)
            state["last_error_alert"] = now.isoformat()

    if not args.dry_run:
        state["seen"] = seen_list[-5000:]
        STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
        STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    # Ошибка по всем аккаунтам сразу — помечаем запуск как упавший, чтобы было видно в GitHub.
    return 1 if errors and len(errors) == len(cfg["accounts"]) else 0


if __name__ == "__main__":
    sys.exit(main())
