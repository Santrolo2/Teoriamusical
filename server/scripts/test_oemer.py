import sys, os, tempfile, subprocess
from PIL import Image, ImageDraw

def create_synthetic_staff(path):
    img = Image.new('RGB', (800, 300), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    for y in range(100, 200, 20):
        d.line([(50, y), (750, y)], fill=(0, 0, 0), width=2)
    img.save(path)

t = tempfile.mkdtemp()
img_path = os.path.join(t, 'input.png')
out_dir = tempfile.mkdtemp()
create_synthetic_staff(img_path)

script = r'C:\Users\eltho\OneDrive\Desktop\Pagina de acordes\pagina-principal\server\scripts\run_oemer.py'
python_exe = r'C:\Users\eltho\AppData\Local\Python\pythoncore-3.14-64\python.exe'

print(f"Executing: {python_exe} {script} {img_path} {out_dir}")
r = subprocess.run([python_exe, script, img_path, out_dir], capture_output=True, text=True)

print("--- RETURN CODE ---")
print(r.returncode)
print("--- STDOUT ---")
print(r.stdout)
print("--- STDERR ---")
print(r.stderr)
