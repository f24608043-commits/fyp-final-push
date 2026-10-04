"""One-off codemod: rewrite off-palette Tailwind utilities to LEGO design tokens.

Allowed palette (tailwind.config.ts):
  primary #58CC02, primary-dark #3C9A00, secondary #FF9600, tertiary #8B5CF6,
  success #22C55E, error #FF6B6B, background #FFF8F0, surface #FFFFFF,
  surface-border #F5EFE6, text-primary #2D2A26, text-muted #8B8578, locked #D1D5DB

Dry run by default; pass --write to apply.
"""
import re
import sys
from pathlib import Path

PREFIXES = (
    r"(?:bg|text|border|ring|from|via|to|fill|stroke|divide|outline|decoration|caret|accent|shadow)"
)
HUE = r"(?:red|rose|pink|fuchsia|purple|violet|indigo|blue|sky|cyan|teal|emerald|green|lime|yellow|amber|orange|slate|gray|zinc|neutral|stone)"
COLOR_RE = re.compile(
    rf"(?P<pre>[a-z0-9-]*\b{PREFIXES})-(?P<hue>{HUE})-(?P<shade>50|100|200|300|400|500|600|700|800|900|950)(?![0-9a-z-])"
)
WHITE_RE = re.compile(r"(?P<pre>[a-z0-9-]*\b(?:bg|text|border|from|via|to|ring|divide|fill|stroke))-white(?![0-9a-z-])")
BLACK_RE = re.compile(r"(?P<pre>[a-z0-9-]*\b(?:text|bg|border|from|via|to|ring|divide|fill|stroke))-black(?![0-9a-z-])")

# shadows that do not exist in tailwind.config.ts -> real clay shadows
SHADOW_MAP = {
    "shadow-beautiful-sm": "shadow-clay-surface",
    "shadow-beautiful-md": "shadow-clay-surface",
    "shadow-beautiful-lg": "shadow-clay-primary",
    "shadow-beautiful-xl": "shadow-clay-primary",
    "shadow-clay-lg": "shadow-clay-surface",
    "shadow-clay-xl": "shadow-clay-surface",
    "shadow-clay-inset": "shadow-clay-surface-pressed",
    "shadow-3xl": "shadow-clay-surface",
    "shadow-2xl": "shadow-clay-surface",
    "shadow-xl": "shadow-clay-surface",
    "shadow-lg": "shadow-clay-surface",
    "shadow-md": "shadow-clay-surface",
    "shadow-sm": "shadow-clay-surface",
}
SHADOW_RE = re.compile(
    r"(?P<pre>[a-z0-9-]*\b)(" + "|".join(sorted(SHADOW_MAP, key=len, reverse=True)) + r")(?![0-9a-z-])"
)

# card-scale surfaces get the 24px clay radius
RADIUS_RE = re.compile(r"(?P<pre>[a-z0-9-]*\b)rounded-2xl(?![0-9a-z-])")

LIGHT = {"50", "100", "200"}
MID = {"300", "400"}
BLUEISH = {"blue", "sky", "cyan", "teal", "indigo", "violet", "purple", "fuchsia", "pink"}
WARMISH = {"yellow", "amber", "orange"}
GREYISH = {"slate", "gray", "zinc", "neutral", "stone"}


def token_for(hue: str, shade: str, lightish: bool) -> str:
    if hue in BLUEISH:
        return "tertiary"
    if hue in WARMISH:
        return "secondary"
    if hue in {"red", "rose"}:
        return "error"
    if hue in {"emerald", "green", "lime"}:
        return "success" if (shade in MID or shade in {"600", "700", "800", "900"}) else "primary"
    return "text-primary"


def color_replacement(match: re.Match) -> str:
    pre = match.group("pre")
    hue = match.group("hue")
    shade = match.group("shade")
    lightish = shade in LIGHT

    if hue in GREYISH:
        if pre == "text":
            return "text-text-primary" if shade in LIGHT or shade in MID else "text-text-muted"
        if pre in {"bg", "from", "via", "to"}:
            token = "surface" if shade in LIGHT else "surface-border"
            return token if pre == "bg" else f"{pre}-{token}"
        if pre == "border":
            return "border-surface-border"
        if pre == "ring":
            return "ring-primary"
        if pre == "divide":
            return "divide-surface-border"
        if pre == "fill":
            return f"fill-{'surface' if shade in LIGHT else 'surface-border'}"
        if pre == "stroke":
            return f"stroke-{'surface' if shade in LIGHT else 'surface-border'}"
        return f"{pre}-surface"

    token = token_for(hue, shade, lightish)

    if pre == "text":
        return f"text-{token}/70" if lightish else f"text-{token}"
    if pre == "bg":
        return f"bg-{token}/10" if lightish else f"bg-{token}"
    if pre in {"from", "via", "to"}:
        return f"{pre}-{token}/10" if lightish else f"{pre}-{token}"
    if pre == "border":
        return f"border-{token}/30" if lightish else f"border-{token}"
    if pre == "ring":
        return f"ring-{token}/30" if lightish else f"ring-{token}"
    if pre == "divide":
        return f"divide-{token}/30" if lightish else f"divide-{token}"
    if pre in {"fill", "stroke"}:
        return f"{pre}-{token}/30" if lightish else f"{pre}-{token}"
    return f"{pre}-{token}"


def white_replacement(match: re.Match) -> str:
    pre = match.group("pre")
    return "bg-surface" if pre == "bg" else f"{pre}-surface"


def black_replacement(match: re.Match) -> str:
    return "bg-text-primary" if match.group("pre") == "bg" else "text-text-primary"


def shadow_replacement(match: re.Match) -> str:
    return f"{match.group('pre')}{SHADOW_MAP[match.group(2)]}"


def radius_replacement(match: re.Match) -> str:
    return f"{match.group('pre')}rounded-[24px]"


def convert(text: str) -> str:
    text = COLOR_RE.sub(color_replacement, text)
    text = WHITE_RE.sub(white_replacement, text)
    text = BLACK_RE.sub(black_replacement, text)
    text = SHADOW_RE.sub(shadow_replacement, text)
    text = RADIUS_RE.sub(radius_replacement, text)
    return text


def main(write: bool) -> int:
    roots = [Path("app"), Path("components")]
    files = sorted({p for r in roots for p in list(r.rglob("*.tsx")) + list(r.rglob("*.ts"))})

    total = 0
    touched = []
    for path in files:
        original = path.read_text(encoding="utf-8")
        updated = convert(original)
        if updated == original:
            continue
        total += sum(1 for a, b in zip(original.split(), updated.split()) if a != b)
        touched.append((str(path), len(COLOR_RE.findall(original))))
        if write:
            path.write_text(updated, encoding="utf-8")

    for name, count in touched:
        print(f"{count:4d}  {name}")
    print(f"\n{len(touched)} files, {total} token replacements ({'written' if write else 'dry-run'})")
    return 0


if __name__ == "__main__":
    sys.exit(main(write="--write" in sys.argv))