defmodule Perritos do
  @moduledoc """
  Servicio funcional de PawFinder (Proyecto 2).

  Cada funcionalidad tiene dos partes:

    * **Núcleo** (`Perritos.Zonas`, `Perritos.Duplicados`): sólo funciones puras.
    * **Cáscara** (`Perritos.ZonasWeb`, `Perritos.DuplicadosWeb`): rutas `/f/...`
      que traen los datos, llaman al núcleo y responden JSON.
  """
end
