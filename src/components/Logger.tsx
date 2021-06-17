
import {useState, createContext, useContext} from "react";

interface ILoggingStore {
  clearLog(): void;
  log(line: string): void;
  logLines: string[];
}

const useLoggingStore = (): ILoggingStore => {
  const [logLines, setLogLines] = useState<string[]>([]);
  const clearLog = () => setLogLines([]);
  const log = (line: string) => setLogLines([line, ...logLines]);
  return {
    clearLog,
    log,
    logLines,
  }
};

/**
 * Logging Store that doesn't store anything. Used as default for LoggingContext
 * if no other store is provided
 */
const noopLoggingStore: ILoggingStore = {
  clearLog() {},
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
