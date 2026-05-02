"""Vercel Python serverless: POST JSON body -> Excel workbook bytes."""
from __future__ import annotations

import json
import os
import sys
import traceback
from http.server import BaseHTTPRequestHandler

# Colocate imports under api/ so the function bundle always includes excel_export/.
_ROOT = os.path.dirname(os.path.abspath(__file__))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from excel_export.workbook import build_workbook  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:  # noqa: N802
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b"{}"
            data = json.loads(raw.decode("utf-8"))
            buf = build_workbook(data)
            self.send_response(200)
            self.send_header(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            self.end_headers()
            self.wfile.write(buf)
        except Exception:  # noqa: BLE001
            err = traceback.format_exc()
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"error": err}).encode("utf-8"))

    def log_message(self, _format: str, *_args: object) -> None:
        return
