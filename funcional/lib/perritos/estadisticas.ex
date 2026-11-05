defmodule Perritos.Estadisticas do
  @moduledoc """
  Núcleo de la funcionalidad *estadísticas*: conteos de perritos por color, por raza
  y por día, y los `n` más comunes.

  Todas las funciones son **puras**: no consultan la base, no reciben peticiones y no
  leen el reloj. Reciben perritos (mapas de la API, con llaves de texto), los cuentan
  y regresan listas de mapas. Funcionan igual con una **lista** que con un **`Stream`**.

  ## Decisiones (documentadas a propósito)

    * **Color:** por omisión cuenta sólo el **color principal** (`colores: :principal`),
      así cada perrito suma una sola vez y los totales cuadran con el número de perritos.
      Con `colores: :todos` cuenta también los adicionales (un perrito con 3 colores suma
      en 3 filas, y la suma ya no es el total de perritos).
    * **Días:** el campo `fechaRegistro` llega en UTC (`...Z`). Para agrupar por día se
      convierte a la hora de Saltillo con un desfase fijo de **UTC−6** (`-21_600` s).
      Saltillo no usa horario de verano desde octubre de 2022; para fechas anteriores el
      desfase de verano no se aplica. El desfase es un argumento (`:desfase`), no se lee
      del sistema, así el resultado no depende de la zona horaria del contenedor.
      Los días sin registros no aparecen (no se rellenan con ceros).
    * **Empates** en los más comunes: gana el que tiene **mayor total** y, si empatan,
      el de **nombre menor** en orden alfabético (sin distinguir mayúsculas); así el
      resultado siempre es el mismo.
    * Un perrito sin dato para el conteo (sin fecha válida, sin raza) **no se cuenta**.
  """

  # Saltillo: UTC−6 todo el año desde octubre de 2022.
  @desfase_saltillo -6 * 3600

  @top_por_omision 5

  @doc "Desfase por omisión (segundos respecto a UTC) para agrupar por día: Saltillo."
  def desfase_saltillo, do: @desfase_saltillo

  # ── Clasificadores: de un perrito a las claves que lo cuentan ───────────────

  @doc """
  **Regresa una función** que, dado un perrito, regresa la lista de claves bajo las que
  se cuenta (lista vacía = no se cuenta). `criterio` puede ser:

    * `:raza` — el nombre de la raza.
    * `:color` — el color principal.
    * `:colores` — el principal y los adicionales.
    * `:dia` — la fecha en Saltillo (`"2026-11-05"`); admite `desfase: segundos`.

      iex> por_raza = Perritos.Estadisticas.clasificador(:raza)
      iex> por_raza.(%{"raza" => %{"nombre" => "Pug"}})
      ["Pug"]
      iex> por_raza.(%{})
      []

      iex> por_dia = Perritos.Estadisticas.clasificador(:dia)
      iex> por_dia.(%{"fechaRegistro" => "2026-11-05T03:30:00Z"})
      ["2026-11-04"]
  """
  def clasificador(criterio, opciones \\ [])

  def clasificador(:raza, _opciones), do: fn perrito -> nombre(perrito["raza"]) end
  def clasificador(:color, _opciones), do: fn perrito -> nombre(perrito["colorPrincipal"]) end

  def clasificador(:colores, _opciones) do
    fn perrito ->
      Enum.flat_map(
        [perrito["colorPrincipal"] | lista(perrito["coloresAdicionales"])],
        &nombre/1
      )
    end
  end

  def clasificador(:dia, opciones) do
    desfase = Keyword.get(opciones, :desfase, @desfase_saltillo)
    fn perrito -> dia(perrito["fechaRegistro"], desfase) end
  end

  defp nombre(%{"nombre" => nombre}) when is_binary(nombre), do: [nombre]
  defp nombre(_otro), do: []

  defp lista(valor) when is_list(valor), do: valor
  defp lista(_otro), do: []

  @doc """
  Día (`"AAAA-MM-DD"`) de una fecha ISO 8601 después de aplicar `desfase` segundos.
  Regresa `[]` si la fecha falta o no se entiende, para poder usarlo con `flat_map`.

      iex> Perritos.Estadisticas.dia("2026-11-05T05:59:00Z", -21_600)
      ["2026-11-04"]
      iex> Perritos.Estadisticas.dia("2026-11-05T06:00:00Z", -21_600)
      ["2026-11-05"]
      iex> Perritos.Estadisticas.dia("no es fecha", -21_600)
      []
      iex> Perritos.Estadisticas.dia(nil, -21_600)
      []
  """
  def dia(texto, desfase) when is_binary(texto) do
    case DateTime.from_iso8601(texto) do
      {:ok, fecha, _desfase_original} ->
        [fecha |> DateTime.add(desfase, :second) |> DateTime.to_date() |> Date.to_iso8601()]

      {:error, _motivo} ->
        []
    end
  end

  def dia(_otro, _desfase), do: []

  # ── Conteo ──────────────────────────────────────────────────────────────────

  @doc """
  **Recibe una función** `clasificar` (perrito → lista de claves) y cuenta cuántos
  perritos caen en cada clave, con `Enum.group_by` y `Enum.reduce`, sin contadores
  mutables. Regresa `%{clave => total}`.

  Acepta una lista o un `Stream`.

      iex> perros = [%{"raza" => %{"nombre" => "Pug"}}, %{"raza" => %{"nombre" => "Pug"}}, %{}]
      iex> Perritos.Estadisticas.contar(perros, Perritos.Estadisticas.clasificador(:raza))
      %{"Pug" => 2}

      iex> Perritos.Estadisticas.contar([], fn _ -> [] end)
      %{}
  """
  def contar(perritos, clasificar) when is_function(clasificar, 1) do
    perritos
    |> Stream.flat_map(clasificar)
    |> Enum.group_by(& &1)
    |> Enum.reduce(%{}, fn {clave, repeticiones}, conteo ->
      Map.put(conteo, clave, length(repeticiones))
    end)
  end

  @doc """
  Pasa un conteo `%{clave => total}` a una lista `[%{nombre: clave, total: n}]`
  ordenada del mayor al menor total; en empate, por nombre (sin distinguir mayúsculas).

      iex> Perritos.Estadisticas.ordenar(%{"b" => 2, "A" => 2, "c" => 5})
      [%{nombre: "c", total: 5}, %{nombre: "A", total: 2}, %{nombre: "b", total: 2}]
  """
  def ordenar(conteo) do
    conteo
    |> Enum.map(fn {nombre, total} -> %{nombre: nombre, total: total} end)
    |> Enum.sort_by(fn %{nombre: nombre, total: total} -> {-total, String.downcase(nombre)} end)
  end

  @doc """
  Los `n` primeros de una lista ya ordenada. Es **recursiva** (escrita a mano):
  toma la cabeza y sigue con `n - 1`. Con `n <= 0` o lista vacía regresa `[]`.

      iex> Perritos.Estadisticas.mas_comunes([%{total: 3}, %{total: 2}, %{total: 1}], 2)
      [%{total: 3}, %{total: 2}]
      iex> Perritos.Estadisticas.mas_comunes([%{total: 3}], 5)
      [%{total: 3}]
      iex> Perritos.Estadisticas.mas_comunes([%{total: 3}], 0)
      []
  """
  def mas_comunes(_ordenados, n) when n <= 0, do: []
  def mas_comunes([], _n), do: []
  def mas_comunes([cabeza | resto], n), do: [cabeza | mas_comunes(resto, n - 1)]

  # ── Conteos por criterio ────────────────────────────────────────────────────

  @doc """
  Conteo por color, del más al menos común. Opción `colores: :principal` (por omisión)
  o `:todos` (principal + adicionales). Ver las decisiones en el `@moduledoc`.

      iex> perros = [
      ...>   %{"colorPrincipal" => %{"nombre" => "Negro"}, "coloresAdicionales" => [%{"nombre" => "Blanco"}]},
      ...>   %{"colorPrincipal" => %{"nombre" => "Negro"}, "coloresAdicionales" => []}
      ...> ]
      iex> Perritos.Estadisticas.por_color(perros)
      [%{nombre: "Negro", total: 2}]
      iex> Perritos.Estadisticas.por_color(perros, colores: :todos)
      [%{nombre: "Negro", total: 2}, %{nombre: "Blanco", total: 1}]
  """
  def por_color(perritos, opciones \\ []) do
    criterio =
      if Keyword.get(opciones, :colores, :principal) == :todos, do: :colores, else: :color

    perritos |> contar(clasificador(criterio)) |> ordenar()
  end

  @doc """
  Conteo por raza, de la más a la menos común.

      iex> Perritos.Estadisticas.por_raza([%{"raza" => %{"nombre" => "Pug"}}])
      [%{nombre: "Pug", total: 1}]
  """
  def por_raza(perritos), do: perritos |> contar(clasificador(:raza)) |> ordenar()

  @doc """
  Conteo por día (hora de Saltillo), del día más antiguo al más reciente, como
  `[%{dia: "2026-11-04", total: 2}]`. Opción `desfase:` en segundos (por omisión UTC−6).

      iex> perros = [
      ...>   %{"fechaRegistro" => "2026-11-05T10:00:00Z"},
      ...>   %{"fechaRegistro" => "2026-11-05T20:00:00Z"},
      ...>   %{"fechaRegistro" => "2026-11-05T02:00:00Z"}
      ...> ]
      iex> Perritos.Estadisticas.por_dia(perros)
      [%{dia: "2026-11-04", total: 1}, %{dia: "2026-11-05", total: 2}]
  """
  def por_dia(perritos, opciones \\ []) do
    perritos
    |> contar(clasificador(:dia, opciones))
    |> Enum.map(fn {dia, total} -> %{dia: dia, total: total} end)
    |> Enum.sort_by(& &1.dia)
  end

  @doc """
  Resumen completo: total de perritos y los tres conteos, más los `n` más comunes
  (opción `top:`, `#{@top_por_omision}` por omisión) de color y de raza.

  Como `perritos` puede ser un `Stream` de un solo uso, se recorre una vez para
  pasarlo a lista y de ahí salen todos los conteos.
  """
  def resumen(perritos, opciones \\ []) do
    top = Keyword.get(opciones, :top, @top_por_omision)
    lista = Enum.to_list(perritos)
    colores = por_color(lista, opciones)
    razas = por_raza(lista)

    %{
      total: length(lista),
      por_color: colores,
      por_raza: razas,
      por_dia: por_dia(lista, opciones),
      mas_comunes: %{colores: mas_comunes(colores, top), razas: mas_comunes(razas, top)}
    }
  end
end
