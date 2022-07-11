import Config

config :phoenix, :json_library, Jason

config :esbuild,
  version: "0.12.15",
  default: [
    args:
      ~w(src/index.ts --bundle --target=es2016 --outfile=../priv/static/assets/js/app.js --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

config :membrane_videoroom_demo, VideoRoomWeb.Endpoint, pubsub_server: VideoRoom.PubSub

config :membrane_videoroom_demo, version: System.get_env("VERSION", "unknown")

config :logger,
  compile_time_purge_matching: [
    [level_lower_than: :info],
    # Silence irrelevant warnings caused by resending handshake events
    [module: Membrane.SRTP.Encryptor, function: "handle_event/4", level_lower_than: :error]
  ]

telemetry_enabled = true

config :membrane_telemetry_metrics, enabled: telemetry_enabled

config :membrane_opentelemetry, enabled: telemetry_enabled

config :logger, :console, metadata: [:room, :peer]

config :membrane_rtc_engine_timescaledb, ecto_repos: [Membrane.RTC.Engine.TimescaleDB.Repo]

config :membrane_rtc_engine_timescaledb, Membrane.RTC.Engine.TimescaleDB.Repo,
  database: "membrane",
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  port: 5432,
  pool: Ecto.Adapters.SQL.Sandbox,
  chunk_time_interval: "10 minutes",
  chunk_compress_policy_interval: "10 minutes",
  log_level: :debug

import_config("#{config_env()}.exs")
