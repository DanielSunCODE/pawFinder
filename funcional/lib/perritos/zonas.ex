defmodule Perritos.Zonas do
  @moduledoc """
  Núcleo de la funcionalidad *zonas de concentración*.

  Divide la ciudad en una cuadrícula de celdas cuadradas (por ejemplo, de 500 m)
  y cuenta cuántos perritos se han visto en cada celda. El frontend sólo pinta
  el resultado.

  Todas las funciones son **puras**: reciben avistamientos y regresan datos.
  No consultan la base de datos, no reciben peticiones HTTP, no leen el reloj
  y no imprimen. Por eso se prueban con ExUnit sin levantar nada.

  Un avistamiento es cualquier mapa o struct con las llaves `:lat` y `:lon`
  (grados decimales). Las demás llaves se ignoran.

  Una celda se identifica con `{fila, columna}`: la fila crece hacia el norte y
  la columna hacia el este, contando desde un punto de origen.
  """

  # Metros que mide un grado de latitud (aproximación esférica de la Tierra).
  @metros_por_grado 111_320.0

  # Origen de la cuadrícula: centro de Saltillo. Cualquier punto fijo sirve;
  # lo importante es que sea el mismo en cada cálculo para que las celdas no se muevan.
  @origen_saltillo {25.4232, -101.0053}

  @tamano_por_omision 500

  # Cortes de intensidad: con menos de 2 perritos la celda es nivel 0, de 2 a 3
  # nivel 1, de 4 a 7 nivel 2 y de 8 en adelante nivel 3.
  @cortes_por_omision [2, 4, 8]

  defguardp coordenadas_validas(lat, lon)
            when is_number(lat) and is_number(lon) and lat >= -90 and lat <= 90 and
                   lon >= -180 and lon <= 180

  @doc """
  Calcula las zonas: una entrada por cada celda con al menos un perrito,
  de la más concentrada a la menos concentrada.

  Opciones:

    * `:tamano` — lado de la celda en metros (`#{@tamano_por_omision}` por omisión).
    * `:origen` — `{lat, lon}` desde donde se cuenta la cuadrícula (centro de Saltillo).
    * `:cortes` — cortes ascendentes para el nivel de intensidad (`#{inspect(@cortes_por_omision)}`).

  Acepta una lista o un `Stream` de avistamientos. Los avistamientos sin
  coordenadas válidas se ignoran.

      iex> perros = [%{lat: 25.0001, lon: -100.9999}, %{lat: 25.0002, lon: -100.9998}]
      iex> [zona] = Perritos.Zonas.zonas(perros, tamano: 500, origen: {25.0, -101.0})
      iex> {zona.fila, zona.columna, zona.total, zona.nivel}
      {0, 0, 2, 1}

      iex> Perritos.Zonas.zonas([])
      []
  """
  def zonas(avistamientos, opciones \\ []) do
    tamano = Keyword.get(opciones, :tamano, @tamano_por_omision)
    origen = Keyword.get(opciones, :origen, @origen_saltillo)
    cortes = Keyword.get(opciones, :cortes, @cortes_por_omision)

    avistamientos
    |> contar(asignador(tamano, origen))
    |> Enum.map(fn {celda, total} -> describir(celda, total, tamano, origen, cortes) end)
    |> Enum.sort_by(&orden/1)
  end

  @doc """
  **Regresa una función** que convierte coordenadas `{lat, lon}` en la celda
  `{fila, columna}` que les toca, para celdas de `tamano` metros contadas desde `origen`.

  Un grado de longitud mide menos metros que uno de latitud (y menos entre más
  lejos del ecuador), así que se corrige con el coseno de la latitud del origen
  para que las celdas salgan cuadradas.

      iex> celda = Perritos.Zonas.asignador(500, {25.0, -101.0})
      iex> celda.({25.0, -101.0})
      {0, 0}
      iex> celda.({25.0046, -101.0})
      {1, 0}
      iex> celda.({24.999, -101.001})
      {-1, -1}
  """
  def asignador(tamano, {lat0, lon0}) when is_number(tamano) and tamano > 0 do
    metros_lon = metros_por_grado_lon(lat0)

    fn {lat, lon} ->
      {floor((lat - lat0) * @metros_por_grado / tamano),
       floor((lon - lon0) * metros_lon / tamano)}
    end
  end

  @doc """
  **Recibe una función** `asignar` (de coordenadas a celda) y cuenta cuántos
  avistamientos caen en cada celda. Regresa un mapa `%{celda => total}`.

  Funciona igual con una lista que con un `Stream`.

      iex> por_decena = fn {lat, _lon} -> trunc(lat / 10) end
      iex> Perritos.Zonas.contar([%{lat: 12, lon: 0}, %{lat: 15, lon: 0}, %{lat: 31, lon: 0}], por_decena)
      %{1 => 2, 3 => 1}
  """
  def contar(avistamientos, asignar) when is_function(asignar, 1) do
    avistamientos
    |> Stream.flat_map(&coordenadas/1)
    |> Stream.map(asignar)
    |> Enum.reduce(%{}, fn celda, conteo -> Map.update(conteo, celda, 1, &(&1 + 1)) end)
  end

  @doc """
  Saca las coordenadas de un avistamiento como lista: `[{lat, lon}]` si son
  válidas o `[]` si faltan o están fuera de rango. Así sirve directo con
  `flat_map` para filtrar y transformar en un solo paso.

      iex> Perritos.Zonas.coordenadas(%{lat: 25.4, lon: -101.0})
      [{25.4, -101.0}]
      iex> Perritos.Zonas.coordenadas(%{lat: 91, lon: 0})
      []
      iex> Perritos.Zonas.coordenadas(%{nombre: "Firulais"})
      []
  """
  def coordenadas(%{lat: lat, lon: lon}) when coordenadas_validas(lat, lon), do: [{lat, lon}]
  def coordenadas(_avistamiento), do: []

  @doc """
  Nivel de concentración de una celda: cuántos `cortes` (ascendentes) alcanza su `total`.
  Es **recursiva**: revisa un corte, y si lo alcanza sigue con el resto.

      iex> Perritos.Zonas.nivel(1, [2, 4, 8])
      0
      iex> Perritos.Zonas.nivel(5, [2, 4, 8])
      2
      iex> Perritos.Zonas.nivel(30, [2, 4, 8])
      3
  """
  def nivel(total, cortes), do: nivel(total, cortes, 0)

  defp nivel(_total, [], alcanzados), do: alcanzados
  defp nivel(total, [corte | _resto], alcanzados) when total < corte, do: alcanzados
  defp nivel(total, [_corte | resto], alcanzados), do: nivel(total, resto, alcanzados + 1)

  @doc """
  Rectángulo de una celda en grados, listo para que el mapa lo dibuje:
  `%{sur: ..., oeste: ..., norte: ..., este: ...}`.

      iex> %{sur: sur, oeste: oeste} = Perritos.Zonas.limites({0, 0}, 500, {25.0, -101.0})
      iex> {sur, oeste}
      {25.0, -101.0}
  """
  def limites({fila, columna}, tamano, {lat0, lon0}) do
    alto = tamano / @metros_por_grado
    ancho = tamano / metros_por_grado_lon(lat0)

    %{
      sur: lat0 + fila * alto,
      norte: lat0 + (fila + 1) * alto,
      oeste: lon0 + columna * ancho,
      este: lon0 + (columna + 1) * ancho
    }
  end

  @doc """
  Resumen de un resultado de `zonas/2`: cuántas celdas tienen perritos, cuántos
  perritos se contaron y el máximo en una sola celda.

      iex> Perritos.Zonas.resumen([%{total: 3}, %{total: 1}])
      %{celdas: 2, perritos: 4, maximo: 3}
      iex> Perritos.Zonas.resumen([])
      %{celdas: 0, perritos: 0, maximo: 0}
  """
  def resumen(zonas) do
    Enum.reduce(zonas, %{celdas: 0, perritos: 0, maximo: 0}, fn %{total: total}, acumulado ->
      %{
        celdas: acumulado.celdas + 1,
        perritos: acumulado.perritos + total,
        maximo: max(acumulado.maximo, total)
      }
    end)
  end

  # ── Funciones privadas ────────────────────────────────────────────────────────

  defp describir({fila, columna} = celda, total, tamano, origen, cortes) do
    %{
      fila: fila,
      columna: columna,
      total: total,
      nivel: nivel(total, cortes),
      limites: limites(celda, tamano, origen)
    }
  end

  # Más perritos primero; en empate, de sur a norte y de oeste a este (orden estable).
  defp orden(%{total: total, fila: fila, columna: columna}), do: {-total, fila, columna}

  defp metros_por_grado_lon(lat), do: @metros_por_grado * :math.cos(lat * :math.pi() / 180)
end
