
import {useState, createContext, useContext} from "react";

const LoggingStore = () => {
  const [logLines, setLogLines] = useState([]);

  const clearLogs = () => setLogLines([]);
  // @ts-ignore
  const log = (line) => {
    // @ts-ignore
    setLogLines(prevLines => ([...prevLines, line]))
  }

  return {
    clearLogs,
    log,
    logLines,
  }
};
// @ts-ignore
const LoggingContext = createContext();

export function ProvideLogging({children}) {
  const logging = LoggingStore();
  return <LoggingContext.Provider value={logging}>{children}</LoggingContext.Provider>;
}

export const useLogging = () => {
  return useContext(LoggingContext);
};
