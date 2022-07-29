module.exports = {
  mode: "jit",
  purge: {
    content: ["./js/**/*.js", "../lib/*_web/**/*.*ex"],
    safelist: [
      "grid",
      "grid-cols-1",
      "md:grid-cols-1",
      "md:grid-cols-2",
      "md:grid-cols-3",
      "md:grid-cols-4",
      "animate-pulse",
      "active-screensharing-grid",
      "inactive-screensharing-grid",
      "videos-grid-with-screensharing",
    ],
  },
  theme: {
    rotate: {
      45: "45deg",
      135: "135deg",
    },
    flex: {
      3: "3",
      1: "1",
    },
    extend: {
      invert: {
        50: ".50",
      },
      fontFamily: {
        aktivGrotesk: [
          'aktiv-grotesk',
          'Roboto',
          'sans-serif',
          '"Inter"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
        ],
        rocGrotesk: [
          'roc-grotesk',
          'Roboto',
          'sans-serif',
          '"Inter"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
        ],
      },
      colors: {
        membraneDark: '#001A72',
        membraneLight: '#87CCE8',
      },
    },
  },
  variants: {
    extend: {
      opacity: ["disabled"],
    },
    backgroundColor: ({ after }) => after(["disabled", "group-disabled"]),
  },
  plugins: [require("@tailwindcss/aspect-ratio")],
};
