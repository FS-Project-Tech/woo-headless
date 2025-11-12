const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      stage: 2,
      autoprefixer: {
        flexbox: "no-2009",
      },
    },
    "postcss-lab-function": {
      preserve: false,
    },
  },
};

export default config;
