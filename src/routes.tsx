import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./app/App";
import EquipmentAnomalies from "./screens/EquipmentAnomalies";
import Screen2 from "./screens/Screen2";
import Screen3 from "./screens/Screen3";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/equipment-anomalies" replace /> },
      { path: "equipment-anomalies", element: <EquipmentAnomalies /> },
      { path: "screen-2", element: <Screen2 /> },
      { path: "screen-3", element: <Screen3 /> },
    ],
  },
]);
