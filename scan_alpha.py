from PIL import Image
import sys

def scan_alpha(path):
    img = Image.open(path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    width, height = img.size
    
    # Let's inspect the alpha channel row by row from bottom to top
    print(f"Image {path} dimensions: {width}x{height}")
    row_max_alphas = []
    for y in range(height):
        max_alpha = 0
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            if a > max_alpha:
                max_alpha = a
        row_max_alphas.append((y, max_alpha))
    
    # Find the last row with alpha > 10
    visible_bottom = -1
    visible_top = -1
    visible_left = width
    visible_right = -1
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            if a > 10:
                if visible_top == -1:
                    visible_top = y
                visible_bottom = max(visible_bottom, y)
                visible_left = min(visible_left, x)
                visible_right = max(visible_right, x)
                
    print(f"True visible boundaries (alpha > 10):")
    print(f"Top: {visible_top}, Bottom: {visible_bottom}")
    print(f"Left: {visible_left}, Right: {visible_right}")

scan_alpha("logos/logo_mini_branca.png")

