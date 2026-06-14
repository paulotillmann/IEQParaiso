from PIL import Image

def trim_image_threshold(path, threshold=10):
    try:
        img = Image.open(path)
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        width, height = img.size
        visible_top = -1
        visible_bottom = -1
        visible_left = width
        visible_right = -1
        
        # Scan for active pixels above the alpha threshold
        for y in range(height):
            for x in range(width):
                r, g, b, a = img.getpixel((x, y))
                if a > threshold:
                    if visible_top == -1:
                        visible_top = y
                    visible_bottom = max(visible_bottom, y)
                    visible_left = min(visible_left, x)
                    visible_right = max(visible_right, x)
        
        if visible_top != -1 and visible_bottom != -1 and visible_left < visible_right:
            # Crop to the active area
            cropped = img.crop((visible_left, visible_top, visible_right + 1, visible_bottom + 1))
            cropped.save(path)
            print(f"Successfully cropped {path}:")
            print(f"  Old dimensions: {width}x{height}")
            print(f"  New dimensions: {cropped.size[0]}x{cropped.size[1]}")
            print(f"  Cropped box: ({visible_left}, {visible_top}, {visible_right}, {visible_bottom})")
        else:
            print(f"No pixels found above threshold={threshold} in {path}")
            
    except Exception as e:
        print(f"Error trimming {path}: {str(e)}")

trim_image_threshold("logos/logo_branca.png")
trim_image_threshold("logos/logo_preta.png")
