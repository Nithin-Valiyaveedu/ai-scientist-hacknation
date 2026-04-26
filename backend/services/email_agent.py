"""
Agentic email service — LLM writes subject + body text, Python renders
the materials as a proper HTML table. Sent via Resend as an HTML email
so the table always renders correctly in every email client.
"""
import json
import os
import logging

import httpx
from openai import AsyncOpenAI

log = logging.getLogger(__name__)

_client = AsyncOpenAI()

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL     = os.getenv("FROM_EMAIL", "onboarding@resend.dev")
# For onboarding@resend.dev (sandbox) this MUST be your Resend account email.
# Verify a custom domain at resend.com to send to any address.
SUPPLIER_EMAIL = os.getenv("SUPPLIER_EMAIL", "xiniu2224@gmail.com")

_COMPOSE_TOOL = {
    "type": "function",
    "function": {
        "name": "compose_rfq",
        "description": "Compose the subject and body text of a professional RFQ email.",
        "parameters": {
            "type": "object",
            "properties": {
                "subject": {
                    "type": "string",
                    "description": "Email subject line.",
                },
                "intro": {
                    "type": "string",
                    "description": (
                        "Opening paragraph(s): greet the supplier, state the purpose "
                        "and brief scientific context. 2-4 sentences."
                    ),
                },
                "closing": {
                    "type": "string",
                    "description": (
                        "Closing paragraph(s): request a formal quotation, ask for "
                        "delivery timeline, and sign off professionally."
                    ),
                },
            },
            "required": ["subject", "intro", "closing"],
        },
    },
}


def _build_html(
    intro: str,
    closing: str,
    materials: list[dict],
    sender_name: str,
    total: float,
) -> str:
    """Render a clean HTML email with an inline-styled materials table."""

    def row_html(cells: list[str], is_header: bool = False) -> str:
        tag = "th" if is_header else "td"
        base = (
            "font-family:'Helvetica Neue',Arial,sans-serif;"
            "font-size:13px;padding:10px 14px;text-align:left;"
            "border-bottom:1px solid #e5e7eb;"
        )
        header_extra = "background:#1e3a5f;color:#ffffff;font-weight:600;letter-spacing:0.03em;"
        last_extra   = "text-align:right;font-variant-numeric:tabular-nums;"

        parts = []
        for i, cell in enumerate(cells):
            style = base
            if is_header:
                style += header_extra
            if i == len(cells) - 1:
                style += last_extra
            parts.append(f'<{tag} style="{style}">{cell}</{tag}>')
        return "<tr>" + "".join(parts) + "</tr>"

    rows_html = ""
    for i, m in enumerate(materials):
        price_val = m.get("unit_price", 0)
        price_str = f"${float(price_val):.2f}" if price_val else "TBD"
        bg = "#f9fafb" if i % 2 == 1 else "#ffffff"
        cells = [
            m.get("name", "—"),
            str(m.get("catalog_number") or "N/A"),
            m.get("supplier", "—"),
            m.get("quantity", "—"),
            price_str,
        ]
        td_style = (
            f"font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;"
            f"padding:10px 14px;border-bottom:1px solid #e5e7eb;background:{bg};"
        )
        last_td_style = td_style + "text-align:right;font-variant-numeric:tabular-nums;"
        row_tds = "".join(
            f'<td style="{last_td_style if j == len(cells)-1 else td_style}">{c}</td>'
            for j, c in enumerate(cells)
        )
        rows_html += f"<tr>{row_tds}</tr>"

    # Total row
    total_style = (
        "font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;"
        "padding:10px 14px;font-weight:700;background:#f0f4ff;"
        "border-top:2px solid #1e3a5f;color:#1e3a5f;"
    )
    total_right = total_style + "text-align:right;"
    rows_html += (
        "<tr>"
        f'<td colspan="4" style="{total_right}">TOTAL</td>'
        f'<td style="{total_right}">${total:.2f}</td>'
        "</tr>"
    )

    header_row = row_html(["Material", "SKU", "Supplier", "Qty", "Unit Price"], is_header=True)

    # Paragraph helper
    def paragraphs(text: str) -> str:
        p_style = (
            "font-family:'Helvetica Neue',Arial,sans-serif;"
            "font-size:14px;color:#374151;line-height:1.7;margin:0 0 14px 0;"
        )
        return "".join(f'<p style="{p_style}">{line.strip()}</p>' for line in text.strip().splitlines() if line.strip())

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">

        <!-- Header banner -->
        <tr>
          <td style="background:#1e3a5f;padding:24px 32px;">
            <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
              Request for Quotation
            </p>
            <p style="margin:6px 0 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#93c5fd;letter-spacing:0.04em;text-transform:uppercase;">
              LabAgent Lab
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px 0 32px;">
            {paragraphs(intro)}
          </td>
        </tr>

        <!-- Materials table -->
        <tr>
          <td style="padding:8px 32px 24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
              {header_row}
              {rows_html}
            </table>
          </td>
        </tr>

        <!-- Closing -->
        <tr>
          <td style="padding:0 32px 28px 32px;">
            {paragraphs(closing)}
            <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#374151;line-height:1.7;margin:16px 0 0 0;">
              Best regards,<br>
              <strong>{sender_name}</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9ca3af;">
              Generated by LabAgent · Automated Lab Procurement
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


