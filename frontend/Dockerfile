# Frontend de PawFinder en Docker: se compila con Vite y se sirve con nginx.
# Se construye desde la RAÍZ del repositorio (ver docker-compose.yml: context: .),
# porque el proyecto usa npm workspaces y el package-lock.json está en la raíz.

# ---- Etapa 1: compilar ----
FROM node:22-alpine AS compilar
WORKDIR /app

# Primero sólo los manifiestos, para que Docker reutilice las dependencias si no cambian.
# npm ci necesita los package.json de los tres paquetes del monorepo aunque sólo instale el frontend.
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
COPY database/package.json database/
RUN npm ci --workspace @pawfinder/frontend --include-workspace-root=false

COPY frontend frontend

# Centro del mapa: Saltillo. Las variables VITE_ se fijan al compilar, no al arrancar.
ARG VITE_MAPA_CENTRO=25.4232,-101.0053
ARG VITE_MAPA_ZOOM=13
ENV VITE_MAPA_CENTRO=$VITE_MAPA_CENTRO \
    VITE_MAPA_ZOOM=$VITE_MAPA_ZOOM
RUN npm run build --workspace @pawfinder/frontend

# ---- Etapa 2: sólo servir los archivos ----
FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilar /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
