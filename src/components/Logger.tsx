
import {useState, createContext, useContext} from "react";

interface ILoggingStore {
  clearLogs(): void;
  log(line: string): void;
  logLines: string[];
}

const useLoggingStore = (): ILoggingStore => {
  const [logLines, setLogLines] = useState<string[]>([]);
  const clearLogs = () => setLogLines([]);
  const log = (line: string) => setLogLines([line, ...logLines]);
  return {
    clearLogs,
    log,
    logLines,
  }
};

/**
 * Logging Store that doesn't store anything. Used as default for LoggingContext
 * if no other store is provided
 */
const noopLoggingStore: ILoggingStore = {
  clearLogs() {},
  log(line: string) {},
  logLines: [],
}

const LoggingContext = createContext<ILoggingStore>(noopLoggingStore);

export function ProvideLogging({children}) {
  const logging = useLoggingStore();
  return <LoggingContext.Provider value={logging}>{children}</LoggingContext.Provider>;
}

export const useLogging = () => {
  return useContext(LoggingContext);
};
