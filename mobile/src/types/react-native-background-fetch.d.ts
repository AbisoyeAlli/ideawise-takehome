declare module 'react-native-background-fetch' {
  export interface BackgroundFetchConfig {
    minimumFetchInterval?: number;
    stopOnTerminate?: boolean;
    startOnBoot?: boolean;
    enableHeadless?: boolean;
    requiresCharging?: boolean;
    requiresDeviceIdle?: boolean;
    requiresBatteryNotLow?: boolean;
    requiresStorageNotLow?: boolean;
  }

  export interface TaskConfig {
    taskId: string;
    delay?: number;
    periodic?: boolean;
    forceAlarmManager?: boolean;
    stopOnTerminate?: boolean;
    startOnBoot?: boolean;
  }

  export default class BackgroundFetch {
    static configure(
      config: BackgroundFetchConfig,
      onEvent: (taskId: string) => void,
      onTimeout: (taskId: string) => void
    ): Promise<number>;

    static finish(taskId: string): void;

    static scheduleTask(config: TaskConfig): Promise<void>;

    static status(): Promise<number>;
  }
}
