import { FRONTEND_URL } from "src/constants/index";

export const wsConfig = {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
};
