import Config

# Se lee al arrancar (también dentro de un release), no al compilar.
config :perritos,
  puerto: String.to_integer(System.get_env("PORT", "4000")),
  # Backend del Proyecto 1. En Docker es el nombre del servicio; en local, localhost.
  backend_url: System.get_env("BACKEND_URL", "http://localhost:3000")
