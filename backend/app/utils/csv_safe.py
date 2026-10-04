"""CSV helpers that neutralise spreadsheet formula injection."""
import csv
import io
from collections.abc import Iterable

_DANGEROUS = ("=", "+", "-", "@", "\t", "\r", "\n")


def safe_cell(value) -> str:
    text = "" if value is None else str(value)
    if text.startswith(_DANGEROUS):
        return "\x27" + text  # leading apostrophe makes Excel/Sheets treat it as text
    return text


def to_csv(header: list[str], rows: Iterable[Iterable]) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf, quoting=csv.QUOTE_ALL)
    writer.writerow([safe_cell(h) for h in header])
    for row in rows:
        writer.writerow([safe_cell(c) for c in row])
    return buf.getvalue()
