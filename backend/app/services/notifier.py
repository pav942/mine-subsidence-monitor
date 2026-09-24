import os
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_APP_PASSWORD = os.getenv("SENDER_APP_PASSWORD")
RECIPIENT_EMAILS = [e.strip() for e in os.getenv("RECIPIENT_EMAILS", "").split(",") if e.strip()]

COOLDOWN_MINUTES = 15
_last_sent = {}  # node_id -> datetime of last email sent (in-memory, resets on backend restart)


def send_critical_alert_email(node_id: str, risk_score: float, message: str):
    if not SENDER_EMAIL or not SENDER_APP_PASSWORD or not RECIPIENT_EMAILS:
        print("[EMAIL] Skipped — SENDER_EMAIL / SENDER_APP_PASSWORD / RECIPIENT_EMAILS not set in .env")
        return

    now = datetime.utcnow()
    last = _last_sent.get(node_id)
    if last and (now - last) < timedelta(minutes=COOLDOWN_MINUTES):
        print(f"[EMAIL] Skipped for {node_id} — cooldown active ({COOLDOWN_MINUTES} min)")
        return

    subject = f"CRITICAL Subsidence Alert - {node_id}"
    body = (
        f"CRITICAL SUBSIDENCE ALERT\n\n"
        f"Node: {node_id}\n"
        f"Risk Score: {risk_score}%\n"
        f"Details: {message}\n\n"
        f"This is a prototype/demonstration alert based on synthetic data."
    )

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = ", ".join(RECIPIENT_EMAILS)

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, RECIPIENT_EMAILS, msg.as_string())
        _last_sent[node_id] = now
        print(f"[EMAIL] Critical alert sent for {node_id}")
    except Exception as e:
        print(f"[EMAIL] Failed to send alert for {node_id}: {e}")