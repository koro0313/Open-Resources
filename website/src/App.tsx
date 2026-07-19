import { createBrowserRouter, RouterProvider } from "react-router"
import Landing from "./pages/Landing"
import Editor from "./pages/Editor"
import Reader from "./pages/Reader"

const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/editor",
    Component: Editor,
  },
  {
    path: "/reader/:docId",
    Component: Reader,
  },
])

export function App() {
  return <RouterProvider router={router} />
}

export default App

