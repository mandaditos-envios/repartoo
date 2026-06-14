import streamlit as st
import xml.etree.ElementTree as ET
import pandas as pd
import math

# Configuración de la página web en el celular
st.set_page_config(page_title="Ruteador de Entregas KML", page_icon="🛵", layout="centered")

st.title("🛵 Optimizador de Rutas para Reparto")
st.write("Subí el archivo .kml para calcular la ruta por cercanía.")

# Función para calcular distancia entre dos coordenadas (Fórmula de Haversine)
def calcular_distancia(lat1, lon1, lat2, lon2):
    rad = math.pi / 180
    dlat = (lat2 - lat1) * rad
    dlon = (lon2 - lon1) * rad
    a = math.sin(dlat/2)**2 + math.cos(lat1*rad) * math.cos(lat2*rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return 6371 * c # Resultado en kilómetros

# Algoritmo del vecino más cercano para ordenar el reparto
def optimizar_ruta(puntos):
    if not puntos:
        return []
    
    # Empezamos por el primer punto del archivo KML
    ruta_ordenada = [puntos.pop(0)]
    
    while puntos:
        ultimo = ruta_ordenada[-1]
        # Busca el punto más cercano al último visitado
        mas_cercano = min(puntos, key=lambda p: calcular_distancia(ultimo['lat'], ultimo['lon'], p['lat'], p['lon']))
        ruta_ordenada.append(mas_cercano)
        puntos.remove(mas_cercano)
        
    return ruta_ordenada

# Botón para subir el archivo KML desde el celu
archivo_subido = st.file_uploader("Elegí tu archivo .kml", type=["kml"])

if archivo_subido is not None:
    try:
        # Parseamos el archivo XML/KML
        tree = ET.parse(archivo_subido)
        root = tree.getroot()
        namespaces = {'kml': 'http://www.opengis.net/kml/2.2'}
        
        puntos_extraidos = []
        
        # Recorremos cada marcador del archivo
        for placemark in root.findall('.//kml:Placemark', namespaces):
            nombre = placemark.find('kml:name', namespaces)
            coordenadas = placemark.find('.//kml:coordinates', namespaces)
            
            if coordenadas is not None:
                texto_coords = coordenadas.text.strip().split(',')
                if len(texto_coords) >= 2:
                    puntos_extraidos.append({
                        'nombre': nombre.text if nombre is not None else f"Entrega {len(puntos_extraidos)+1}",
                        'lon': float(texto_coords[0]),
                        'lat': float(texto_coords[1])
                    })
        
        if puntos_extraidos:
            st.success(f"¡Se encontraron {len(puntos_extraidos)} ubicaciones!")
            
            # Ordenamos los puntos por cercanía
            ruta_final = optimizar_ruta(puntos_extraidos)
            
            # Mostramos la lista en pantalla
            df = pd.DataFrame(ruta_final)
            st.subheader("📍 Orden sugerido:")
            st.dataframe(df[['nombre']])
            
            st.markdown("---")
            st.subheader("🗺️ Enlaces para Google Maps")
            
            # Google Maps en celular se satura con más de 10 paradas.
            # Dividimos la ruta en tramos de 10 entregas cada uno.
            limite_paradas = 10
            base_url = "https://www.google.com/maps/dir/"
            
            for i in range(0, len(ruta_final), limite_paradas):
                bloque = ruta_final[i:i+limite_paradas]
                # Unimos las coordenadas con barras diagonales para el link de Maps
                direcciones = "/".join([f"{p['lat']},{p['lon']}" for p in bloque])
                link_google_maps = f"{base_url}{direcciones}"
                
                tramo_nro = (i // limite_paradas) + 1
                
                st.write(f"🗺️ **Tramo {tramo_nro}** (Entregas {i+1} a {i+len(bloque)}):")
                st.markdown(f"[🚀 ABRIR TRAMO {tramo_nro} EN GOOGLE MAPS]({link_google_maps})")
                
        else:
            st.error("No se encontraron coordenadas válidas en el archivo KML.")
            
    except Exception as e:
        st.error(f"Hubo un error al procesar el archivo: {e}")
