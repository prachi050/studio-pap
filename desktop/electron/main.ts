import {
  app,
  BrowserWindow,
  desktopCapturer,
  globalShortcut,
  ipcMain,
  screen,
  shell,
  systemPreferences,
} from 'electron';
import path from 'node:path';
import {
  spawn,
  type ChildProcess,
} from 'node:child_process';

const isDevelopment = Boolean(
  process.env.VITE_DEV_SERVER_URL,
);

let mainWindow: BrowserWindow | null = null;
let floatingWindow: BrowserWindow | null = null;
let isAppQuitting = false;
let backendProcess: ChildProcess | null = null;

type ScreenCaptureResult = {
  dataUrl: string;
  sourceName: string;
  displayId: string;
  width: number;
  height: number;
};

type ScreenMediaAccessStatus =
  | 'not-determined'
  | 'granted'
  | 'denied'
  | 'restricted'
  | 'unknown';

type HiddenWindowState = {
  restoreMainWindow: boolean;
  restoreMainDevTools: boolean;
  restoreFloatingWindow: boolean;
};

const SCREEN_CAPTURE_PERMISSION_MESSAGE =
  'Screen Recording permission is required. Open macOS System Settings > Privacy & Security > Screen Recording, or Screen & System Audio Recording on newer macOS versions, enable Ghost Designer, Electron, Terminal, or your IDE, then quit and reopen the app.';

const WINDOW_HIDE_BEFORE_CAPTURE_MS = 300;

function getScreenMediaAccessStatus(): ScreenMediaAccessStatus {
  if (process.platform !== 'darwin') {
    return 'granted';
  }

  return systemPreferences.getMediaAccessStatus(
    'screen',
  ) as ScreenMediaAccessStatus;
}

function createScreenCapturePermissionError(
  status: ScreenMediaAccessStatus,
): Error {
  return new Error(
    `${SCREEN_CAPTURE_PERMISSION_MESSAGE} Current permission status: ${status}.`,
  );
}

function getCaptureSize(
  display: Electron.Display,
): Electron.Size {
  const maxWidth = 3840;
  const maxHeight = 2160;

  const width = Math.round(
    display.size.width,
  );

  const height = Math.round(
    display.size.height,
  );

  const scale = Math.min(
    maxWidth / width,
    maxHeight / height,
    1,
  );

  return {
    width: Math.max(
      1,
      Math.round(width * scale),
    ),
    height: Math.max(
      1,
      Math.round(height * scale),
    ),
  };
}

function logScreenCapture(
  message: string,
  details?: Record<string, unknown>,
): void {
  const payload = details
    ? ` ${JSON.stringify(details)}`
    : '';

  console.log(
    `[screen-capture] ${message}${payload}`,
  );
}

