defmodule Perritos.DuplicadosWeb do
  @moduledoc """
  Cáscara HTTP de *posibles duplicados*.

  `POST /f/duplicados` con los datos del formulario de registro:

      {"razaId": 3, "razaNombre": "Labrador", "colorPrincipalId": 1,
       "coloresAdicionalesIds": [4], "latitud": 25.42, "longitud": -101.0}

  responde `{"data": {"umbral": 0.8, "duplicados": [{"id", "nombre", "similitud", ...}]}}`.

  Lee la petición, trae los perritos, llama al núcleo (`Perritos.Duplicados`) y
  responde JSON. Lo único que hace con el resultado es convertir las tuplas
  `{perfil, similitud}` a mapas, porque JSON no tiene tuplas. No calcula nada.
  """
  use Plug.Router

  alias Perritos.Duplicados

  plug(:match)
  plug(:dispatch)

  post "/" do
    case validar(conn.body_params) do
      :ok ->
        # efecto: leer los perritos registrados (backend del P1)
        case Perritos.Datos.perritos() do
          {:ok, existentes} ->
            duplicados =
              conn.body_params
              |> Duplicados.buscar(existentes)
              |> Enum.map(&a_mapa/1)

            responder(conn, 200, %{data: %{umbral: Duplicados.umbral(), duplicados: duplicados}})

          {:error, _motivo} ->
            responder(conn, 503, %{
              error: %{message: "No pudimos revisar los perritos registrados. Intenta de nuevo."}
            })
        end

      {:error, mensaje} ->
        responder(conn, 400, %{error: %{message: mensaje}})
    end
  end

  match _ do
    responder(conn, 404, %{error: %{message: "No encontramos esa ruta de duplicados."}})
  end

  # Es un aviso, no un registro: sólo se exige lo necesario para comparar.
  defp validar(%{"colorPrincipalId" => color, "latitud" => lat, "longitud" => lon})
       when is_integer(color) and is_number(lat) and is_number(lon),
       do: :ok

  defp validar(_cuerpo),
    do: {:error, "Faltan datos para comparar: colorPrincipalId, latitud y longitud."}

  # Tupla del núcleo → mapa que sí se puede mandar como JSON.
  defp a_mapa({perfil, similitud}) do
    {raza_id, raza_nombre} = perfil.raza

    %{
      id: perfil.id,
      nombre: perfil.nombre,
      raza: %{id: raza_id, nombre: raza_nombre},
      similitud: Float.round(similitud, 3),
      latitud: perfil.lat,
      longitud: perfil.lon
    }
  end

  # efecto: responder
  defp responder(conn, estado, cuerpo) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(estado, Jason.encode!(cuerpo))
  end
end
