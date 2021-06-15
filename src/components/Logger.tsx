
import {useState, createContext, useContext} from "react";

const LoggingStore = () => {
  const [logLines, setLogLines] = useState([]);

  const clearLog = () => setLogLines([]);
  // @ts-ignore
  const log = (line) => setLogLines([line, ...logLines])

  return {
    clearLog,
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
