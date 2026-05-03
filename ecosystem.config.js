module.exports = {
  apps: [
    {
      name: "maya-ai",
      script: "./node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0",
      env: {
        NODE_ENV: "production",
        AUTH_TRUST_HOST: "true",
      },
    },
  ],
};
