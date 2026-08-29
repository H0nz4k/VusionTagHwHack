"""Unit/mock tests for tag-flash-latest and tag-send-image."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

TOOLS = Path(__file__).resolve().parents[1]
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))

from ov_release import ReleaseError, file_sha256, select_latest  # noqa: E402
from tag_flash_latest import flash_main  # noqa: E402
from tag_send_image import SendError, send_main, validate_bin  # noqa: E402
import tag_flash_latest as flash_mod  # noqa: E402
import tag_send_image as send_mod  # noqa: E402


def _write_manifest(tmp: Path, latest: str, rec: dict, hex_bytes: bytes = b":00000001FF\n") -> Path:
    rel = tmp / "firmware" / "releases"
    rel.mkdir(parents=True)
    hex_name = rec["hex"]
    (rel / hex_name).write_bytes(hex_bytes)
    rec = dict(rec)
    rec["sha256"] = file_sha256(rel / hex_name)
    man = {"schema": 1, "latest": latest, "releases": {rec["id"]: rec}}
    (rel / "latest.json").write_text(json.dumps(man), encoding="utf-8")
    (tmp / "AGENTS.md").write_text("x", encoding="utf-8")
    return tmp


def test_select_latest_ok(tmp_path: Path) -> None:
    rec = {"id": "v0.12b_nfc_epd", "hex": "v0.12b_nfc_epd.hex", "verified": True, "rom_bytes": 10}
    root = _write_manifest(tmp_path, "v0.12b_nfc_epd", rec)
    rel = select_latest(root)
    assert rel.id == "v0.12b_nfc_epd"
    assert rel.verified


def test_select_latest_sha_mismatch(tmp_path: Path) -> None:
    rec = {"id": "v1", "hex": "a.hex", "verified": True, "rom_bytes": 1}
    root = _write_manifest(tmp_path, "v1", rec)
    man = json.loads((root / "firmware/releases/latest.json").read_text(encoding="utf-8"))
    man["releases"]["v1"]["sha256"] = "00" * 32
    (root / "firmware/releases/latest.json").write_text(json.dumps(man), encoding="utf-8")
    with pytest.raises(ReleaseError, match="SHA-256"):
        select_latest(root)


def test_select_latest_missing_hex(tmp_path: Path) -> None:
    rel = tmp_path / "firmware" / "releases"
    rel.mkdir(parents=True)
    (tmp_path / "AGENTS.md").write_text("x", encoding="utf-8")
    man = {
        "schema": 1,
        "latest": "v1",
        "releases": {"v1": {"id": "v1", "hex": "gone.hex", "sha256": "ab", "verified": True}},
    }
    (rel / "latest.json").write_text(json.dumps(man), encoding="utf-8")
    with pytest.raises(ReleaseError, match="Chybí HEX"):
        select_latest(tmp_path)


def test_select_latest_unverified(tmp_path: Path) -> None:
    rec = {"id": "v1", "hex": "a.hex", "verified": False, "rom_bytes": 1}
    root = _write_manifest(tmp_path, "v1", rec)
    with pytest.raises(ReleaseError, match="ověřený"):
        select_latest(root)


def test_dry_run_does_not_erase(tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    rec = {"id": "v0.12b_nfc_epd", "hex": "v0.12b_nfc_epd.hex", "verified": True, "rom_bytes": 10}
    root = _write_manifest(tmp_path, "v0.12b_nfc_epd", rec)
    monkeypatch.setattr(flash_mod, "repo_root", lambda: root)

    def boom(*_a, **_k):
        raise AssertionError("cc-tool nesmí běžet při --dry-run")

    monkeypatch.setattr(flash_mod, "cc_tool", boom)
    monkeypatch.setattr(flash_mod, "run_relays", boom)
    rc = flash_main(["--dry-run"])
    assert rc == 0
    assert "erase/write neproběhly" in capsys.readouterr().out


def test_flash_requires_dev_confirm(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    rec = {"id": "v1", "hex": "a.hex", "verified": True, "rom_bytes": 1}
    root = _write_manifest(tmp_path, "v1", rec)
    monkeypatch.setattr(flash_mod, "repo_root", lambda: root)
    called: list[str] = []
    monkeypatch.setattr(flash_mod, "run_relays", lambda *_a, **_k: called.append("relays"))
    monkeypatch.setattr(flash_mod, "cc_tool", lambda *_a, **_k: (_ for _ in ()).throw(AssertionError("no cc")))
    rc = flash_main(["--yes"])
    assert rc == 2
    assert called == []


def test_validate_bin_missing(tmp_path: Path) -> None:
    with pytest.raises(SendError, match="neexistuje"):
        validate_bin(tmp_path / "no.bin")


def test_validate_bin_bad_len(tmp_path: Path) -> None:
    p = tmp_path / "x.bin"
    p.write_bytes(b"\x00" * 11247)
    with pytest.raises(SendError, match="11247"):
        validate_bin(p)
    p.write_bytes(b"\x00" * 11249)
    with pytest.raises(SendError, match="11249"):
        validate_bin(p)


def test_validate_bin_png(tmp_path: Path) -> None:
    p = tmp_path / "x.png"
    p.write_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00" * 11240)
    with pytest.raises(SendError, match="ne \\.png"):
        validate_bin(p)
    p2 = tmp_path / "x.bin"
    p2.write_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00" * (11248 - 8))
    with pytest.raises(SendError, match="PNG"):
        validate_bin(p2)


def test_send_propagates_cli_rc(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    rec = {"id": "v1", "hex": "a.hex", "verified": True, "rom_bytes": 1}
    root = _write_manifest(tmp_path, "v1", rec)
    (root / "tools" / "nfc_gateway").mkdir(parents=True)
    (root / "tools" / "nfc_gateway" / "cli.py").write_text("# stub\n", encoding="utf-8")
    img = tmp_path / "ok.bin"
    img.write_bytes(b"\x00" * 11248)
    monkeypatch.setattr(send_mod, "repo_root", lambda: root)
    monkeypatch.setattr(send_mod, "relays_script", lambda _r: None)

    class FakePopen:
        def __init__(self, *_a, **_k):
            self.stdout = iter(['{"event": "ERROR", "phase": "commit"}\n'])

        def wait(self, timeout=None):
            return 7

        def kill(self):
            pass

    monkeypatch.setattr(send_mod.subprocess, "Popen", FakePopen)
    rc = send_main([str(img)])
    assert rc == 7


def test_send_cleanup_on_success_and_error(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    rec = {"id": "v1", "hex": "a.hex", "verified": True, "rom_bytes": 1}
    root = _write_manifest(tmp_path, "v1", rec)
    (root / "tools" / "nfc_gateway").mkdir(parents=True)
    (root / "tools" / "nfc_gateway" / "cli.py").write_text("# stub\n", encoding="utf-8")
    img = tmp_path / "ok.bin"
    img.write_bytes(b"\x00" * 11248)
    monkeypatch.setattr(send_mod, "repo_root", lambda: root)
    calls: list[tuple] = []
    fake = tmp_path / "relays.sh"
    fake.write_text("#!/bin/sh\n", encoding="utf-8")
    monkeypatch.setattr(send_mod, "relays_script", lambda _r: fake)
    monkeypatch.setattr(send_mod, "wait_twn4", lambda: True)

    def rec_relays(_path, *a):
        calls.append(a)

    monkeypatch.setattr(send_mod, "run_relays", rec_relays)

    class FakePopen:
        def __init__(self, *_a, **_k):
            self.stdout = iter(['{"event": "DONE", "crc": "AABBCCDD", "chunks": 235, "retries": 0}\n'])

        def wait(self, timeout=None):
            return 0

        def kill(self):
            pass

    monkeypatch.setattr(send_mod.subprocess, "Popen", FakePopen)
    assert send_main([str(img)]) == 0
    assert ("tag-on",) in calls
    assert ("idle",) in calls
    assert ("twn4-off",) in calls

    calls.clear()

    def boom(_path, *a):
        calls.append(a)
        if a == ("tag-on",):
            raise RuntimeError("fail on")

    monkeypatch.setattr(send_mod, "run_relays", boom)
    rc = send_main([str(img)])
    assert rc != 0
    assert ("idle",) in calls or ("twn4-off",) in calls
