import { registerGlobalMiddleware } from "@tanstack/react-start";
import { authMiddleware } from "./lib/server/auth";

registerGlobalMiddleware({
  middleware: [authMiddleware],
});
