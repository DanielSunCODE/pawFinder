defmodule Perritos.ZonasTest do
  # Pruebas del núcleo de zonas: no levantan servidor ni base de datos,
  # arman los avistamientos a mano y comparan resultados.
  use ExUnit.Case, async: true
  doctest Perritos.Zonas

  alias Perritos.Zonas

  # Origen fijo para que las pruebas no dependan del valor por omisión.
  @origen {25.0, -101.0}

  # Un grado de latitud mide unos 111 320 m: 0.0045° ≈ 500 m.
  @paso_500m 0.0045

  defp perro(lat, lon), do: %{lat: lat, lon: lon}

  defp zonas(perros, tamano \\ 500), do: Zonas.zonas(perros, tamano: tamano, origen: @origen)

  test "lista vacía produce lista vacía" do
    assert zonas([]) == []
  end

  test "un solo perro da una sola zona, de nivel 0" do
    assert [%{fila: 0, columna: 0, total: 1, nivel: 0}] = zonas([perro(25.0001, -100.9999)])
  end

  test "perros en la misma celda se suman y en celdas distintas no" do
    resultado =
      zonas([
        perro(25.0001, -100.9999),
        perro(25.0003, -100.9997),
        perro(25.0001 + @paso_500m * 3, -100.9999)
      ])

    assert Enum.map(resultado, &{&1.fila, &1.columna, &1.total}) == [{0, 0, 2}, {3, 0, 1}]
  end

  test "coordenadas en el límite: el borde de una celda pertenece a la siguiente" do
    asignar = Zonas.asignador(500, @origen)
    borde_norte = 25.0 + 500 / 111_320.0

    assert asignar.({25.0, -101.0}) == {0, 0}
    assert asignar.({borde_norte, -101.0}) == {1, 0}
  end

  test "coordenadas inválidas o faltantes se ignoran sin tronar" do
    perros = [
      perro(25.0001, -100.9999),
      perro(91.0, -100.9999),
      perro(25.0001, -181.0),
      %{lat: nil, lon: -100.9999},
      %{nombre: "Sin ubicación"}
    ]

    assert [%{total: 1}] = zonas(perros)
  end

  test "al sur y al oeste del origen las celdas son negativas" do
    assert [%{fila: -1, columna: -1}] = zonas([perro(24.999, -101.001)])
  end

  test "ordena de la más concentrada a la menos; en empate, de sur a norte" do
    norte = 25.0001 + @paso_500m * 2

    resultado =
      zonas([
        perro(norte, -100.9999),
        perro(25.0001, -100.9999),
        perro(25.0001 + @paso_500m, -100.9999),
        perro(25.0002 + @paso_500m, -100.9998)
      ])

    assert Enum.map(resultado, &{&1.fila, &1.total}) == [{1, 2}, {0, 1}, {2, 1}]
  end

  test "con celdas más grandes, perros de celdas distintas se juntan" do
    perros = [perro(25.0001, -100.9999), perro(25.0001 + @paso_500m, -100.9999)]

    assert length(zonas(perros, 500)) == 2
    assert [%{total: 2}] = zonas(perros, 2000)
  end

  test "acepta un Stream igual que una lista" do
    perros = [perro(25.0001, -100.9999), perro(25.0002, -100.9998)]

    assert zonas(Stream.map(perros, & &1)) == zonas(perros)
  end

  test "los límites de cada zona encierran a sus perros" do
    lat = 25.0123
    lon = -100.9876
    [%{limites: l}] = zonas([perro(lat, lon)])

    assert l.sur <= lat and lat < l.norte
    assert l.oeste <= lon and lon < l.este
  end

  test "nivel con cortes vacíos o total cero" do
    assert Zonas.nivel(5, []) == 0
    assert Zonas.nivel(0, [2, 4, 8]) == 0
    assert Zonas.nivel(4, [2, 4, 8]) == 2
  end

  test "contar acepta cualquier función para asignar celdas" do
    todo_en_una = fn _coordenadas -> :ciudad end

    assert Zonas.contar([perro(25.0, -101.0), perro(26.0, -100.0)], todo_en_una) == %{ciudad: 2}
  end
end
