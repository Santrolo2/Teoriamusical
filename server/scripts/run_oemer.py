"""
Oemer wrapper: runs the oemer OMR pipeline and outputs the MusicXML file path to stdout.
Usage: python run_oemer.py <image_path> [output_dir]
"""

import glob
import os
import subprocess
import sys
import tempfile
from typing import List, Tuple

try:
    import cv2  # type: ignore
    import numpy as np  # type: ignore
except Exception:
    cv2 = None
    np = None


def find_xml_files(base_dir: str) -> List[str]:
    patterns = [
        os.path.join(base_dir, "*.musicxml"),
        os.path.join(base_dir, "*.xml"),
        os.path.join(base_dir, "**", "*.musicxml"),
        os.path.join(base_dir, "**", "*.xml"),
    ]
    xml_files: List[str] = []
    for pattern in patterns:
        xml_files.extend(glob.glob(pattern, recursive=True))

    # Deduplicate preserving order.
    seen = set()
    unique = []
    for p in xml_files:
        if p in seen:
            continue
        seen.add(p)
        unique.append(p)
    return unique


def resolve_oemer_executable() -> str:
    python_bin = sys.executable
    scripts_dir = os.path.join(os.path.dirname(python_bin), "Scripts")
    oemer_exe = os.path.join(scripts_dir, "oemer.exe")
    if os.path.isfile(oemer_exe):
        return oemer_exe
    return "oemer"


def run_oemer(
    oemer_exe: str,
    image_path: str,
    output_dir: str,
    log_file: str,
    label: str,
    extra_args: List[str],
) -> Tuple[int, str]:
    cmd = [oemer_exe, image_path, "-o", output_dir, *extra_args]
    with open(log_file, "a", encoding="utf-8", errors="replace") as f:
        f.write(f"\n=== ATTEMPT: {label} ===\n")
        f.write(f"CMD: {cmd}\n")

    with open(log_file, "a", encoding="utf-8", errors="replace") as f:
        result = subprocess.run(cmd, stdout=f, stderr=subprocess.STDOUT)

    xml_files = find_xml_files(output_dir)
    # Some Oemer runs emit valid MusicXML but return non-zero due provider warnings.
    # If XML exists, treat the attempt as successful.
    if xml_files:
        return 0, xml_files[0]

    return result.returncode, ""


def cv_read(path: str):
    if cv2 is None or np is None:
        return None
    data = np.fromfile(path, dtype=np.uint8)
    if data.size == 0:
        return None
    return cv2.imdecode(data, cv2.IMREAD_COLOR)


def cv_write(path: str, img) -> bool:
    if cv2 is None or np is None:
        return False
    ok, buf = cv2.imencode(".png", img)
    if not ok:
        return False
    buf.tofile(path)
    return True


def normalize_bw(img_gray):
    if np is None:
        return img_gray
    # Ensure dark notes over light background.
    if float(np.mean(img_gray)) < 127.0:
        return 255 - img_gray
    return img_gray


def build_preprocessed_variants(original_path: str, work_dir: str) -> List[Tuple[str, str, List[str]]]:
    variants: List[Tuple[str, str, List[str]]] = [("original_fast_no_deskew", original_path, ["-d"])]
    if cv2 is None or np is None:
        variants.append(("original_full", original_path, []))
        return variants

    img = cv_read(original_path)
    if img is None:
        variants.append(("original_full", original_path, []))
        return variants

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape[:2]

    # Fast variant: downscale large screenshots and skip deskew.
    target_w = 2400
    if w > target_w:
        scale = target_w / float(w)
        fast = cv2.resize(gray, (target_w, max(1, int(h * scale))), interpolation=cv2.INTER_AREA)
    else:
        fast = gray
    fast = normalize_bw(fast)
    p_fast = os.path.join(work_dir, "variant_fast.png")
    if cv_write(p_fast, fast):
        variants.insert(0, ("fast_no_deskew", p_fast, ["-d"]))

    # Variant 1: normalized grayscale.
    v1 = normalize_bw(gray)
    p1 = os.path.join(work_dir, "variant_gray.png")
    if cv_write(p1, v1):
        variants.append(("gray_no_deskew", p1, ["-d"]))

    # Variant 2: Otsu threshold.
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    otsu = normalize_bw(otsu)
    p2 = os.path.join(work_dir, "variant_otsu.png")
    if cv_write(p2, otsu):
        variants.append(("otsu_no_deskew", p2, ["-d"]))

    # Variant 3: adaptive threshold for old scans/photos.
    adap = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        35,
        11,
    )
    adap = normalize_bw(adap)
    p3 = os.path.join(work_dir, "variant_adaptive.png")
    if cv_write(p3, adap):
        variants.append(("adaptive_full", p3, []))

    # Last fallback: full original with deskew enabled.
    variants.append(("original_full", original_path, []))

    return variants


def tail_log(log_file: str, max_chars: int = 2000) -> str:
    if not os.path.isfile(log_file):
        return ""
    with open(log_file, "r", encoding="utf-8", errors="replace") as f:
        data = f.read()
    return data[-max_chars:]


def main() -> None:
    if len(sys.argv) < 2:
        print("ERROR: No se proporciono ruta de imagen.", file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(image_path)

    if not os.path.isfile(image_path):
        print(f"ERROR: Archivo no encontrado: {image_path}", file=sys.stderr)
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    oemer_exe = resolve_oemer_executable()
    work_dir = tempfile.mkdtemp(prefix="oemer-prep-")
    log_file = os.path.join(tempfile.gettempdir(), "debug_oemer.log")

    with open(log_file, "w", encoding="utf-8", errors="replace") as f:
        f.write(f"DEBUG: oemer_exe={oemer_exe}\n")
        f.write(f"DEBUG: image_path={image_path}\n")
        f.write(f"DEBUG: output_dir={output_dir}\n")

    variants = build_preprocessed_variants(image_path, work_dir)

    for label, candidate, extra_args in variants:
        code, xml_path = run_oemer(oemer_exe, candidate, output_dir, log_file, label, extra_args)
        if code == 0 and xml_path:
            print(xml_path)
            sys.exit(0)

    log_tail = tail_log(log_file)
    print(f"ERROR: Oemer fallo en todos los intentos. Log: {log_tail}", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
