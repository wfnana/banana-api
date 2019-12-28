module.exports = {
  apps: [
    {
      name: "banana-api",
      script: "strapi",
      args: "start",
      autorestart: true,
      source_map_support: true,
      watch: ["api/**/*", "config/**/*", "extensions/**/*"]
    }
  ]
};
