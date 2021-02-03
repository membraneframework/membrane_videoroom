defmodule VideoRoom.MixProject do
  use Mix.Project

  def project do
    [
      app: :membrane_videoroom_demo,
      version: "0.1.0",
      elixir: "~> 1.10",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      mod: {VideoRoom.App, []},
      extra_applications: [:logger]
    ]
  end

  defp deps do
    [
      # {:membrane_core, "~> 0.6.1"},
      {:membrane_core,
       github: "membraneframework/membrane_core", branch: "develop", override: true},
      {:membrane_file_plugin, "~> 0.5.0"},
      {:membrane_hackney_plugin, "~> 0.4.0"},
      {:websockex, "~> 0.4.2"},
      {:poison, "~> 3.1"},
      {:membrane_realtimer_plugin, "~> 0.1.0"},
      {:membrane_funnel_plugin, "~> 0.1.0"},
      # {:membrane_h264_ffmpeg_plugin, "~> 0.7.0"},
      {:membrane_h264_ffmpeg_plugin,
       github: "membraneframework/membrane_h264_ffmpeg_plugin", branch: "wait-for-keyframe"},
      # {:membrane_rtp_h264_plugin, "~> 0.4.0"},
      {:membrane_rtp_h264_plugin,
       github: "membraneframework/membrane_rtp_h264_plugin", branch: "fix-event", override: true},
      {:membrane_ice_plugin,
       github: "membraneframework/membrane_ice_plugin", branch: "ice-restart", override: true},
      {:membrane_dtls_plugin, "~> 0.2.0"},
      # {:membrane_rtp_plugin, "~> 0.5.0"},
      {:membrane_rtp_plugin,
       github: "membraneframework/membrane_rtp_plugin", branch: "inband-rtcp"},
      {:ex_libsrtp, "~> 0.1.0"},
      {:membrane_rtp_opus_plugin, "~> 0.2.0"},
      {:membrane_opus_plugin, "~> 0.2.0"},
      {:membrane_element_tee, "~> 0.4.1"},
      {:membrane_element_fake, "~> 0.4.0"},
      {:plug_cowboy, "~> 2.0"},
      {:membrane_webrtc_plugin,
       github: "membraneframework/membrane_webrtc_plugin", branch: "develop"}
    ]
  end
end
