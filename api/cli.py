"""Read JSON export payload from stdin; write .xlsx bytes to stdout (local dev)."""
from __future__ import annotations

import json
import os
import sys

_ROOT = os.path.dirname(os.path.abspath(__file__))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from excel_export.workbook import build_workbook  # noqa: E402


def main() -> None:
    data = json.load(sys.stdin)
    buf = build_workbook(data)
    sys.stdout.buffer.write(buf)


if __name__ == "__main__":
    main()
