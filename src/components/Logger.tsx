import { useState, createContext, useContext, Fragment } from "react";

export interface ILoggingStore {
  clearLogs(): void;
  log(line: string | React.ReactNode): void;
  logLines: Array<string | React.ReactNode>;
}

const useLoggingStore = (): ILoggingStore => {
  const [logLines, setLogLines] = useState<Array<string | React.ReactNode>>([]);
  const clearLogs = () => setLogLines([]);
  const log = (line: string | React.ReactNode) => {
    const time = new Date(Date.now()).toLocaleTimeString();
    setLogLines((prevLines) => [
      ...prevLines,
      typeof line === "string" ? (
        `[${time}] ${line}`
      ) : (
        <Fragment>{line}</Fragment>
      ),
    ]);
  };
  return {
    clearLogs,
    log,
    logLines,
  };
};

/**
 * Logging Store that doesn't store anything. Used as default for LoggingContext
 * if no other store is provided
 */
const noopLoggingStore: ILoggingStore = {
  clearLogs() {},
  log(line: string) {},
  logLines: [],
};

const LoggingContext = createContext<ILoggingStore>(noopLoggingStore);

export function ProvideLogging({ children }) {
  const logging = useLoggingStore();
  return (
    <LoggingContext.Provider value={logging}>
      {children}
    </LoggingContext.Provider>
  );
}

export const useLogging = () => {
  return useContext(LoggingContext);
};
