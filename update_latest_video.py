#!/usr/bin/env python3
import argparse
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


YOUTUBE_ID_PATTERNS = [
    re.compile(r"[?&]v=([A-Za-z0-9_-]{11})"),
    re.compile(r"youtu\.be/([A-Za-z0-9_-]{11})"),
    re.compile(r"embed/([A-Za-z0-9_-]{11})"),
    re.compile(r"shorts/([A-Za-z0-9_-]{11})"),
    re.compile(r"live/([A-Za-z0-9_-]{11})"),
]

IFRAME_PATTERN = re.compile(
    r'(<iframe[^>]*id="yt-player"[^>]*src=")https://www\.youtube\.com/embed/[^"]+(")',
    re.IGNORECASE | re.DOTALL,
)

DEFAULT_ENDPOINT = "https://n8n.caminhosanto.com/webhook/last_yt_video"


def extract_video_id(value: str) -> str:
    candidate = value.strip()

    if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate):
        return candidate

    for pattern in YOUTUBE_ID_PATTERNS:
        match = pattern.search(candidate)
        if match:
            return match.group(1)

    raise ValueError(
        "Nao foi possivel identificar um ID de video valido. Informe a URL completa ou o ID do YouTube."
    )


def update_index_html(file_path: Path, video_id: str) -> None:
    content = file_path.read_text(encoding="utf-8")
    new_src = f"https://www.youtube.com/embed/{video_id}"

    updated_content, replacements = IFRAME_PATTERN.subn(rf"\1{new_src}\2", content, count=1)

    if replacements != 1:
        raise RuntimeError('Nao encontrei um iframe com id="yt-player" para atualizar.')

    file_path.write_text(updated_content, encoding="utf-8")


def fetch_video_url(endpoint: str) -> str:
    query = urlencode({"_t": int(time.time())})
    separator = "&" if "?" in endpoint else "?"
    url = f"{endpoint}{separator}{query}"

    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Cache-Control": "no-cache",
        },
    )
    with urlopen(request, timeout=30) as response:
        payload = json.load(response)

    video_url = payload.get("video_url")
    if not video_url:
        raise RuntimeError('O endpoint nao retornou o campo "video_url".')

    return video_url


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Atualiza o iframe principal do YouTube na home com um video fixo."
    )
    parser.add_argument(
        "video",
        nargs="?",
        help="URL completa do YouTube ou apenas o ID do video.",
    )
    parser.add_argument(
        "--file",
        default="index.html",
        help='Arquivo HTML a ser atualizado. Padrao: "index.html".',
    )
    parser.add_argument(
        "--endpoint",
        default=DEFAULT_ENDPOINT,
        help="Endpoint JSON do n8n que retorna o campo video_url.",
    )
    args = parser.parse_args()

    try:
        video_source = args.video or fetch_video_url(args.endpoint)
        video_id = extract_video_id(video_source)
        file_path = Path(args.file).resolve()
        update_index_html(file_path, video_id)
    except FileNotFoundError:
        print(f"Arquivo nao encontrado: {args.file}", file=sys.stderr)
        return 1
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(f"Video atualizado com sucesso para: https://www.youtube.com/embed/{video_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