async def compose_and_send(
    supplier: str,
    materials: list[dict],
    experiment_question: str,
    sender_name: str = "LabAgent Lab",
) -> dict:
    """
    LLM writes subject + intro + closing text.
    Python builds the HTML table deterministically.
    Returns {"subject": ..., "body": ..., "message_id": ...}.
    """
    unique_suppliers = sorted({m.get("supplier", supplier) for m in materials if m.get("supplier")})
    suppliers_str = ", ".join(unique_suppliers) if unique_suppliers else supplier

    total = sum(float(m.get("unit_price", 0)) for m in materials if m.get("unit_price"))
    n = len(materials)

    response = await _client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional lab procurement agent. "
                    "Write concise, polite RFQ email text for a research lab. "
                    "Do NOT include a materials table — that will be added automatically."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Compose an RFQ email to {suppliers_str} for:\n\n"
                    f"Experiment: {experiment_question}\n"
                    f"Number of line items: {n}\n"
                    f"Estimated total: ${total:.2f}\n\n"
                    f"Sign off as: {sender_name}"
                ),
            },
        ],
        tools=[_COMPOSE_TOOL],
        tool_choice={"type": "function", "function": {"name": "compose_rfq"}},
    )

    args = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
    subject: str = args["subject"]
    intro:   str = args["intro"]
    closing: str = args["closing"]

    html_body = _build_html(intro, closing, materials, sender_name, total)
    plain_body = f"{intro}\n\n[Materials table — view in an HTML-capable email client]\n\n{closing}\n\n{sender_name}"

    message_id = await _dispatch_email(subject, html_body, plain_body)
    log.info("Email sent to %s — subject: %s — id: %s", SUPPLIER_EMAIL, subject, message_id)

    return {"subject": subject, "body": intro + "\n\n" + closing, "message_id": message_id}


async def _dispatch_email(subject: str, html: str, text: str) -> str:
    """POST to Resend API and return the message id."""
    if not RESEND_API_KEY or RESEND_API_KEY in ("re_...", ""):
        raise RuntimeError(
            "RESEND_API_KEY is not configured. "
            "Set it in backend/.env (get a free key at https://resend.com)."
        )

    async with httpx.AsyncClient(timeout=20.0) as http:
        resp = await http.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from":    FROM_EMAIL,
                "to":      [SUPPLIER_EMAIL],
                "subject": subject,
                "html":    html,
                "text":    text,
            },
        )
        resp.raise_for_status()
        return resp.json().get("id", "")
