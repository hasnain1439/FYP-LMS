// src/App.js

import { UserProvider } from "./context/ContextApi";
import FypRoutes from "./routes/FypRoutes";

function App() {
  return (
    <UserProvider>
      <FypRoutes />
    </UserProvider>
  );
}
// thsiakksajdd 
export default App;
