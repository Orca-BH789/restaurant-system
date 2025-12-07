import { useContext } from "react";
import { NotificationContext } from "./NotificationContextDefinition";

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider");
  }
  return context;
}
