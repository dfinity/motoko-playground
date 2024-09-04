import { createProxyMiddleware } from "http-proxy-middleware";

export default (app) => {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://127.0.0.1:4943",
    })
  );
};
