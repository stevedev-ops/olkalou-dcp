import sys
try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

logo_path = "src/assets/logo.png"

img = Image.open(logo_path).convert("RGBA")

# Resize for different formats
img.resize((192, 192), Image.Resampling.LANCZOS).save("public/192x192.png", "PNG")
img.resize((512, 512), Image.Resampling.LANCZOS).save("public/512x512.png", "PNG")
img.resize((64, 64), Image.Resampling.LANCZOS).save("public/favicon.png", "PNG")

print("Generated 192x192.png, 512x512.png, and favicon.png successfully.")