function wait(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getPrimaryScreenSource(
  sources: Electron.DesktopCapturerSource[],
  primaryDisplay: Electron.Display,
): Electron.DesktopCapturerSource | undefined {
  const screenSources = sources.filter(
    (source) =>
      source.id.startsWith('screen:'),
  );

  const primaryDisplayId = String(
    primaryDisplay.id,
  );

  return (
    screenSources.find(
      (source) =>
        source.display_id ===
        primaryDisplayId,
    ) ??
    screenSources.find(
      (source) =>
        source.id ===
        `screen:${primaryDisplayId}:0`,
    ) ??
    screenSources[0]
  );
}

function getFloatingWindowPosition(): {
  x: number;
  y: number;
} {
  const primaryDisplay =
    screen.getPrimaryDisplay();

  const workArea =
    primaryDisplay.workArea;

  const windowWidth = 390;
  const windowHeight = 620;
  const padding = 20;

  return {
    x:
      workArea.x +
      workArea.width -
      windowWidth -
      padding,

    y:
      workArea.y +
      workArea.height -
      windowHeight -
      padding,
  };
}

async function hideWindowsForCapture(): Promise<HiddenWindowState> {
  const currentMainWindow = mainWindow;
  const currentFloatingWindow =
    floatingWindow;

  const restoreMainWindow =
    currentMainWindow !== null &&
    !currentMainWindow.isDestroyed() &&
    currentMainWindow.isVisible();

  const restoreMainDevTools =
    currentMainWindow !== null &&
    !currentMainWindow.isDestroyed() &&
    currentMainWindow.webContents.isDevToolsOpened();

  const restoreFloatingWindow =
    currentFloatingWindow !== null &&
    !currentFloatingWindow.isDestroyed() &&
    currentFloatingWindow.isVisible();

  if (
    currentMainWindow !== null &&
    !currentMainWindow.isDestroyed() &&
    restoreMainDevTools
  ) {
    currentMainWindow.webContents.closeDevTools();
  }

  if (
    currentMainWindow !== null &&
    !currentMainWindow.isDestroyed() &&
    restoreMainWindow
  ) {
    // currentMainWindow.hide();
  }

  if (
    currentFloatingWindow !== null &&
    !currentFloatingWindow.isDestroyed() &&
    restoreFloatingWindow
  ) {
   // currentFloatingWindow.hide();
  }

  if (
    restoreMainWindow ||
    restoreMainDevTools ||
    restoreFloatingWindow
  ) {
    logScreenCapture(
      'application windows hidden before display capture',
      {
        restoreMainWindow,
        restoreMainDevTools,
        restoreFloatingWindow,
        waitMs:
          WINDOW_HIDE_BEFORE_CAPTURE_MS,
      },
    );

    await wait(
      WINDOW_HIDE_BEFORE_CAPTURE_MS,
    );
  }

  return {
    restoreMainWindow,
    restoreMainDevTools,
    restoreFloatingWindow,
  };
}

function restoreWindowsAfterCapture(
  state: HiddenWindowState,
): void {
  const currentMainWindow = mainWindow;
  const currentFloatingWindow =
    floatingWindow;

  if (
    state.restoreMainWindow &&
    currentMainWindow !== null &&
    !currentMainWindow.isDestroyed()
  ) {
    currentMainWindow.show();
    currentMainWindow.focus();
  }

  if (
    state.restoreMainDevTools &&
    currentMainWindow !== null &&
    !currentMainWindow.isDestroyed()
  ) {
    currentMainWindow.webContents.openDevTools({
      mode: 'detach',
    });
  }

  if (
    state.restoreFloatingWindow &&
    currentFloatingWindow !== null &&
    !currentFloatingWindow.isDestroyed()
  ) {
    currentFloatingWindow.showInactive();

    currentFloatingWindow.setAlwaysOnTop(
      true,
      'floating',
    );
  }

  if (
    state.restoreMainWindow ||
    state.restoreMainDevTools ||
    state.restoreFloatingWindow
  ) {
    logScreenCapture(
      'application windows restored after display capture',
      {
        restoreMainWindow:
          state.restoreMainWindow,

        restoreMainDevTools:
          state.restoreMainDevTools,

        restoreFloatingWindow:
          state.restoreFloatingWindow,
      },
    );
  }
}

function loadMainWindow(): void {
  const currentMainWindow = mainWindow;

  if (currentMainWindow === null) {
    return;
  }

  if (
    isDevelopment &&
    process.env.VITE_DEV_SERVER_URL
  ) {
    void currentMainWindow.loadURL(
      process.env.VITE_DEV_SERVER_URL,
    );

    currentMainWindow.webContents.openDevTools({
      mode: 'detach',
    });

    return;
  }

  void currentMainWindow.loadFile(
    path.join(
      __dirname,
      '../dist/index.html',
    ),
  );
}

function loadFloatingWindow(): void {
  const currentFloatingWindow =
    floatingWindow;

  if (currentFloatingWindow === null) {
    return;
  }

  if (
    isDevelopment &&
    process.env.VITE_DEV_SERVER_URL
  ) {
    const floatingUrl = new URL(
      process.env.VITE_DEV_SERVER_URL,
    );

    floatingUrl.searchParams.set(
      'window',
      'floating',
    );

    void currentFloatingWindow.loadURL(
      floatingUrl.toString(),
    );

    return;
  }

  void currentFloatingWindow.loadFile(
    path.join(
      __dirname,
      '../dist/index.html',
    ),
    {
      query: {
        window: 'floating',
      },
    },
  );
}

function createMainWindow(): void {
  const existingMainWindow =
    mainWindow;

  if (
    existingMainWindow !== null &&
    !existingMainWindow.isDestroyed()
  ) {
    existingMainWindow.show();
    existingMainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,

    minWidth: 1040,
    minHeight: 680,

    title: 'Ghost Designer',

    backgroundColor: '#070a12',

    show: false,

    titleBarStyle:
      process.platform === 'darwin'
        ? 'hiddenInset'
        : 'default',

    webPreferences: {
      preload: path.join(
        __dirname,
        'preload.js',
      ),

      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const createdMainWindow =
    mainWindow;

  createdMainWindow.once(
    'ready-to-show',
    () => {
      if (
        !createdMainWindow.isDestroyed()
      ) {
        createdMainWindow.show();
      }
    },
  );

  createdMainWindow.on(
    'closed',
    () => {
      if (
        mainWindow ===
        createdMainWindow
      ) {
        mainWindow = null;
      }
    },
  );

  createdMainWindow.webContents.setWindowOpenHandler(
    ({ url }) => {
      void shell.openExternal(url);

      return {
        action: 'deny',
      };
    },
  );

  loadMainWindow();
}

function createFloatingWindow(): void {
  const existingFloatingWindow =
    floatingWindow;

  if (
    existingFloatingWindow !== null &&
    !existingFloatingWindow.isDestroyed()
  ) {
    existingFloatingWindow.show();
    existingFloatingWindow.focus();
    return;
  }

  const position =
    getFloatingWindowPosition();

  floatingWindow = new BrowserWindow({
    width: 390,
    height: 620,

    minWidth: 390,
    minHeight: 100,

    maxWidth: 390,

    x: position.x,
    y: position.y,

    title: 'Aria',

    frame: false,
    transparent: true,

    backgroundColor: '#00000000',

    show: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,

    alwaysOnTop: true,
    skipTaskbar: true,

    hasShadow: true,

    webPreferences: {
      preload: path.join(
        __dirname,
        'preload.js',
      ),

      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const createdFloatingWindow =
    floatingWindow;

  createdFloatingWindow.setAlwaysOnTop(
    true,
    'floating',
  );

  createdFloatingWindow.setVisibleOnAllWorkspaces(
    true,
    {
      visibleOnFullScreen: true,
    },
  );

  createdFloatingWindow.once(
    'ready-to-show',
    () => {
      if (
        createdFloatingWindow.isDestroyed()
      ) {
        return;
      }

      createdFloatingWindow.showInactive();

      createdFloatingWindow.setAlwaysOnTop(
        true,
        'floating',
      );
    },
  );

  createdFloatingWindow.on(
    'close',
    (event) => {
      if (!isAppQuitting) {
        event.preventDefault();
        createdFloatingWindow.hide();
      }
    },
  );

  createdFloatingWindow.on(
    'closed',
    () => {
      if (
        floatingWindow ===
        createdFloatingWindow
      ) {
        floatingWindow = null;
      }
    },
  );

  createdFloatingWindow.webContents.setWindowOpenHandler(
    ({ url }) => {
      void shell.openExternal(url);

      return {
        action: 'deny',
      };
    },
  );

  loadFloatingWindow();
}

function showFloatingWindow(): void {
  const currentFloatingWindow =
    floatingWindow;

  if (
    currentFloatingWindow === null ||
    currentFloatingWindow.isDestroyed()
  ) {
    createFloatingWindow();
    return;
  }

  currentFloatingWindow.show();
  currentFloatingWindow.focus();

  currentFloatingWindow.setAlwaysOnTop(
    true,
    'floating',
  );
}

function hideFloatingWindow(): void {
  const currentFloatingWindow =
    floatingWindow;

  if (
    currentFloatingWindow === null ||
    currentFloatingWindow.isDestroyed()
  ) {
    return;
  }

  currentFloatingWindow.hide();
}

function toggleFloatingWindow(): void {
  const currentFloatingWindow =
    floatingWindow;

  if (
    currentFloatingWindow === null ||
    currentFloatingWindow.isDestroyed()
  ) {
    createFloatingWindow();
    return;
  }

  if (
    currentFloatingWindow.isVisible()
  ) {
    currentFloatingWindow.hide();
    return;
  }

  showFloatingWindow();
}

function showMainWindow(): void {
  const currentMainWindow = mainWindow;

  if (
    currentMainWindow === null ||
    currentMainWindow.isDestroyed()
  ) {
    createMainWindow();
    return;
  }

  currentMainWindow.show();

  if (
    currentMainWindow.isMinimized()
  ) {
    currentMainWindow.restore();
  }

  currentMainWindow.focus();
}

function registerGlobalShortcuts(): void {
  const registered =
    globalShortcut.register(
      'CommandOrControl+Shift+Space',
      () => {
        toggleFloatingWindow();
      },
    );

  if (!registered) {
    console.warn(
      '[floating-assistant] Global shortcut could not be registered.',
    );
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle(
    'app:ping',
    () => ({
      ok: true,
      appName: 'Ghost Designer',
    }),
  );

  ipcMain.handle(
    'floating:show',
    () => {
      showFloatingWindow();

      return {
        ok: true,
      };
    },
  );

  ipcMain.handle(
    'floating:hide',
    () => {
      hideFloatingWindow();

      return {
        ok: true,
      };
    },
  );

  ipcMain.handle(
    'floating:toggle',
    () => {
      toggleFloatingWindow();

      return {
        ok: true,
      };
    },
  );

  ipcMain.handle(
    'floating:minimize',
    () => {
      hideFloatingWindow();

      return {
        ok: true,
      };
    },
  );

  ipcMain.handle(
    'main-window:show',
    () => {
      showMainWindow();

      return {
        ok: true,
      };
    },
  );

  ipcMain.handle(
    'screen:capture-primary',
    async (): Promise<ScreenCaptureResult> => {
      const primaryDisplay = screen.getPrimaryDisplay();

      const permissionStatusBeforeCapture =
        getScreenMediaAccessStatus();

      const captureSize =
        getCaptureSize(
          primaryDisplay,
        );

      logScreenCapture(
        'capture requested',
        {
          platform: process.platform,

          permissionStatus:
            permissionStatusBeforeCapture,

          displayId:
            primaryDisplay.id,

          displaySize:
            primaryDisplay.size,

          displayScaleFactor:
            primaryDisplay.scaleFactor,

          requestedThumbnailSize:
            captureSize,
        },
      );

    // On macOS, don't block the capture attempt just because the
    // current status isn't "granted". Let desktopCapturer attempt
    // the capture so macOS can present the Screen Recording prompt
    // if appropriate. If it ultimately fails, we'll handle that in
    // the catch block below.

      const hiddenWindowState =
        await hideWindowsForCapture();

      try {
        const sources =
          await desktopCapturer.getSources(
            {
              types: ['screen'],

              thumbnailSize:
                captureSize,

              fetchWindowIcons:
                false,
            },
          );

        logScreenCapture(
          'sources resolved',
          {
            sourceCount:
              sources.length,

            sourceNames:
              sources.map(
                (source) => ({
                  id: source.id,

                  displayId:
                    source.display_id,

                  name:
                    source.name,

                  thumbnailSize:
                    source.thumbnail.getSize(),

                  thumbnailIsEmpty:
                    source.thumbnail.isEmpty(),
                }),
              ),
          },
        );

        const primarySource =
          getPrimaryScreenSource(
            sources,
            primaryDisplay,
          );

        if (!primarySource) {
          throw new Error(
            'No primary screen source is available for capture.',
          );
        }

        if (
          primarySource.thumbnail.isEmpty()
        ) {
          throw createScreenCapturePermissionError(
            getScreenMediaAccessStatus(),
          );
        }

        const imageSize =
          primarySource.thumbnail.getSize();

logScreenCapture(
  "capture succeeded",
  {
    selectedSourceId: primarySource.id,
    selectedDisplayId: primarySource.display_id,
    selectedSourceName: primarySource.name,
    imageSize,
  },
);


return {
  dataUrl: primarySource.thumbnail.toDataURL(),
  sourceName: primarySource.name,
  displayId: primarySource.display_id,
  width: imageSize.width,
  height: imageSize.height,
};
      } catch (error) {
        const permissionStatusAfterCapture =
          getScreenMediaAccessStatus();

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        console.error(
          '[screen-capture] capture failed',
          {
            message,

            permissionStatus:
              permissionStatusAfterCapture,

            stack:
              error instanceof Error
                ? error.stack
                : undefined,
          },
        );

        if (
          process.platform ===
            'darwin' &&
          permissionStatusAfterCapture !==
            'granted' &&
          /failed to get sources/i.test(
            message,
          )
        ) {
          throw createScreenCapturePermissionError(
            permissionStatusAfterCapture,
          );
        }

        throw error;
      } finally {
        restoreWindowsAfterCapture(
          hiddenWindowState,
        );
      }
    },
  );
}
const hasSingleInstanceLock =
  app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showMainWindow();
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();

const backendPath = app.isPackaged
  ? path.join(
      process.resourcesPath,
      "backend",
      "studiopap-backend",
    )
  : path.join(
      __dirname,
      "../../backend/dist/studiopap-backend",
      "studiopap-backend",
    );

console.log(
  "[Studio PAP] Starting backend from:",
  backendPath,
);

backendProcess = spawn(
  backendPath,
  [],
  {
    detached: false,
    stdio: [
      "ignore",
      "pipe",
      "pipe",
    ],
  },
);

backendProcess.stdout?.on(
  "data",
  (data: Buffer) => {
    console.log(
      "[Studio PAP Backend]",
      data.toString(),
    );
  },
);

backendProcess.stderr?.on(
  "data",
  (data: Buffer) => {
    console.error(
      "[Studio PAP Backend Error]",
      data.toString(),
    );
  },
);

backendProcess.on(
  "error",
  (error) => {
    console.error(
      "[Studio PAP Backend Spawn Error]",
      error,
    );
  },
);

backendProcess.on(
  "exit",
  (code, signal) => {
    console.log(
      "[Studio PAP Backend Exit]",
      {
        code,
        signal,
      },
    );

    backendProcess = null;
  },
);

createMainWindow();
createFloatingWindow();

registerGlobalShortcuts();

app.on("activate", () => {
  if (
    BrowserWindow.getAllWindows().length === 0
  ) {
    createMainWindow();
    createFloatingWindow();
    return;
  }

  showMainWindow();
});

function stopBackend(): void {
  if (
    backendProcess !== null &&
    backendProcess.exitCode === null &&
    !backendProcess.killed
  ) {
    console.log(
      "[Studio PAP] Stopping backend.",
    );

    backendProcess.kill("SIGTERM");
  }

  backendProcess = null;
}

app.on("before-quit", () => {
  isAppQuitting = true;

  globalShortcut.unregisterAll();
  stopBackend();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  stopBackend();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

});