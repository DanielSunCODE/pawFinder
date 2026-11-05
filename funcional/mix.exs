defmodule Perritos.MixProject do
  use Mix.Project

  def project do
    [
      app: :perritos,
      version: "0.1.0",
      elixir: "~> 1.17",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      aliases: aliases(),
      releases: [perritos: [include_executables_for: [:unix]]]
    ]
  end

  def application do
    [extra_applications: [:logger], mod: {Perritos.Application, []}]
  end

  defp deps do
    [
      {:plug, "~> 1.16"},
      {:bandit, "~> 1.5"},
      {:jason, "~> 1.4"},
      {:req, "~> 0.5"}
    ]
  end

  # `mix test` no arranca la aplicación (ni el servidor): el núcleo es puro y se prueba solo.
  defp aliases do
    [test: "test --no-start"]
  end
end
