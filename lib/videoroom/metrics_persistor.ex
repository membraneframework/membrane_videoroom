defmodule Membrane.VideoRoom.MetricsPersistor do
  use GenServer

  alias Membrane.RTC.Engine.TimescaleDB.Reporter

  # 1 second
  @scrape_interval 1000

  # 1 hour
  @cleanup_interval 1000 * 60 * 60

  @spec start(Reporter.reporter(), GenServer.options()) :: GenServer.on_start()
  def start(reporter, options \\ []) do
    do_start(:start, reporter, options)
  end

  @spec start_link(Reporter.reporter(), GenServer.options()) :: GenServer.on_start()
  def start_link(reporter, options \\ []) do
    do_start(:start_link, reporter, options)
  end

  defp do_start(function, reporter, options) do
    apply(GenServer, function, [__MODULE__, reporter, options])
  end

  @spec child_spec(Keyword.t()) :: Supervisor.child_spec()
  def child_spec(opts) do
    {reporter, process_opts} = Keyword.pop(opts, :reporter, nil)

    %{
      id: __MODULE__,
      start: {__MODULE__, :start_link, [reporter, process_opts]}
    }
  end

  @impl true
  def init(reporter) do
    Process.send_after(self(), :scrape, @scrape_interval)
    Process.send_after(self(), :cleanup, @cleanup_interval)

    {:ok, %{reporter: reporter}}
  end

  @impl true
  def handle_info(:scrape, state) do
    report = Membrane.TelemetryMetrics.Reporter.scrape(VideoRoomReporter)
    Reporter.store_report(state.reporter, report)
    Process.send_after(self(), :scrape, @scrape_interval)

    {:noreply, state}
  end

  @impl true
  def handle_info(:cleanup, state) do
    Reporter.cleanup(state.reporter, 1, "day")
    Process.send_after(self(), :cleanup, @cleanup_interval)

    {:noreply, state}
  end
end
