import path from "node:path";
import { FLY_API_TOKEN } from "./secrets";

const FLY_APP_NAME = "functional";

export const imageName = `registry.fly.io/${FLY_APP_NAME}:${$app.stage}`;

// const buildImage = new docker.Image("BuildImage", {
//   imageName,
//   registry: {
//     server: "registry.fly.io",
//     username: "x",
//     password: FLY_API_TOKEN.value,
//   },
//   build: {
//     context: process.cwd(),
//     dockerfile: path.join(process.cwd(), "Dockerfile"),
//     platform: "linux/amd64",
//     cacheFrom: {
//       images: [imageName],
//     },
//   },
//   buildOnPreview: false,
// });
