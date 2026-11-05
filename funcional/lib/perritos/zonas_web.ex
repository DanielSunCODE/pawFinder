defmodule Perritos.ZonasWeb do
  @moduledoc """
  Cáscara HTTP de *zonas de concentración*.

  `GET /f/zonas?tamano=500` → `{"data": {"tamano": 500, "resumen": {...}, "zonas": [...]}}`

  Hace siempre lo mismo: lee la petición, trae los avistamientos, llama al
  núcleo (`Perritos.Zonas`) y responde JSON. Aquí no se calcula nada.

  Se conecta desde el router principal con:

      forward "/f/zonas", to: Perritos.ZonasWeb
  """
  use Plug.Router

  alias Perritos.Zonas

  @tamano_por_omision 500
  @tamano_minimo 100
  @tamano_maximo 5_000

  plug(:match)
  plug(:dispatch)

  get "/" do
    conn = fetch_query_params(conn)
    tamano = leer_tamano(conn.query_params["tamano"])

    # efecto: leer los avistamientos (base de datos o backend del P1)
    case Perritos.Datos.avistamientos() do
      {:ok, avistamientos} ->
        zonas = Zonas.zonas(avistamientos, tamano: tamano)

        responder(conn, 200, %{
          data: %{tamano: tamano, resumen: Zonas.resumen(zonas), zonas: zonas}
        })

      {:error, _motivo} ->
        responder(conn, 503, %{
          error: %{message: "No pudimos leer los avistamientos. Intenta de nuevo."}
        })
    end
  end

  match _ do
    responder(conn, 404, %{error: %{message: "No encontramos esa ruta de zonas."}})
  end

  # "500" → 500. Vacío, texto raro o fuera de rango → el valor por omisión.
  defp leer_tamano(texto) when is_binary(texto) do
    case Integer.parse(texto) do
      {tamano, ""} when tamano in @tamano_minimo..@tamano_maximo -> tamano
      _otro -> @tamano_por_omision
    end
  end

  defp leer_tamano(_sin_valor), do: @tamano_por_omision

  # efecto: responder
  defp responder(conn, estado, cuerpo) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(estado, Jason.encode!(cuerpo))
  end
end
