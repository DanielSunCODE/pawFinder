defmodule Perritos.EstadisticasTest do
  # Pruebas del núcleo de estadísticas: sin servidor ni base de datos.
  use ExUnit.Case, async: true
  doctest Perritos.Estadisticas

  alias Perritos.Estadisticas

  defp perro(raza, principal, extras \\ [], fecha \\ "2026-11-05T15:00:00Z") do
    %{
      "raza" => %{"id" => 1, "nombre" => raza},
      "colorPrincipal" => %{"id" => 1, "nombre" => principal},
      "coloresAdicionales" => Enum.map(extras, &%{"id" => 2, "nombre" => &1}),
      "fechaRegistro" => fecha
    }
  end

  describe "por_color/2" do
    test "lista vacía no produce conteos" do
      assert Estadisticas.por_color([]) == []
      assert Estadisticas.por_raza([]) == []
      assert Estadisticas.por_dia([]) == []
    end

    test "por omisión sólo cuenta el color principal" do
      perros = [perro("Pug", "Negro", ["Blanco"]), perro("Pug", "Negro"), perro("Pug", "Canela")]

      assert Estadisticas.por_color(perros) == [
               %{nombre: "Negro", total: 2},
               %{nombre: "Canela", total: 1}
             ]
    end

    test "con colores: :todos suma también los adicionales" do
      perros = [perro("Pug", "Negro", ["Blanco", "Canela"]), perro("Pug", "Blanco")]

      assert Estadisticas.por_color(perros, colores: :todos) == [
               %{nombre: "Blanco", total: 2},
               %{nombre: "Canela", total: 1},
               %{nombre: "Negro", total: 1}
             ]
    end

    test "un perrito sin color principal no se cuenta" do
      assert Estadisticas.por_color([%{"nombre" => "Sin color"}]) == []
    end
  end

  describe "por_dia/2 (hora de Saltillo)" do
    test "las 05:59 UTC todavía son del día anterior y las 06:00 ya son del siguiente" do
      perros = [
        perro("Pug", "Negro", [], "2026-11-05T05:59:00Z"),
        perro("Pug", "Negro", [], "2026-11-05T06:00:00Z")
      ]

      assert Estadisticas.por_dia(perros) == [
               %{dia: "2026-11-04", total: 1},
               %{dia: "2026-11-05", total: 1}
             ]
    end

    test "se ordenan cronológicamente aunque lleguen desordenados" do
      perros = [
        perro("Pug", "Negro", [], "2026-11-07T15:00:00Z"),
        perro("Pug", "Negro", [], "2026-11-05T15:00:00Z"),
        perro("Pug", "Negro", [], "2026-11-05T16:00:00Z")
      ]

      assert Enum.map(Estadisticas.por_dia(perros), & &1.dia) == ["2026-11-05", "2026-11-07"]
      assert Enum.map(Estadisticas.por_dia(perros), & &1.total) == [2, 1]
    end

    test "el desfase es un argumento: con UTC (0) el día cambia" do
      perros = [perro("Pug", "Negro", [], "2026-11-05T03:00:00Z")]

      assert [%{dia: "2026-11-04"}] = Estadisticas.por_dia(perros)
      assert [%{dia: "2026-11-05"}] = Estadisticas.por_dia(perros, desfase: 0)
    end

    test "fechas ausentes o inválidas se ignoran sin tronar" do
      perros = [perro("Pug", "Negro", [], "mañana"), %{"raza" => %{"nombre" => "Pug"}}]

      assert Estadisticas.por_dia(perros) == []
    end
  end

  describe "mas_comunes/2" do
    test "n mayor que la lista regresa toda la lista y n = 0 regresa vacío" do
      lista = [%{total: 2}, %{total: 1}]

      assert Estadisticas.mas_comunes(lista, 10) == lista
      assert Estadisticas.mas_comunes(lista, 0) == []
      assert Estadisticas.mas_comunes([], 3) == []
    end

    test "los empates se resuelven por nombre, sin distinguir mayúsculas" do
      perros = [perro("zorro", "Negro"), perro("Beagle", "Negro"), perro("alano", "Negro")]

      nombres = perros |> Estadisticas.por_raza() |> Enum.map(& &1.nombre)
      assert nombres == ["alano", "Beagle", "zorro"]

      assert perros
             |> Estadisticas.por_raza()
             |> Estadisticas.mas_comunes(2)
             |> Enum.map(& &1.nombre) == ["alano", "Beagle"]
    end
  end

  describe "contar/2 y lista vs Stream" do
    test "acepta cualquier función clasificadora" do
      por_inicial = fn %{"nombre" => nombre} -> [String.first(nombre)] end

      assert Estadisticas.contar([%{"nombre" => "Rex"}, %{"nombre" => "Rocky"}], por_inicial) ==
               %{"R" => 2}
    end

    test "una lista y un Stream dan exactamente el mismo resumen" do
      perros = [
        perro("Pug", "Negro", ["Blanco"], "2026-11-05T15:00:00Z"),
        perro("Beagle", "Canela", [], "2026-11-06T15:00:00Z"),
        perro("Pug", "Negro", [], "2026-11-06T16:00:00Z")
      ]

      assert Estadisticas.resumen(Stream.map(perros, & &1)) == Estadisticas.resumen(perros)
    end
  end

  describe "resumen/2" do
    test "junta total, conteos y los n más comunes" do
      perros = [
        perro("Pug", "Negro"),
        perro("Pug", "Canela"),
        perro("Beagle", "Negro")
      ]

      resumen = Estadisticas.resumen(perros, top: 1)

      assert resumen.total == 3
      assert resumen.mas_comunes.razas == [%{nombre: "Pug", total: 2}]
      assert resumen.mas_comunes.colores == [%{nombre: "Negro", total: 2}]
      assert length(resumen.por_color) == 2
    end

    test "sin perritos todo queda en cero o vacío" do
      assert Estadisticas.resumen([]) == %{
               total: 0,
               por_color: [],
               por_raza: [],
               por_dia: [],
               mas_comunes: %{colores: [], razas: []}
             }
    end
  end
end
