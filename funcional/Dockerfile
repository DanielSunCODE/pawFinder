# Servicio Elixir (Proyecto 2) en dos etapas: se compila un release con `mix release`
# y sólo ese release (sin Elixir, sin código fuente) llega a la imagen final.
# Se construye desde esta carpeta (ver docker-compose.yml: context: ./funcional).

# ---- Etapa 1: compilar el release ----
# Las versiones de Elixir y Erlang/OTP de las dos etapas deben corresponder con las de
# la imagen final (mismo sistema operativo: Debian bookworm).
FROM elixir:1.18-otp-27-slim AS compilar
WORKDIR /app
ENV MIX_ENV=prod

# La imagen slim no trae certificados: sin ellos Hex no puede descargar nada por HTTPS.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git \
    && rm -rf /var/lib/apt/lists/*
RUN mix local.hex --force && mix local.rebar --force

# Primero sólo las dependencias, para que Docker las reutilice si no cambian.
COPY mix.exs mix.lock ./
RUN mix deps.get --only prod
COPY config config
RUN mix deps.compile

COPY lib lib
RUN mix release

# ---- Etapa 2: sólo correr el release ----
FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends libstdc++6 openssl libncurses6 ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=compilar /app/_build/prod/rel/perritos ./

# Dónde escuchar y a qué backend pedirle los perritos (se leen al arrancar, ver config/runtime.exs).
ENV PORT=4000 \
    BACKEND_URL=http://backend:3000
EXPOSE 4000

# Sin root: el servicio no necesita permisos especiales.
RUN useradd --system --no-create-home perritos
USER perritos

CMD ["bin/perritos", "start"]
