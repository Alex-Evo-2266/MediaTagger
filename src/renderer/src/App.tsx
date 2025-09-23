
import Gallery from "./components/Gallery";
import { createTheme, ThemeProvider } from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#000000", 
      paper: "#121212",  
    },
    text: {
      primary: "#ffffff", 
      secondary: "#aaaaaa", 
    },
  },
});

function App() {


  return (
    <ThemeProvider theme={darkTheme}>
      <Gallery/>
    </ThemeProvider>
  );
}

export default App;
