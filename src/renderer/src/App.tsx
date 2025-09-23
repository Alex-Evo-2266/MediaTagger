
import Gallery from "./components/Gallery";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: "dark", // 🌙 включает тёмный режим
    background: {
      default: "#000000", // фон страницы
      paper: "#121212",   // фон карточек
    },
    text: {
      primary: "#ffffff", // основной текст
      secondary: "#aaaaaa", // второстепенный
    },
  },
});

function App() {


  return (
    <ThemeProvider theme={darkTheme}>
      {/* <CssBaseline />  */}
      <Gallery/>
    </ThemeProvider>
  );
}

export default App;
