import Config

# Se lee al arrancar (también dentro de un release), no al compilar.
config :perritos,
  puerto: String.to_integer(System.get_env("PORT", "4000")),
  # Backend del Proyecto 1. En Docker es el nombre del servicio; en local, localhost.
  backend_url: System.get_env("BACKEND_URL", "http://localhost:3000"),
  # Orígenes del frontend que pueden llamar a este servicio desde el navegador, separados por comas
  # (por ejemplo https://paw-finder-frontend.vercel.app). Vacío = sólo mismo origen (Docker, Vite).
  cors_origenes:
    "CORS_ORIGIN"
    |> System.get_env("")
    |> String.split(",", trim: true)
    |> Enum.map(&String.trim/1)
