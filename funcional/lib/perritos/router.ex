defmodule Perritos.Router do
  @moduledoc """
  Router principal del servicio. Todas las rutas cuelgan de `/f`.

    * `GET  /f/salud`      → comprueba que el servicio vive.
    * `GET  /f/zonas`      → zonas de concentración (`Perritos.ZonasWeb`).
    * `POST /f/duplicados` → posibles duplicados (`Perritos.DuplicadosWeb`).
  """
  use Plug.Router

  plug(Plug.Logger)
  plug(:match)
  # Necesario para leer el cuerpo JSON del POST (conn.body_params).
  plug(Plug.Parsers, parsers: [:json], pass: ["application/json"], json_decoder: Jason)
  plug(:dispatch)

  get "/f/salud" do
    responder(conn, 200, %{data: %{estado: "ok", servicio: "perritos-funcional"}})
  end

  forward("/f/zonas", to: Perritos.ZonasWeb)
  forward("/f/duplicados", to: Perritos.DuplicadosWeb)

  match _ do
    responder(conn, 404, %{error: %{message: "No encontramos esa ruta."}})
  end

  defp responder(conn, estado, cuerpo) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(estado, Jason.encode!(cuerpo))
  end
end
