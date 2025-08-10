import { createContext, useContext, ReactNode } from 'react';

type QrScannerContextType = {
  openScanner: () => void;
};

const QrScannerContext = createContext<QrScannerContextType | undefined>(undefined);

export const QrScannerProvider = ({ children, openScanner }: { children: ReactNode, openScanner: () => void }) => {
  return (
    <QrScannerContext.Provider value={{ openScanner }}>
      {children}
    </QrScannerContext.Provider>
  );
};

export const useQrScanner = () => {
  const context = useContext(QrScannerContext);
  if (!context) {
    throw new Error('useQrScanner must be used within a QrScannerProvider');
  }
  return context;
};