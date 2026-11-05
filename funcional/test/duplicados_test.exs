defmodule Perritos.DuplicadosTest do
  # Pruebas del núcleo de duplicados: sin servidor ni base de datos.
  use ExUnit.Case, async: true
  doctest Perritos.Duplicados

  alias Perritos.Duplicados

  @labrador %{"id" => 1, "nombre" => "Labrador"}
  @criollo %{"id" => 9, "nombre" => "Sin raza definida / Criollo"}

  # Un perrito como lo manda la API.
  defp registrado(id, opciones \\ []) do
    %{
      "id" => id,
      "nombre" => "Perro #{id}",
      "raza" => Keyword.get(opciones, :raza, @labrador),
      "colorPrincipal" => %{"id" => Keyword.get(opciones, :color, 1)},
      "coloresAdicionales" => Enum.map(Keyword.get(opciones, :extras, []), &%{"id" => &1}),
      "latitud" => Keyword.get(opciones, :lat, 25.0),
      "longitud" => Keyword.get(opciones, :lon, -101.0)
    }
  end

  # Los datos del formulario de registro.
  defp formulario(opciones \\ []) do
    raza = Keyword.get(opciones, :raza, @labrador)

    %{
      "razaId" => raza["id"],
      "razaNombre" => raza["nombre"],
      "colorPrincipalId" => Keyword.get(opciones, :color, 1),
      "coloresAdicionalesIds" => Keyword.get(opciones, :extras, []),
      "latitud" => Keyword.get(opciones, :lat, 25.0),
      "longitud" => Keyword.get(opciones, :lon, -101.0)
    }
  end

  defp ids(resultado), do: Enum.map(resultado, fn {perfil, _puntaje} -> perfil.id end)

  # Un grado de latitud mide ~111 km: 0.0009° ≈ 100 m.
  @cien_metros 0.0009

  describe "jaccard/2" do
    test "conjuntos iguales, disjuntos y parciales" do
      assert Duplicados.jaccard(MapSet.new([1, 2]), MapSet.new([1, 2])) == 1.0
      assert Duplicados.jaccard(MapSet.new([1]), MapSet.new([2])) == 0.0
      assert Duplicados.jaccard(MapSet.new([1, 2]), MapSet.new([2, 3, 4])) == 0.25
    end

    test "dos conjuntos vacíos no cuentan como parecidos" do
      assert Duplicados.jaccard(MapSet.new(), MapSet.new()) == 0.0
    end
  end

  describe "similitud_raza/2" do
    test "la raza desconocida vale 0.5 contra cualquiera, incluso otra desconocida" do
      assert Duplicados.similitud_raza({1, "Labrador"}, {9, "Sin raza definida / Criollo"}) == 0.5

      assert Duplicados.similitud_raza(
               {9, "Sin raza definida / Criollo"},
               {9, "Sin raza definida / Criollo"}
             ) == 0.5

      assert Duplicados.similitud_raza({nil, nil}, {1, "Labrador"}) == 0.5
    end

    test "misma raza vale 1 y distintas valen 0" do
      assert Duplicados.similitud_raza({1, "Labrador"}, {1, "Labrador"}) == 1.0
      assert Duplicados.similitud_raza({1, "Labrador"}, {2, "Pug"}) == 0.0
    end
  end

  describe "haversine/2 y cercania/1" do
    test "mismo punto está a 0 m y vale 1" do
      assert Duplicados.haversine({25.0, -101.0}, {25.0, -101.0}) == 0.0
      assert Duplicados.cercania(0.0) == 1.0
    end

    test "un grado de latitud mide unos 111 km" do
      assert_in_delta Duplicados.haversine({25.0, -101.0}, {26.0, -101.0}), 111_195, 50
    end

    test "a 500 m exactos o más la cercanía es 0" do
      assert Duplicados.cercania(500.0) == 0.0
      assert Duplicados.cercania(10_000.0) == 0.0
    end
  end

  describe "similitud/2" do
    test "un perro idéntico y en el mismo lugar da exactamente 1" do
      perfil = Duplicados.perfil(registrado(1, extras: [2]))
      assert Duplicados.similitud(perfil, perfil) == 1.0
    end

    test "combina los tres factores con 0.4 / 0.2 / 0.4" do
      # colores: {1} vs {1,2} = 0.5 · raza desconocida = 0.5 · a 250 m = 0.5
      a = Duplicados.perfil(registrado(1))
      b = Duplicados.perfil(registrado(2, extras: [2], raza: @criollo, lat: 25.00225))

      assert_in_delta Duplicados.similitud(a, b), 0.4 * 0.5 + 0.2 * 0.5 + 0.4 * 0.5, 0.01
    end

    test "ponderar/1 regresa una función con otros pesos" do
      sin_lugar = Duplicados.ponderar({0.5, 0.5, 0.0})
      a = Duplicados.perfil(registrado(1))
      lejos = Duplicados.perfil(registrado(2, lat: 30.0))

      assert sin_lugar.(a, lejos) == 1.0
    end
  end

  describe "emparejar/2 y parejas/1" do
    test "empareja el nuevo con cada existente y conserva el orden" do
      assert Duplicados.emparejar(:n, [:a, :b, :c]) == [{:n, :a}, {:n, :b}, {:n, :c}]
    end

    test "con lista vacía no hay parejas" do
      assert Duplicados.emparejar(:n, []) == []
      assert Duplicados.parejas([]) == []
      assert Duplicados.parejas([:solo]) == []
    end

    test "parejas/1 genera n·(n-1)/2 combinaciones sin repetir" do
      assert length(Duplicados.parejas(Enum.to_list(1..6))) == 15
      assert Duplicados.parejas([:a, :b, :c]) == [{:a, :b}, {:a, :c}, {:b, :c}]
    end
  end

  describe "buscar/3" do
    test "lista vacía de registrados no tiene duplicados" do
      assert Duplicados.buscar(formulario(), []) == []
    end

    test "regresa los parecidos de más a menos, sin los que no llegan al umbral" do
      existentes = [
        registrado(1, lat: 25.0 + 2 * @cien_metros),
        registrado(2),
        registrado(3, color: 5, raza: %{"id" => 2, "nombre" => "Pug"}),
        registrado(4, lat: 25.0 + @cien_metros)
      ]

      assert ids(Duplicados.buscar(formulario(), existentes)) == [2, 4, 1]
    end

    test "un empate de similitud se resuelve por id ascendente" do
      existentes = [registrado(8), registrado(3), registrado(5)]

      assert ids(Duplicados.buscar(formulario(), existentes)) == [3, 5, 8]
    end

    test "justo en el umbral cuenta como duplicado" do
      existentes = [registrado(1, extras: [2])]
      # colores 0.5 → 0.4·0.5 + 0.2 + 0.4 = 0.8
      assert [{_, puntaje}] = Duplicados.buscar(formulario(), existentes, umbral: 0.79)
      assert_in_delta puntaje, 0.8, 1.0e-9
    end

    test "con otro umbral y un máximo se ajusta el resultado" do
      existentes = [registrado(1), registrado(2, color: 7), registrado(3)]

      assert ids(Duplicados.buscar(formulario(), existentes, maximo: 1)) == [1]
      assert ids(Duplicados.buscar(formulario(), existentes, umbral: 0.4)) == [1, 3, 2]
    end

    test "acepta una función de similitud propia" do
      siempre_uno = fn _nuevo, _existente -> 1.0 end
      existentes = [registrado(1, color: 7, lat: 40.0)]

      assert ids(Duplicados.buscar(formulario(), existentes, con: siempre_uno)) == [1]
    end

    test "ignora registrados sin color o con coordenadas inválidas" do
      existentes = [
        registrado(1, lat: 95.0),
        %{"id" => 2, "nombre" => "Sin datos"},
        registrado(3)
      ]

      assert ids(Duplicados.buscar(formulario(), existentes)) == [3]
    end

    test "si el formulario no es comparable no hay resultados" do
      assert Duplicados.buscar(formulario(lat: 120.0), [registrado(1)]) == []
      assert Duplicados.buscar(%{"nombre" => "vacío"}, [registrado(1)]) == []
    end
  end
end
