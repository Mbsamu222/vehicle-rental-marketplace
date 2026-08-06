"""Generates the RentWheels app icon and splash logo for the three Flutter apps.

Recreates the mark used in the web header (apps/public-site/src/layout/
PublicHeader.tsx): a `rounded-xl` tile filled with a bottom-left to top-right
gradient from `secondary` (#2563EB) to `accent` (#14B8A6), a white car glyph,
and a small accent-400 (#2DD4BF) status dot at the bottom-right.

Run:  python tools/generate_brand_assets.py   (run from mobile/)

Regenerate whenever the brand colours in packages/config/tailwind-preset.cjs
change. Output is written straight into each app's android/ios resource dirs
plus an assets/ copy used by the splash config.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

# Brand tokens — keep in sync with packages/config/tailwind-preset.cjs.
SECONDARY = (0x25, 0x63, 0xEB)
ACCENT = (0x14, 0xB8, 0xA6)
ACCENT_400 = (0x2D, 0xD4, 0xBF)
PRIMARY_900 = (0x11, 0x18, 0x27)
WHITE = (0xFF, 0xFF, 0xFF)

# Android launcher densities (mipmap-*). Values are the standard ic_launcher sizes.
ANDROID_DENSITIES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}

APPS = ["customer-mobile", "partner-mobile", "admin-mobile"]

# Supersample factor — draw large, downsample with LANCZOS for clean edges.
SS = 8


def _lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))  # type: ignore[return-value]


def _diagonal_gradient(size: int, start: tuple[int, int, int], end: tuple[int, int, int]) -> Image.Image:
    """Bottom-left -> top-right gradient, matching Tailwind's `bg-gradient-to-tr`."""
    img = Image.new("RGB", (size, size))
    px = img.load()
    assert px is not None
    for y in range(size):
        for x in range(size):
            # Project onto the bottom-left -> top-right diagonal, normalised 0..1.
            t = (x + (size - 1 - y)) / (2 * (size - 1))
            px[x, y] = _lerp(start, end, t)
    return img


def _rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def _draw_car(draw: ImageDraw.ImageDraw, cx: float, cy: float, w: float, color) -> None:
    """A simple side-profile car silhouette.

    Drawn from primitives rather than tracing lucide's `car` path so the shape
    stays legible when rasterised down to a 48px mdpi launcher icon, where fine
    stroke detail turns to mush.
    """
    body_w = w
    body_h = w * 0.42
    left = cx - body_w / 2
    top = cy - body_h / 2

    # Lower body
    draw.rounded_rectangle(
        (left, top + body_h * 0.34, left + body_w, top + body_h),
        radius=body_h * 0.30,
        fill=color,
    )
    # Cabin / roof
    cabin_w = body_w * 0.60
    draw.rounded_rectangle(
        (cx - cabin_w / 2, top - body_h * 0.30, cx + cabin_w / 2, top + body_h * 0.55),
        radius=body_h * 0.34,
        fill=color,
    )
    # Wheels punched out below the body so they read at small sizes.
    wheel_r = body_h * 0.30
    wheel_y = top + body_h
    for wx in (left + body_w * 0.26, left + body_w * 0.74):
        draw.ellipse((wx - wheel_r, wheel_y - wheel_r, wx + wheel_r, wheel_y + wheel_r), fill=color)


def build_icon(size: int, *, rounded: bool, with_dot: bool = True) -> Image.Image:
    """Renders the mark at `size` px.

    `rounded` produces the standalone launcher tile; when False the gradient
    fills the full square, which is what Android adaptive foregrounds and the
    splash background need.
    """
    s = size * SS
    gradient = _diagonal_gradient(s, SECONDARY, ACCENT).convert("RGBA")

    if rounded:
        # `rounded-xl` is 1rem on a 2.5rem tile = 40% of the side.
        gradient.putalpha(_rounded_mask(s, radius=round(s * 0.22)))

    draw = ImageDraw.Draw(gradient)
    _draw_car(draw, cx=s / 2, cy=s / 2, w=s * 0.52, color=WHITE)

    if with_dot:
        # accent-400 status dot, bottom-right, as on the web mark.
        r = s * 0.085
        cx = s * 0.80
        cy = s * 0.80
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ACCENT_400 + (255,))

    return gradient.resize((size, size), Image.LANCZOS)


def build_splash_logo(size: int) -> Image.Image:
    """Transparent-background logo for the splash screen.

    The splash paints a solid brand background itself, so the tile keeps its
    rounded gradient shape and sits centred on it.
    """
    return build_icon(size, rounded=True)


def main() -> None:
    written = 0

    for app in APPS:
        app_dir = MOBILE_ROOT / app
        if not app_dir.exists():
            print(f"  skip {app} (not found)")
            continue

        # ── Android launcher icons ────────────────────────────────────────
        for density, px in ANDROID_DENSITIES.items():
            out = app_dir / "android/app/src/main/res" / f"mipmap-{density}" / "ic_launcher.png"
            out.parent.mkdir(parents=True, exist_ok=True)
            build_icon(px, rounded=True).save(out)
            written += 1

        # Adaptive-icon foreground: full-bleed, no dot (it collides with the
        # system mask), inset so the glyph survives circular cropping.
        for density, px in ANDROID_DENSITIES.items():
            fg_px = round(px * 108 / 48)
            canvas = Image.new("RGBA", (fg_px, fg_px), (0, 0, 0, 0))
            glyph = build_icon(round(fg_px * 0.62), rounded=False, with_dot=False)
            offset = (fg_px - glyph.width) // 2
            canvas.paste(glyph, (offset, offset), glyph)
            out = app_dir / "android/app/src/main/res" / f"mipmap-{density}" / "ic_launcher_foreground.png"
            canvas.save(out)
            written += 1

        # ── iOS app icon ──────────────────────────────────────────────────
        ios_dir = app_dir / "ios/Runner/Assets.xcassets/AppIcon.appiconset"
        if ios_dir.exists():
            for existing in ios_dir.glob("*.png"):
                # iOS icons must be opaque — no alpha channel allowed.
                size_px = Image.open(existing).size[0]
                build_icon(size_px, rounded=False).convert("RGB").save(existing)
                written += 1

        # ── Splash logo ───────────────────────────────────────────────────
        assets = app_dir / "assets/brand"
        assets.mkdir(parents=True, exist_ok=True)
        build_splash_logo(512).save(assets / "splash_logo.png")
        build_icon(1024, rounded=True).save(assets / "app_icon.png")
        written += 2

        print(f"  {app}: assets written")

    print(f"Done — {written} files.")


if __name__ == "__main__":
    main()
