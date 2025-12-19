import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./app/App";
import EquipmentAnomalies from "./screens/EquipmentAnomalies";
import EquipmentStandardSettings from "./screens/EquipmentStandardSettings";
import Screen3 from "./screens/Screen3";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/equipment-anomalies" replace /> },
      { path: "equipment-anomalies", element: <EquipmentAnomalies /> },
      { path: "equipment-standard-settings", element: <EquipmentStandardSettings /> },
      { path: "screen-3", element: <Screen3 /> },
    ],
  },
]);
