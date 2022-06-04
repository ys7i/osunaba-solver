const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    "content-script": path.join(__dirname, "src/content-script.js"),
    background: path.join(__dirname, "src/background.js"),
  },
  output: {
    path: path.join(__dirname, "dist/js"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".js"],
  },
  plugins: [
    new CopyWebpackPlugin({ patterns: [{ from: "public", to: "../" }] }),
  ],
  devtool: "cheap-module-source-map",
};
