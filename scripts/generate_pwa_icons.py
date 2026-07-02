import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Installing Pillow...")
    os.system("pip install pillow")
    from PIL import Image, ImageDraw, ImageFont

def create_icon(size):
    # Create image with RGB mode
    img = Image.new("RGB", (size, size), "#0f172a")
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background (dark blue to blue)
    for y in range(size):
        r = int(10 + (20 - 10) * y / size)
        g = int(15 + (37 - 15) * y / size)
        b = int(30 + (60 - 30) * y / size)
        draw.line([(0, y), (size, y)], fill=(r, g, b))
        
    # Draw orange camera icon at center
    # Scale coordinates based on size
    center = size // 2
    cam_w = int(size * 0.45)
    cam_h = int(size * 0.3)
    
    # Camera body
    x0, y0 = center - cam_w // 2, center - cam_h // 2 - int(size * 0.05)
    x1, y1 = center + cam_w // 2, center + cam_h // 2 - int(size * 0.05)
    draw.rounded_rectangle([x0, y0, x1, y1], radius=int(size * 0.04), fill="#f97316")
    
    # Camera lens circle
    lens_r = int(size * 0.09)
    draw.ellipse([center - lens_r, (y0+y1)//2 - lens_r, center + lens_r, (y0+y1)//2 + lens_r], fill="#0f172a", outline="#ffffff", width=int(size*0.02))
    
    # Camera flash / small circle
    flash_r = int(size * 0.02)
    draw.ellipse([x1 - int(size * 0.08), y0 + int(size * 0.05), x1 - int(size * 0.08) + flash_r*2, y0 + int(size * 0.05) + flash_r*2], fill="#ffffff")
    
    # Text "EF" below camera
    # We will draw "EF" at the bottom center
    # Use default font since custom fonts might not be installed, or try loading system font
    text = "EF"
    # Find a system font or draw manually using lines/polygons for pixel independence
    try:
        # Try loading Arial or similar standard font
        font_size = int(size * 0.12)
        font = ImageFont.truetype("arial.ttf", font_size)
        w, h = draw.textsize(text, font=font) if hasattr(draw, 'textsize') else (font_size, font_size)
        # Using multiline_text_length or similar if PIL version is newer, but let's approximate or use a simple font
        draw.text((center - w // 2, y1 + int(size * 0.05)), text, fill="#f97316", font=font)
    except Exception as e:
        # Fallback text draw using lines
        # E:
        line_w = int(size * 0.015)
        # E vertical line
        ex = center - int(size * 0.06)
        ey = y1 + int(size * 0.05)
        eh = int(size * 0.08)
        ew = int(size * 0.05)
        draw.line([ex, ey, ex, ey + eh], fill="#ffffff", width=line_w)
        draw.line([ex, ey, ex + ew, ey], fill="#ffffff", width=line_w)
        draw.line([ex, ey + eh//2, ex + ew*0.7, ey + eh//2], fill="#ffffff", width=line_w)
        draw.line([ex, ey + eh, ex + ew, ey + eh], fill="#ffffff", width=line_w)
        
        # F vertical line
        fx = center + int(size * 0.02)
        draw.line([fx, ey, fx, ey + eh], fill="#ffffff", width=line_w)
        draw.line([fx, ey, fx + ew, ey], fill="#ffffff", width=line_w)
        draw.line([fx, ey + eh//2, fx + ew*0.7, ey + eh//2], fill="#ffffff", width=line_w)

    os.makedirs("public", exist_ok=True)
    img.save(f"public/icon-{size}.png")
    print(f"Generated public/icon-{size}.png successfully!")

if __name__ == "__main__":
    create_icon(192)
    create_icon(512)
