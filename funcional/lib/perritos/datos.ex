defmodule Perritos.Datos do
  @moduledoc """
  Único módulo que **sale a la red** para traer datos: le pide los perritos al
  backend del Proyecto 1 (`GET /api/perritos`) con Req. El núcleo nunca lo llama;
  las cáscaras lo usan y le pasan el resultado.

  La URL base sale de la variable `BACKEND_URL` (ver `config/runtime.exs`).
  """

  @doc """
  Perritos tal como los devuelve la API (mapas con llaves de texto).
  Regresa `{:ok, lista}` o `{:error, motivo}`.
  """
  def perritos do
    url = Application.get_env(:perritos, :backend_url, "http://localhost:3000") <> "/api/perritos"

    case Req.get(url, retry: false, receive_timeout: 10_000) do
      {:ok, %Req.Response{status: 200, body: %{"data" => lista}}} when is_list(lista) ->
        {:ok, lista}

      {:ok, %Req.Response{status: estado}} ->
        {:error, {:estado, estado}}

      {:error, motivo} ->
        {:error, motivo}
    end
  end

  @doc """
  Sólo las coordenadas de cada perrito, como `%{lat: _, lon: _}`: la forma que espera
  `Perritos.Zonas`.
  """
  def avistamientos do
    with {:ok, lista} <- perritos() do
      {:ok, Enum.map(lista, &%{lat: &1["latitud"], lon: &1["longitud"]})}
    end
  end
end
