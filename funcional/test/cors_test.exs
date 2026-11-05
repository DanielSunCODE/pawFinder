defmodule Perritos.CorsTest do
  # El plug de CORS se prueba con Plug.Test: sin servidor ni red.
  use ExUnit.Case, async: false
  import Plug.Test
  import Plug.Conn

  alias Perritos.Cors

  @vercel "https://paw-finder-frontend.vercel.app"

  setup do
    anterior = Application.get_env(:perritos, :cors_origenes)
    Application.put_env(:perritos, :cors_origenes, [@vercel])

    on_exit(fn ->
      if anterior,
        do: Application.put_env(:perritos, :cors_origenes, anterior),
        else: Application.delete_env(:perritos, :cors_origenes)
    end)
  end

  defp pedir(metodo, origen) do
    conn = conn(metodo, "/f/duplicados")
    conn = if origen, do: put_req_header(conn, "origin", origen), else: conn
    Cors.call(conn, [])
  end

  test "un origen permitido recibe la cabecera y la petición sigue su camino" do
    conn = pedir(:post, @vercel)

    assert get_resp_header(conn, "access-control-allow-origin") == [@vercel]
    refute conn.halted
  end

  test "el preflight OPTIONS se contesta con 204 y se detiene" do
    conn = pedir(:options, @vercel)

    assert conn.status == 204
    assert conn.halted
    assert get_resp_header(conn, "access-control-allow-methods") == ["GET, POST, OPTIONS"]
    assert get_resp_header(conn, "access-control-allow-headers") == ["content-type"]
  end

  test "un origen que no está en la lista no recibe cabeceras" do
    conn = pedir(:post, "https://otro-sitio.example")

    assert get_resp_header(conn, "access-control-allow-origin") == []
    refute conn.halted
  end

  test "sin cabecera Origin (mismo origen, curl) no se agrega nada" do
    assert get_resp_header(pedir(:get, nil), "access-control-allow-origin") == []
  end

  test "sin la variable configurada no se permite ningún origen" do
    Application.put_env(:perritos, :cors_origenes, [])

    assert get_resp_header(pedir(:post, @vercel), "access-control-allow-origin") == []
  end
end
