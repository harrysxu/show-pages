"""Render editable SVG sources and install opaque iOS icons.

Run from any directory:
uv run --with resvg-py --with pillow docs/app-icon/render-icon.py [--install]
"""

from pathlib import Path
from io import BytesIO
import argparse
import json
import shutil

from PIL import Image, ImageDraw, ImageFont
import resvg_py

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
ASSETS = ROOT / "ZipHarbor/ZipHarbor/Assets.xcassets/AppIcon.appiconset"

# The geometry is identical in both appearances; only the palette changes.
DARK_COLORS = {
    "#8190FF": "#343C69", "#5669EE": "#252C53", "#4A43CA": "#131A35",
    "#C8D2FF": "#939EE9", "#D4DEFF": "#A7B8F3", "#AFBEF7": "#7D91DE",
    "#FFFFFF": "#F0F3FF", "#F7F9FF": "#DCE4FD", "#E4EAFE": "#B4C5F1",
    "#7A89F8": "#7486F0", "#5669ED": "#6376E1", "#4C57D6": "#414FC0", "#25217E": "#040818",
    "#364CAE": "#1C2F79", "#DCE3FC": "#B3C2F2", "#C6D0F8": "#99ACE7",
    "#5E70ED": "#5266DB", "#A8B4FF": "#A5B5FF",
}


def render(source, destination):
    png = resvg_py.svg_to_bytes(svg_string=source)
    image = Image.open(BytesIO(png))
    assert image.size == (1024, 1024)
    assert image.getchannel("A").getextrema() == (255, 255)
    image.convert("RGB").save(destination, optimize=True)


def font(size, bold=False):
    path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf"
    return ImageFont.truetype(path, size)


def masked_icon(canvas, source, x, y, size):
    icon = source.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size))
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=size * .223, fill=255)
    canvas.paste(icon, (x, y), mask)


def preview(light, dark):
    canvas = Image.new("RGB", (1200, 840), "#F3F5FA")
    draw = ImageDraw.Draw(canvas)
    draw.text((64, 45), "ZipHarbor", font=font(40, True), fill="#171C2E")
    draw.text((64, 103), "Archive. Zip. Unzip.", font=font(19), fill="#626B82")
    draw.rounded_rectangle((616, 170, 1150, 786), radius=30, fill="#141B2F")
    masked_icon(canvas, light, 151, 218, 304)
    masked_icon(canvas, dark, 733, 218, 304)
    draw.text((151, 555), "DEFAULT", font=font(16, True), fill="#626B82")
    draw.text((733, 555), "DARK", font=font(16, True), fill="#ADB9DC")
    for image, start, color in [(light, 152, "#626B82"), (dark, 734, "#ADB9DC")]:
        for size, offset in [(60, 0), (40, 128), (29, 248)]:
            masked_icon(canvas, image, start + offset, 621 + 60 - size, size)
            draw.text((start + offset, 705), str(size) + " px", font=font(15), fill=color)
    canvas.save(HERE / "zipharbor-icon-preview.png", optimize=True)


def install():
    # Preserve the previous placeholder outside the asset catalog.
    old = ASSETS / "AppIcon.png"
    backup = HERE / "previous-app-icon.png"
    if old.exists():
        if not backup.exists():
            shutil.copy2(old, backup)
        old.unlink()
    shutil.copy2(HERE / "zipharbor-icon-1024.png", ASSETS / "AppIcon-ZipHarbor.png")
    shutil.copy2(HERE / "zipharbor-icon-dark-1024.png", ASSETS / "AppIcon-ZipHarbor-Dark.png")
    images = [
        {"filename": "AppIcon-ZipHarbor.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"},
        {"appearances": [{"appearance": "luminosity", "value": "dark"}], "filename": "AppIcon-ZipHarbor-Dark.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"},
    ]
    (ASSETS / "Contents.json").write_text(json.dumps({"images": images, "info": {"author": "xcode", "version": 1}}, indent=2) + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--install", action="store_true")
    args = parser.parse_args()
    light_svg = (HERE / "zipharbor-icon.svg").read_text()
    import re
    dark_svg = re.sub(r"#[0-9A-F]{6}", lambda match: DARK_COLORS.get(match.group(), match.group()), light_svg)
    (HERE / "zipharbor-icon-dark.svg").write_text(dark_svg)
    render(light_svg, HERE / "zipharbor-icon-1024.png")
    render(dark_svg, HERE / "zipharbor-icon-dark-1024.png")
    preview(Image.open(HERE / "zipharbor-icon-1024.png"), Image.open(HERE / "zipharbor-icon-dark-1024.png"))
    if args.install:
        install()
    print("Rendered 1024×1024 RGB icons and size preview" + ("; AppIcon installed" if args.install else ""))
