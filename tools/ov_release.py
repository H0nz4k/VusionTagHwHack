"""Pinned OpenVusionHack firmware release. Latest is an explicit pointer, not mtime."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

MANIFEST_NAME = "latest.json"


class ReleaseError(Exception):
    """User-facing Czech error for a bad or missing release."""


@dataclass(frozen=True)
class Release:
    id: str
    hex_path: Path
    sha256: str
    rom_bytes: int
    verified: bool
    banner: str
    note: str


def repo_root(start: Path | None = None) -> Path:
    here = (start or Path(__file__).resolve()).parent
    for p in [here, *here.parents]:
        if (p / "firmware" / "releases" / MANIFEST_NAME).is_file() or (p / "AGENTS.md").is_file():
            return p
    raise ReleaseError("Nenalezen kořen repozitáře (AGENTS.md / firmware/releases).")


def releases_dir(root: Path | None = None) -> Path:
    return (root or repo_root()) / "firmware" / "releases"


def load_manifest(root: Path | None = None) -> dict:
    path = releases_dir(root) / MANIFEST_NAME
    if not path.is_file():
        raise ReleaseError(f"Chybí release manifest: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise ReleaseError(f"Neplatný JSON manifest: {e}") from e
    if not isinstance(data, dict) or data.get("schema") != 1:
        raise ReleaseError("Manifest musí mít schema 1.")
    return data


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def select_latest(root: Path | None = None) -> Release:
    root = root or repo_root()
    man = load_manifest(root)
    latest_id = man.get("latest")
    releases = man.get("releases") or {}
    if not latest_id or latest_id not in releases:
        raise ReleaseError("Manifest nemá platný klíč latest.")
    rec = releases[latest_id]
    if not rec.get("verified"):
        raise ReleaseError(f"Release {latest_id} není označený jako physically ověřený.")
    hex_name = rec.get("hex")
    if not hex_name:
        raise ReleaseError(f"Release {latest_id} nemá cestu k HEX.")
    hex_path = releases_dir(root) / hex_name
    if not hex_path.is_file():
        raise ReleaseError(f"Chybí HEX soubor: {hex_path}")
    want = str(rec.get("sha256") or "").lower()
    got = file_sha256(hex_path)
    if not want or got != want:
        raise ReleaseError(
            f"SHA-256 nesouhlasí pro {hex_path.name}: očekáváno {want}, je {got}."
        )
    return Release(
        id=str(rec.get("id") or latest_id),
        hex_path=hex_path,
        sha256=got,
        rom_bytes=int(rec.get("rom_bytes") or 0),
        verified=True,
        banner=str(rec.get("banner") or ""),
        note=str(rec.get("note") or ""),
    )
