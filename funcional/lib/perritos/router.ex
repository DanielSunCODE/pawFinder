defmodule Perritos.Router do
  @moduledoc """
  Router principal del servicio. Todas las rutas cuelgan de `/f`.

    * `GET  /f/salud`      → comprueba que el servicio vive.
    * `GET  /f/zonas`      → zonas de concentración (`Perritos.ZonasWeb`).
    * `POST /f/duplicados` → posibles duplicados (`Perritos.DuplicadosWeb`).
    * `GET  /f/estadisticas` → conteos por color, raza y día (`Perritos.EstadisticasWeb`).
  """
  use Plug.Router

  plug(Plug.Logger)
  # Antes de match: así el preflight OPTIONS se contesta sin buscar ruta.
  plug(Perritos.Cors)
  plug(:match)
  # Necesario para leer el cuerpo JSON del POST (conn.body_params).
  plug(Plug.Parsers, parsers: [:json], pass: ["application/json"], json_decoder: Jason)
  plug(:dispatch)

  get "/f/salud" do
    responder(conn, 200, %{data: %{estado: "ok", servicio: "perritos-funcional"}})
  end

  forward("/f/zonas", to: Perritos.ZonasWeb)
  forward("/f/duplicados", to: Perritos.DuplicadosWeb)
  forward("/f/estadisticas", to: Perritos.EstadisticasWeb)

  match _ do
    responder(conn, 404, %{error: %{message: "No encontramos esa ruta."}})
  end

  defp responder(conn, estado, cuerpo) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(estado, Jason.encode!(cuerpo))
  end
end
