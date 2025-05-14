import { registerGlobalMiddleware } from "@tanstack/react-start";
import { authMiddleware } from "./lib/auth";

registerGlobalMiddleware({
  middleware: [authMiddleware],
});
