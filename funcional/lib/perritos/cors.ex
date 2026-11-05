defmodule Perritos.Cors do
  @moduledoc """
  CORS para cuando el frontend vive en otro origen que este servicio (por ejemplo,
  Vercel llamando a Render). Detrás del proxy de Docker o del proxy de Vite el navegador
  ve un solo origen y esto no hace falta.

  Los orígenes permitidos salen de la variable `CORS_ORIGIN` (varios, separados por
  comas; ver `config/runtime.exs`). Sin la variable no se agrega ninguna cabecera.
  Sólo se responde a orígenes de la lista: nunca se usa `*`.

  Las peticiones `OPTIONS` (preflight, que el navegador manda antes de un POST con JSON)
  se contestan aquí con `204` y no llegan al router.
  """
  import Plug.Conn

  @metodos "GET, POST, OPTIONS"
  @cabeceras "content-type"
  @max_age "86400"

  def init(opciones), do: opciones

  def call(conn, _opciones) do
    permitidos = Application.get_env(:perritos, :cors_origenes, [])

    case get_req_header(conn, "origin") do
      [origen] -> si_permitido(conn, origen, origen in permitidos)
      _sin_origen -> conn
    end
  end

  defp si_permitido(conn, _origen, false), do: conn

  defp si_permitido(conn, origen, true) do
    conn
    |> put_resp_header("access-control-allow-origin", origen)
    |> put_resp_header("vary", "origin")
    |> preflight()
  end

  defp preflight(%Plug.Conn{method: "OPTIONS"} = conn) do
    conn
    |> put_resp_header("access-control-allow-methods", @metodos)
    |> put_resp_header("access-control-allow-headers", @cabeceras)
    |> put_resp_header("access-control-max-age", @max_age)
    |> send_resp(204, "")
    |> halt()
  end

  defp preflight(conn), do: conn
end
