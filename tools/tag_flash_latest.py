"""Flash the pinned verified OpenVusionHack HEX onto the DEV CC2510."""

from __future__ import annotations

import argparse
import datetime as dt
import os
import subprocess
import sys
from pathlib import Path

from ov_release import Release, ReleaseError, repo_root, select_latest

DEFAULT_RELAYS = Path("/home/hw/bin/ov26-relays.sh")
CC_USB = "0451:16a2"


class FlashError(Exception):
    def __init__(self, message: str, code: int = 1) -> None:
        super().__init__(message)
        self.code = code


def relays_script(root: Path) -> Path:
    env = os.environ.get("OV26_RELAYS")
    if env:
        p = Path(env)
        if p.is_file():
            return p
    if DEFAULT_RELAYS.is_file():
        return DEFAULT_RELAYS
    local = root / "scripts" / "pi" / "ov26-relays.sh"
    if local.is_file():
        return local
    raise FlashError("Nenalezen ov26-relays.sh. Nastav OV26_RELAYS.", 4)


def run_relays(relays: Path, *args: str) -> None:
    subprocess.check_call([str(relays), *args])


def lsusb_text() -> str:
    r = subprocess.run(["lsusb"], capture_output=True, text=True)
    return r.stdout or ""


def wait_debugger(seconds: int = 8) -> bool:
    for _ in range(seconds):
        if CC_USB in lsusb_text():
            return True
        subprocess.run(["sleep", "1"], check=False)
    return CC_USB in lsusb_text()


def cc_tool(args: list[str], timeout: int = 90) -> subprocess.CompletedProcess[str]:
    cmd = ["sudo", "cc-tool", *args]
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def parse_ident(text: str) -> None:
    low = text.lower()
    if "locked" in low and "unlocked" not in low:
        raise FlashError("Cíl je LOCKED. Golden/stock se touto utilitou neflashuje.", 3)
    if "CC2510" not in text and "cc2510" not in low:
        raise FlashError("Cíl není CC2510. Flash odmítnut.", 3)


def log_path(root: Path) -> Path:
    d = root / "captures" / "logs"
    d.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    return d / f"tag-flash-{stamp}.log"


def write_log(path: Path, *lines: str) -> None:
    with path.open("a", encoding="utf-8") as f:
        for line in lines:
            f.write(line.rstrip() + "\n")


def preflight(rel: Release, verbose: bool) -> None:
    print(f"release:     {rel.id}")
    print(f"hex:         {rel.hex_path}")
    print(f"size:        {rel.hex_path.stat().st_size} B (ROM {rel.rom_bytes} B)")
    print(f"sha256:      {rel.sha256}")
    print(f"verified:    ano ({rel.note})")
    if verbose and rel.banner:
        print(f"banner:      {rel.banner}")
    if rel.rom_bytes > 32768:
        raise FlashError("ROM přesahuje 32768 B.", 2)


def flash_main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog="tag-flash-latest",
        description="Nahraje poslední fyzicky ověřený OpenVusionHack firmware na DEV tag.",
    )
    p.add_argument("--confirm-dev-tag", action="store_true", help="Potvrď, že připojený kus je DEV tag.")
    p.add_argument("--yes", action="store_true", help="Bez interaktivního potvrzení. Jen s --confirm-dev-tag.")
    p.add_argument("--dry-run", action="store_true", help="Preflight bez erase/write.")
    p.add_argument("--verbose", "-v", action="store_true")
    p.add_argument("--no-backup", action="store_true", help="Nečíst stávající flash před erasem.")
    args = p.parse_args(argv)

    root = repo_root()
    logf = log_path(root)
    relays: Path | None = None
    attached = False

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
        rel = select_latest(root)
        preflight(rel, args.verbose)
        write_log(logf, f"release={rel.id}", f"sha256={rel.sha256}", f"hex={rel.hex_path}")
        print(f"log:         {logf}")

        if args.dry_run:
            print("dry-run:     OK (erase/write neproběhly)")
            write_log(logf, "dry-run=OK")
            return 0

        if not args.confirm_dev_tag:
            raise FlashError(
                "DEV tag nelze softwarově spolehlivě odlišit od golden/stock. "
                "Přidej --confirm-dev-tag. Golden/stock touto utilitou neflashuj.",
                2,
            )
        if not args.yes:
            raise FlashError("Pro zápis přidej --yes společně s --confirm-dev-tag.", 2)

        relays = relays_script(root)
        run_relays(relays, "idle")
        run_relays(relays, "attach")
        attached = True
        if not wait_debugger():
            raise FlashError("CC Debugger USB 0451:16a2 se neobjevil.", 4)
        ident = cc_tool(["-t"])
        ident_txt = (ident.stdout or "") + (ident.stderr or "")
        write_log(logf, "IDENT", ident_txt)
        if args.verbose:
            print(ident_txt)
        if ident.returncode != 0:
            raise FlashError("cc-tool -t selhal.", 4)
        parse_ident(ident_txt)
        print("target:      CC2510 unlocked")

        if not args.no_backup:
            bak = logf.with_name(logf.stem + "-pre.hex")
            rd = cc_tool(["-r", str(bak)])
            write_log(logf, "READ", rd.stdout or "", rd.stderr or "")
            if rd.returncode == 0 and bak.is_file():
                from ov_release import file_sha256

                print(f"backup:      {bak}")
                print(f"backup_sha:  {file_sha256(bak)}")
            else:
                print("backup:      čtení flash selhalo (pokračuji k erase)")

        wr = cc_tool(["-v", "read", "-e", "-w", str(rel.hex_path)], timeout=180)
        out = (wr.stdout or "") + (wr.stderr or "")
        write_log(logf, "FLASH", out)
        if args.verbose:
            print(out)
        if wr.returncode != 0:
            raise FlashError("Erase/write/verify selhaly.", 5)
        if "Verifying flash" not in out or "Completed" not in out:
            raise FlashError("Flash verify neproběhl nebo neskončil Completed.", 5)
        print("verify:      PASS")
        write_log(logf, "verify=PASS")
        return 0
    except ReleaseError as e:
        print(f"chyba: {e}", file=sys.stderr)
        write_log(logf, f"ERROR {e}")
        return 2
    except FlashError as e:
        print(f"chyba: {e}", file=sys.stderr)
        write_log(logf, f"ERROR {e}")
        return e.code
    except subprocess.TimeoutExpired:
        print("chyba: cc-tool vypršel čas.", file=sys.stderr)
        return 5
    except KeyboardInterrupt:
        print("chyba: přerušeno.", file=sys.stderr)
        return 130
    finally:
        cleanup()
        if attached:
            print("bench:       idle")


if __name__ == "__main__":
    raise SystemExit(flash_main())
