Request -> servidor
-> renderTemplate(page template)
-> renderServerComponents()
-> envolver en layout
-> insertar <script src="/public/client.js">
-> enviar HTML completo

Navegador recibe HTML
-> muestra contenido prerenderizado
-> ejecuta client.js
-> hidrata los <x-client> tags en custom elements
