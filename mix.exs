defmodule VideoRoom.MixProject do
  use Mix.Project

  def project do
    [
      app: :membrane_videoroom_demo,
      version: "0.1.0",
      elixir: "~> 1.13",
      aliases: aliases(),
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      mod: {VideoRoom.Application, []},
      extra_applications: [:logger]
    ]
  end

  defp deps do
    [
      {:membrane_rtc_engine, github: "membraneframework/membrane_rtc_engine", ref: "81eba82"},
      {:membrane_ice_plugin, github: "membraneframework/membrane_ice_plugin", branch: "enforce-ice-tcp", override: true},
      {:plug_cowboy, "~> 2.5.2"},
      {:phoenix, "~> 1.6"},
      {:phoenix_html, "~> 3.0"},
      {:phoenix_live_view, "~> 0.16.0"},
      {:phoenix_live_reload, "~> 1.2"},
      {:jason, "~> 1.2"},
      {:phoenix_inline_svg, "~> 1.4"},
      {:uuid, "~> 1.1"},
      {:esbuild, "~> 0.4", runtime: Mix.env() == :dev},
      {:cowlib, "~> 2.11.0", override: true},

      # Otel
      {:opentelemetry, "~> 1.0"},
      {:opentelemetry_api, "~> 1.0"},
      {:opentelemetry_exporter, "~> 1.0"},
      {:opentelemetry_zipkin, "~> 1.0"},

      # Benchmarks
      {:beamchmark, "~> 0.1.0", only: :benchmark},
      {:stampede, github: "geometerio/stampede-elixir", only: :benchmark},
      {:httpoison, "~> 1.8", only: :benchmark},
      {:poison, "~> 5.0.0", only: :benchmark}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "cmd --cd assets npm ci"],
      "assets.deploy": [
        "cmd --cd assets npm run deploy",
        "esbuild default --minify",
        "phx.digest"
      ]
    ]
  end
end
