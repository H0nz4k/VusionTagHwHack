"""Send a 11248 B TagStudio BIN via the existing nfc_gateway CLI."""

from __future__ import annotations

import argparse
import binascii
import json
import os
import subprocess
import sys
import time
from pathlib import Path

from ov_release import repo_root

IMAGE_LEN = 11248
FORBIDDEN_SUFFIX = (".png", ".c", ".h", ".hex", ".ihx", ".txt", ".json")
DEFAULT_RELAYS = Path("/home/hw/bin/ov26-relays.sh")
CLI_REL = Path("tools") / "nfc_gateway" / "cli.py"
TWN4_USB = "09d8:0420"
TWN4_PORT = "/dev/ttyACM0"


class SendError(Exception):
    def __init__(self, message: str, code: int = 2) -> None:
        super().__init__(message)
        self.code = code


def relays_script(root: Path) -> Path | None:
    env = os.environ.get("OV26_RELAYS")
    if env and Path(env).is_file():
        return Path(env)
    if DEFAULT_RELAYS.is_file():
        return DEFAULT_RELAYS
    local = root / "scripts" / "pi" / "ov26-relays.sh"
    return local if local.is_file() else None


def run_relays(relays: Path, *args: str) -> None:
    subprocess.check_call([str(relays), *args])


def wait_twn4(port: str = TWN4_PORT, seconds: float = 12.0) -> bool:
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        p = Path(port)
        usb = subprocess.run(["lsusb"], capture_output=True, text=True)
        if p.exists() and os.access(p, os.R_OK | os.W_OK) and TWN4_USB in (usb.stdout or ""):
            time.sleep(0.4)
            return True
        time.sleep(0.4)
    return False


def validate_bin(path: Path) -> bytes:
    if not path.exists():
        raise SendError(f"Soubor neexistuje: {path}", 2)
    if not path.is_file():
        raise SendError(f"Není běžný soubor: {path}", 2)
    if path.suffix.lower() in FORBIDDEN_SUFFIX:
        raise SendError(
            f"Očekávám headerless TagStudio BIN 152×296 (přesně {IMAGE_LEN} B), ne {path.suffix}.",
            2,
        )
    data = path.read_bytes()
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        raise SendError("Soubor je PNG, ne TagStudio BIN.", 2)
    if len(data) != IMAGE_LEN:
        raise SendError(
            f"Špatná délka BIN: {len(data)} B. TagStudio 152×296 musí mít přesně {IMAGE_LEN} B.",
            2,
        )
    return data


def parse_events(stdout: str) -> dict:
    last: dict = {}
    for line in stdout.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(rec, dict) and rec.get("event"):
            last = rec
    return last


def send_main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog="tag-send-image",
        description="Pošle headerless TagStudio BIN (152×296, 11248 B) na DEV tag přes TWN4/NFC.",
    )
    p.add_argument("bin_path")
    p.add_argument("--verbose", "-v", action="store_true")
    p.add_argument("--timeout", type=float, default=480.0, help="Limit celé session (s).")
    p.add_argument("--wait", type=float, default=16.0)
    p.add_argument("--process-s", type=float, default=0.22)
    p.add_argument("--xfer", type=int, default=1)
    args = p.parse_args(argv)

    root = repo_root()
    cli = root / CLI_REL
    if not cli.is_file():
        print(f"chyba: chybí {cli}", file=sys.stderr)
        return 2
    relays = relays_script(root)

    def cleanup() -> None:
        if relays is None:
            return
        try:
            run_relays(relays, "twn4-off")
        except Exception:
            pass
        try:
            run_relays(relays, "idle")
        except Exception:
            pass

    try:
        path = Path(args.bin_path).expanduser().resolve()
        data = validate_bin(path)
        crc = binascii.crc32(data) & 0xFFFFFFFF
        print("formát:      headerless TagStudio BIN 152×296 (plane10+plane13)")
        print(f"soubor:      {path.name}")
        print(f"cesta:       {path}")
        print(f"délka:       {len(data)} B")
        print(f"crc32:       {crc:08X}")
        print("hex/firmware se tímto příkazem neposílá.")

        gpio_flag = "--twn4-gpio"
        if relays is not None:
            run_relays(relays, "tag-on")
            run_relays(relays, "twn4-on")
            if not wait_twn4():
                raise SendError("TWN4 /dev/ttyACM0 nebo USB 09d8:0420 není připravené.", 4)
            gpio_flag = "--no-twn4-gpio"
        cmd = [
            sys.executable,
            "-u",
            str(cli),
            "send",
            str(path),
            "--wait",
            str(args.wait),
            "--process-s",
            str(args.process_s),
            "--xfer",
            str(args.xfer),
            gpio_flag,
        ]
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        collected: list[str] = []
        assert proc.stdout is not None
        try:
            for line in proc.stdout:
                collected.append(line)
                sys.stdout.write(line)
                sys.stdout.flush()
            rc = proc.wait(timeout=args.timeout)
        except subprocess.TimeoutExpired:
            proc.kill()
            raise
        last = parse_events("".join(collected))
        print("---")
        print(f"stav:        {last.get('event') or 'neznámý'}")
        if last.get("crc"):
            print(f"crc:         {last.get('crc')}")
        if last.get("chunks") is not None:
            print(f"chunky:      {last.get('chunks')}")
        if last.get("retries") is not None:
            print(f"retry:       {last.get('retries')}")
        if rc == 0:
            print("výsledek:    DONE")
        else:
            print(f"výsledek:    FAIL rc={rc}")
        return rc
    except SendError as e:
        print(f"chyba: {e}", file=sys.stderr)
        return e.code
    except subprocess.TimeoutExpired:
        print("chyba: přenos vypršel.", file=sys.stderr)
        return 5
    except KeyboardInterrupt:
        print("chyba: přerušeno.", file=sys.stderr)
        return 130
    except Exception as e:
        print(f"chyba: {e}", file=sys.stderr)
        return 1
    finally:
        cleanup()


if __name__ == "__main__":
    raise SystemExit(send_main())
