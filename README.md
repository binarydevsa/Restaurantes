# Tacos La Esquina — Demo de menú digital para food truck (Binary Dev)

Página de demostración para ofrecer menús digitales a food trucks y taquerías. El nombre, el menú, los precios y las ubicaciones son **de ejemplo**; la barra de arriba lo aclara.

## Qué incluye

- Tarjeta de "Hoy estamos en": cambia sola según el día y la hora, y dice si el truck está abierto o cerrado en ese momento
- Menú con precios: se toca **+** y el pedido se va armando en la comanda, con el total en vivo
- En celular, una barra fija abajo con el número de cosas y el total
- Pedido por WhatsApp ya escrito, con nombre para recoger
- Dónde estamos: la semana completa con el lugar y el horario de cada día, con el día de hoy marcado
- Los dos cartelitos para imprimir: QR del menú (para la ventanilla) y QR de reseñas de Google
- Español e inglés (botón EN/ES)

## Estructura

```
index.html        Página y menú (texto en español)
404.html          Página de error
css/styles.css    Estilos
js/i18n.js        Traducciones al inglés
js/main.js        Pedido, horario de la semana, idioma y configuración
assets/           Fuentes, favicon y códigos QR
robots.txt        Bloquea la indexación (es una demo)
```

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `WebTacos`).
2. Sube **el contenido** de esta carpeta a la raíz del repositorio (que `index.html` quede en la raíz).
3. En el repositorio: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. En uno o dos minutos queda en `https://TU-USUARIO.github.io/WebTacos/`.

## Convertirla en la página de un cliente real

En `js/main.js`, arriba de todo:

- `whatsappNumber`: el número del truck con código de país, solo dígitos (EE. UU.: `1` + 10 dígitos). Vacío = modo demo (muestra un aviso en vez de abrir WhatsApp).
- `schedule`: el lugar y el horario de cada día (0 = domingo … 6 = sábado; `null` = día de descanso).

Después:

- Cambia el menú en `index.html`: cada platillo es un `<li class="item">` con `data-id` (único) y `data-price` (el precio en número). Su traducción va en `js/i18n.js`.
- Genera los QR reales: el del menú con el link de la página y el de reseñas con el enlace directo de reseña del perfil de Google.
- Quita la barra de demo, `robots.txt` y la etiqueta `noindex` para que Google la indexe.
