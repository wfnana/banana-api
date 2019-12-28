module.exports = {
  apps: [
    {
      name: "banana-api",
      script: "strapi",
      args: "develop",
      autorestart: true,
      source_map_support: true,
      watch: ["api/**/*", "config/**/*", "extensions/**/*"]
    }
  ]
};
