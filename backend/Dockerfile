# Backend de PawFinder (Express) en Docker. Se construye desde la RAÍZ del repositorio
# (docker-compose.yml: context: .), porque el proyecto usa npm workspaces y el
# package-lock.json está en la raíz. La imagen incluye también database/ (migraciones
# y seeds), que el arranque aplica antes de abrir el puerto.
FROM node:22-slim
WORKDIR /app

# Primero sólo los manifiestos, para reutilizar la capa de dependencias si no cambian.
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
COPY database/package.json database/
# Se instala todo el backend (con tsx, que ejecuta los scripts de database/); el frontend no.
RUN npm ci --workspace @pawfinder/backend --workspace @pawfinder/database --include-workspace-root=false

COPY backend backend
COPY database database
RUN npm run build --workspace @pawfinder/backend

# Carpeta de fotos FUERA del código: en el compose es un volumen, así sobreviven a reinicios.
RUN mkdir -p /datos/imagenes && chown -R node:node /datos
ENV NODE_ENV=production \
    PORT=3000 \
    STORAGE_DRIVER=local \
    RUTA_IMAGENES=/datos/imagenes

COPY backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
