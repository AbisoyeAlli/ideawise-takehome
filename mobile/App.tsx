import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { UploadScreen } from './src/screens/UploadScreen';
import { networkMonitor } from './src/services/networkMonitor';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize network monitoring
    networkMonitor.initialize();

    // Cleanup on unmount
    return () => {
      networkMonitor.cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <UploadScreen />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default App;
