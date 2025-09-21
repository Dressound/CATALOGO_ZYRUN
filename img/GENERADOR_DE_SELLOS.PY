from PIL import Image, ImageDraw, ImageFont

# === CONFIGURACIÓN PERSONAL ===
fecha_personalizada = "10/09/2025"  # Cambia esta fecha según necesites

# Crear imagen cuadrada
width, height = 320, 180
img = Image.new("RGBA", (width, height), (255, 255, 255, 0))  # Fondo transparente

draw = ImageDraw.Draw(img)

# Colores y estilo
stroke_color = (0, 51, 102)  # Azul oscuro
fill_color = stroke_color
border_thickness = 4

# Dibujar borde cuadrado
draw.rectangle(
    [0, 0, width - 1, height - 1],
    outline=stroke_color,
    width=border_thickness
)

# Cargar fuente
try:
    font_title = ImageFont.truetype("arialbd.ttf", 18)  # Negrita para títulos
    font_fecha = ImageFont.truetype("arial.ttf", 14)     # Normal para fecha
except:
    font_title = ImageFont.load_default()
    font_fecha = ImageFont.load_default()

# Textos
text1 = "ZYRUN.EC"
text2 = "RESPALDO VÁLIDO DESDE"
text_fecha = f"Fecha: {fecha_personalizada}"

# Medir y centrar cada texto
def center_text(draw, text, font, y_pos):
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    draw.text(
        ((width - text_width) / 2, y_pos),
        text,
        font=font,
        fill=fill_color
    )

# Dibujar textos en el sello
center_text(draw, text1, font_title, 35)
center_text(draw, text2, font_title, 75)
center_text(draw, text_fecha, font_fecha, 130)

# Guardar sello
img.save("sello_profesional_zyrun.png")
print("✅ Sello profesional guardado como 'sello_profesional_zyrun.png'")
