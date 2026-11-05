defmodule Perritos.Application do
  @moduledoc false
  use Application

  @impl true
  def start(_tipo, _args) do
    puerto = Application.fetch_env!(:perritos, :puerto)

    hijos = [{Bandit, plug: Perritos.Router, scheme: :http, port: puerto}]

    Supervisor.start_link(hijos, strategy: :one_for_one, name: Perritos.Supervisor)
  end
end
