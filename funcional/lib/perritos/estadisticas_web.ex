defmodule Perritos.EstadisticasWeb do
  @moduledoc """
  Cáscara HTTP de *estadísticas*.

  `GET /f/estadisticas?top=5&colores=principal` →

      {"data": {"total": 18, "porColor": [...], "porRaza": [...], "porDia": [...],
                "masComunes": {"colores": [...], "razas": [...]}}}

  Parámetros (todos opcionales): `top` (1 a 20, por omisión 5) y `colores`
  (`principal`, por omisión, o `todos`).

  Lee la petición, trae los perritos, llama al núcleo (`Perritos.Estadisticas`) y
  responde JSON. Aquí no se cuenta nada.
  """
  use Plug.Router

  alias Perritos.Estadisticas

  @top_por_omision 5
  @top_maximo 20

  plug(:match)
  plug(:dispatch)

  get "/" do
    conn = fetch_query_params(conn)

    opciones = [
      top: leer_top(conn.query_params["top"]),
      colores: leer_colores(conn.query_params["colores"])
    ]

    # efecto: leer los perritos (backend del P1)
    case Perritos.Datos.perritos() do
      {:ok, perritos} ->
        resumen = Estadisticas.resumen(perritos, opciones)

        responder(conn, 200, %{
          data: %{
            total: resumen.total,
            porColor: resumen.por_color,
            porRaza: resumen.por_raza,
            porDia: resumen.por_dia,
            masComunes: %{
              colores: resumen.mas_comunes.colores,
              razas: resumen.mas_comunes.razas
            }
          }
        })

      {:error, _motivo} ->
        responder(conn, 503, %{
          error: %{
            message: "No pudimos leer los perritos para las estadísticas. Intenta de nuevo."
          }
        })
    end
  end

  match _ do
    responder(conn, 404, %{error: %{message: "No encontramos esa ruta de estadísticas."}})
  end

  # "3" → 3. Vacío, texto raro o fuera de rango → el valor por omisión.
  defp leer_top(texto) when is_binary(texto) do
    case Integer.parse(texto) do
      {top, ""} when top in 1..@top_maximo -> top
      _otro -> @top_por_omision
    end
  end

  defp leer_top(_sin_valor), do: @top_por_omision

  defp leer_colores("todos"), do: :todos
  defp leer_colores(_otro), do: :principal

  # efecto: responder
  defp responder(conn, estado, cuerpo) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(estado, Jason.encode!(cuerpo))
  end
end
