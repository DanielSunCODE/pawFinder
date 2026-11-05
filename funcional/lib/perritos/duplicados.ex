defmodule Perritos.Duplicados do
  @moduledoc """
  Núcleo de la funcionalidad *posibles duplicados*.

  Compara el perrito que se está registrando con los ya registrados y regresa
  los más parecidos, para avisar "¿no será éste?" antes de guardar.

  Todas las funciones son **puras**: no consultan la base, no reciben peticiones
  y no leen el reloj. Reciben listas y mapas, y regresan listas y mapas.

  ## Similitud

      similitud = 0.4 × colores + 0.2 × raza + 0.4 × cercanía

    * **colores** — índice de Jaccard entre el conjunto de colores de cada perrito
      (principal + adicionales): `|A ∩ B| / |A ∪ B|`.
    * **raza** — `1.0` si es la misma, `0.0` si son distintas y `0.5` si alguna es
      desconocida ("Sin raza definida / Criollo"): no sabemos si coinciden.
    * **cercanía** — `1 - distancia / 500` con la distancia en metros (haversine);
      a 500 m o más vale 0.

  Se considera posible duplicado si la similitud llega al umbral (`0.8`).

  ## Forma de los datos

  Un perrito de la API o del formulario se reduce a un *perfil*
  `%{id, nombre, raza, colores, lat, lon}` con `perfil/1`. Los mapas de entrada
  llevan llaves de texto, tal como salen del JSON.
  """

  @peso_colores 0.4
  @peso_raza 0.2
  @peso_cercania 0.4

  @umbral 0.8
  @radio_metros 500.0
  @radio_tierra_m 6_371_000.0

  @doc "Umbral por omisión a partir del cual se avisa de un posible duplicado."
  def umbral, do: @umbral

  # ── Perfiles ────────────────────────────────────────────────────────────────

  @doc """
  Reduce un perrito (de la API o del formulario de registro) a lo que importa para
  comparar. Regresa un mapa con `:id`, `:nombre`, `:raza` (`{id, nombre}`),
  `:colores` (un `MapSet` de ids), `:lat` y `:lon`.

  El formulario manda `razaNombre` junto con `razaId`.

      iex> api = %{"id" => 7, "nombre" => "Rex", "raza" => %{"id" => 3, "nombre" => "Labrador"},
      ...>         "colorPrincipal" => %{"id" => 1}, "coloresAdicionales" => [%{"id" => 4}],
      ...>         "latitud" => 25.4, "longitud" => -101.0}
      iex> Perritos.Duplicados.perfil(api)
      %{id: 7, nombre: "Rex", raza: {3, "Labrador"}, colores: MapSet.new([1, 4]), lat: 25.4, lon: -101.0}

      iex> form = %{"razaId" => 3, "razaNombre" => "Labrador", "colorPrincipalId" => 1,
      ...>          "coloresAdicionalesIds" => [], "latitud" => 25.4, "longitud" => -101.0}
      iex> Perritos.Duplicados.perfil(form).colores
      MapSet.new([1])
  """
  def perfil(%{"colorPrincipal" => principal} = perrito) do
    adicionales = Map.get(perrito, "coloresAdicionales") || []
    raza = Map.get(perrito, "raza") || %{}

    armar(
      perrito["id"],
      perrito["nombre"],
      {raza["id"], raza["nombre"]},
      Enum.map([principal | adicionales], & &1["id"]),
      perrito["latitud"],
      perrito["longitud"]
    )
  end

  def perfil(%{"colorPrincipalId" => principal} = perrito) do
    armar(
      perrito["id"],
      perrito["nombre"],
      {perrito["razaId"], perrito["razaNombre"]},
      [principal | Map.get(perrito, "coloresAdicionalesIds") || []],
      perrito["latitud"],
      perrito["longitud"]
    )
  end

  def perfil(_otro),
    do: %{id: nil, nombre: nil, raza: {nil, nil}, colores: MapSet.new(), lat: nil, lon: nil}

  defp armar(id, nombre, raza, colores, lat, lon) do
    %{id: id, nombre: nombre, raza: raza, colores: MapSet.new(colores), lat: lat, lon: lon}
  end

  @doc """
  Un perfil es comparable si tiene al menos un color y coordenadas dentro de rango.

      iex> Perritos.Duplicados.valido?(%{colores: MapSet.new([1]), lat: 25.0, lon: -101.0})
      true
      iex> Perritos.Duplicados.valido?(%{colores: MapSet.new([]), lat: 25.0, lon: -101.0})
      false
      iex> Perritos.Duplicados.valido?(%{colores: MapSet.new([1]), lat: 95, lon: 0})
      false
  """
  def valido?(%{colores: colores, lat: lat, lon: lon})
      when is_number(lat) and is_number(lon) and lat >= -90 and lat <= 90 and lon >= -180 and
             lon <= 180,
      do: MapSet.size(colores) > 0

  def valido?(_perfil), do: false

  # ── Componentes de la similitud ─────────────────────────────────────────────

  @doc """
  Índice de Jaccard entre dos conjuntos de colores: `|A ∩ B| / |A ∪ B|`, de 0.0 a 1.0.
  Si los dos están vacíos regresa `0.0` (no hay evidencia de parecido).

      iex> Perritos.Duplicados.jaccard(MapSet.new([1, 2]), MapSet.new([2, 3]))
      0.3333333333333333
      iex> Perritos.Duplicados.jaccard(MapSet.new([1]), MapSet.new([1]))
      1.0
      iex> Perritos.Duplicados.jaccard(MapSet.new([]), MapSet.new([]))
      0.0
  """
  def jaccard(a, b) do
    case MapSet.size(MapSet.union(a, b)) do
      0 -> 0.0
      union -> MapSet.size(MapSet.intersection(a, b)) / union
    end
  end

  @doc """
  Parecido de raza entre dos `{id, nombre}`: `1.0` misma raza, `0.5` si alguna es
  desconocida, `0.0` si son distintas.

      iex> Perritos.Duplicados.similitud_raza({3, "Labrador"}, {3, "Labrador"})
      1.0
      iex> Perritos.Duplicados.similitud_raza({3, "Labrador"}, {9, "Sin raza definida / Criollo"})
      0.5
      iex> Perritos.Duplicados.similitud_raza({3, "Labrador"}, {4, "Pug"})
      0.0
  """
  def similitud_raza(a, b), do: similitud_raza(a, b, desconocida?(a), desconocida?(b))

  defp similitud_raza(_a, _b, true, _), do: 0.5
  defp similitud_raza(_a, _b, _, true), do: 0.5
  defp similitud_raza({id, _}, {id, _}, false, false), do: 1.0
  defp similitud_raza(_a, _b, false, false), do: 0.0

  # "Sin raza definida / Criollo" (o sin dato) cuenta como raza desconocida.
  defp desconocida?({nil, _nombre}), do: true

  defp desconocida?({_id, nombre}) when is_binary(nombre),
    do: nombre |> String.downcase() |> String.trim() |> String.starts_with?("sin raza")

  defp desconocida?(_otra), do: false

  @doc """
  Distancia en metros entre dos puntos `{lat, lon}` con la fórmula de haversine.

      iex> Perritos.Duplicados.haversine({25.0, -101.0}, {25.0, -101.0})
      0.0
      iex> Float.round(Perritos.Duplicados.haversine({25.0, -101.0}, {25.0045, -101.0}))
      500.0
  """
  def haversine({lat1, lon1}, {lat2, lon2}) do
    {f1, f2} = {radianes(lat1), radianes(lat2)}
    {df, dl} = {radianes(lat2 - lat1), radianes(lon2 - lon1)}

    a =
      :math.pow(:math.sin(df / 2), 2) +
        :math.cos(f1) * :math.cos(f2) * :math.pow(:math.sin(dl / 2), 2)

    2 * @radio_tierra_m * :math.asin(:math.sqrt(a))
  end

  defp radianes(grados), do: grados * :math.pi() / 180

  @doc """
  Cercanía de 1.0 (mismo punto) a 0.0 (a `500` m o más).

      iex> Perritos.Duplicados.cercania(0.0)
      1.0
      iex> Perritos.Duplicados.cercania(250.0)
      0.5
      iex> Perritos.Duplicados.cercania(900.0)
      0.0
  """
  def cercania(metros) when metros >= @radio_metros, do: 0.0
  def cercania(metros), do: 1.0 - metros / @radio_metros

  # ── Similitud total ─────────────────────────────────────────────────────────

  @doc """
  **Regresa una función** de dos perfiles que calcula la similitud (0.0 a 1.0) con los
  pesos dados `{colores, raza, cercania}`. Los pesos por omisión son `{0.4, 0.2, 0.4}`.

      iex> solo_lugar = Perritos.Duplicados.ponderar({0.0, 0.0, 1.0})
      iex> a = %{colores: MapSet.new([1]), raza: {1, "A"}, lat: 25.0, lon: -101.0}
      iex> b = %{colores: MapSet.new([2]), raza: {2, "B"}, lat: 25.0, lon: -101.0}
      iex> solo_lugar.(a, b)
      1.0
  """
  def ponderar({p_colores, p_raza, p_cercania} \\ {@peso_colores, @peso_raza, @peso_cercania}) do
    fn a, b ->
      p_colores * jaccard(a.colores, b.colores) +
        p_raza * similitud_raza(a.raza, b.raza) +
        p_cercania * cercania(haversine({a.lat, a.lon}, {b.lat, b.lon}))
    end
  end

  @doc """
  Similitud con los pesos por omisión (`0.4 / 0.2 / 0.4`).

      iex> a = %{colores: MapSet.new([1, 2]), raza: {1, "Labrador"}, lat: 25.0, lon: -101.0}
      iex> Perritos.Duplicados.similitud(a, a)
      1.0
  """
  def similitud(a, b), do: ponderar().(a, b)

  # ── Parejas (recursión escrita a mano) ──────────────────────────────────────

  @doc """
  Empareja `nuevo` con cada elemento de `existentes`: `[{nuevo, e1}, {nuevo, e2}, ...]`.
  Es **recursiva**, con un acumulador, y respeta el orden de entrada.

      iex> Perritos.Duplicados.emparejar(:n, [:a, :b])
      [{:n, :a}, {:n, :b}]
      iex> Perritos.Duplicados.emparejar(:n, [])
      []
  """
  def emparejar(nuevo, existentes), do: emparejar(nuevo, existentes, [])

  defp emparejar(_nuevo, [], acumulado), do: Enum.reverse(acumulado)

  defp emparejar(nuevo, [e | resto], acumulado),
    do: emparejar(nuevo, resto, [{nuevo, e} | acumulado])

  @doc """
  Todas las parejas posibles de una lista, sin repetir ni emparejar un elemento
  consigo mismo. Recursiva: cada elemento se une con todos los que le siguen.

      iex> Perritos.Duplicados.parejas([1, 2, 3])
      [{1, 2}, {1, 3}, {2, 3}]
      iex> Perritos.Duplicados.parejas([1])
      []
  """
  def parejas([]), do: []
  def parejas([cabeza | cola]), do: emparejar(cabeza, cola) ++ parejas(cola)

  # ── Búsqueda ────────────────────────────────────────────────────────────────

  @doc """
  Busca entre `existentes` (mapas de la API) los parecidos al perrito `nuevo` (mapa del
  formulario). Regresa una lista de `{perfil, similitud}` de la más a la menos parecida;
  en empate, el de id menor primero.

  Opciones:

    * `:umbral` — similitud mínima (`#{@umbral}` por omisión).
    * `:con` — función `(perfil, perfil -> similitud)`; por omisión `ponderar/0`.
    * `:maximo` — cuántos regresar como máximo (`5` por omisión).

  Los perritos sin color o sin coordenadas válidas se ignoran, y si el nuevo no es
  comparable el resultado es `[]`.

      iex> nuevo = %{"razaId" => 1, "razaNombre" => "Labrador", "colorPrincipalId" => 1,
      ...>           "coloresAdicionalesIds" => [], "latitud" => 25.0, "longitud" => -101.0}
      iex> igual = %{"id" => 1, "nombre" => "Rex", "raza" => %{"id" => 1, "nombre" => "Labrador"},
      ...>           "colorPrincipal" => %{"id" => 1}, "coloresAdicionales" => [],
      ...>           "latitud" => 25.0, "longitud" => -101.0}
      iex> lejos = %{igual | "id" => 2, "latitud" => 26.0}
      iex> [{perfil, puntaje}] = Perritos.Duplicados.buscar(nuevo, [lejos, igual])
      iex> {perfil.id, puntaje}
      {1, 1.0}
  """
  def buscar(nuevo, existentes, opciones \\ []) do
    umbral = Keyword.get(opciones, :umbral, @umbral)
    con = Keyword.get(opciones, :con, ponderar())
    maximo = Keyword.get(opciones, :maximo, 5)

    nuevo
    |> perfil()
    |> comparables(existentes)
    |> Enum.map(fn {nuevo_perfil, existente} -> {existente, con.(nuevo_perfil, existente)} end)
    |> Enum.filter(fn {_perfil, puntaje} -> puntaje >= umbral end)
    |> ordenar()
    |> Enum.take(maximo)
  end

  @doc """
  Ordena `{perfil, similitud}` de la más a la menos parecida; en empate, por id ascendente.

      iex> Perritos.Duplicados.ordenar([{%{id: 2}, 0.9}, {%{id: 1}, 0.9}, {%{id: 3}, 1.0}])
      [{%{id: 3}, 1.0}, {%{id: 1}, 0.9}, {%{id: 2}, 0.9}]
  """
  def ordenar(puntuados),
    do: Enum.sort_by(puntuados, fn {%{id: id}, puntaje} -> {-puntaje, id} end)

  # Parejas {nuevo, existente} donde ambos perfiles se pueden comparar.
  defp comparables(nuevo, existentes) do
    if valido?(nuevo) do
      existentes
      |> Enum.map(&perfil/1)
      |> Enum.filter(&valido?/1)
      |> then(&emparejar(nuevo, &1))
    else
      []
    end
  end
end
