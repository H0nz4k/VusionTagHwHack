#!/usr/bin/env bash
# Install or remove short PATH wrappers. Safe to re-run. Does not overwrite foreign files.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PREFIX="${PREFIX:-$HOME/bin}"
UNINSTALL=0
if [[ "${1:-}" == "--uninstall" ]]; then
    UNINSTALL=1
elif [[ "${1:-}" == "--prefix" ]]; then
    PREFIX="${2:-$PREFIX}"
elif [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    cat <<EOF
Použití: $0 [--prefix DIR] | --uninstall
Výchozí PREFIX=$PREFIX
Vytvoří symlinky:
  \$PREFIX/tag-flash-latest -> $HERE/tag-flash-latest
  \$PREFIX/tag-send-image   -> $HERE/tag-send-image
EOF
    exit 0
fi

NAMES=(tag-flash-latest tag-send-image)
echo "PREFIX=$PREFIX"
mkdir -p "$PREFIX"

install_one() {
    local name="$1"
    local src="$HERE/$name"
    local dst="$PREFIX/$name"
    [[ -f "$src" ]] || { echo "chybí $src"; exit 1; }
    if [[ -e "$dst" || -L "$dst" ]]; then
        if [[ -L "$dst" ]]; then
            local cur
            cur="$(readlink -f "$dst" || true)"
            local want
            want="$(readlink -f "$src")"
            if [[ "$cur" == "$want" ]]; then
                echo "beze změny $dst"
                return
            fi
            echo "chyba: $dst už ukazuje jinam ($cur). Nepřepisuji."
            exit 3
        fi
        echo "chyba: $dst existuje a není náš symlink. Nepřepisuji."
        exit 3
    fi
    ln -s "$src" "$dst"
    echo "vytvořeno $dst -> $src"
}

uninstall_one() {
    local name="$1"
    local src="$HERE/$name"
    local dst="$PREFIX/$name"
    if [[ ! -e "$dst" && ! -L "$dst" ]]; then
        echo "není $dst"
        return
    fi
    if [[ -L "$dst" ]]; then
        local cur want
        cur="$(readlink -f "$dst" || true)"
        want="$(readlink -f "$src")"
        if [[ "$cur" == "$want" ]]; then
            rm -f "$dst"
            echo "odstraněno $dst"
            return
        fi
    fi
    echo "chyba: $dst není náš symlink. Nesahám na něj."
    exit 3
}

for n in "${NAMES[@]}"; do
    if [[ "$UNINSTALL" -eq 1 ]]; then
        uninstall_one "$n"
    else
        install_one "$n"
    fi
done
echo "PATH: přidej $PREFIX pokud tam ještě není."
