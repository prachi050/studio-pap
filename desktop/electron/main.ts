import {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  screen,
  shell,
  systemPreferences,
} from 'electron';
import path from 'node:path';

const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL);

let mainWindow: BrowserWindow | null = null;

type ScreenCaptureResult = {
  dataUrl: string;
  sourceName: string;
  displayId: string;
  width: number;
  height: number;
};

type ScreenMediaAccessStatus = 'not-determined' | 'granted' | 'denied' | 'restricted' | 'unknown';

const SCREEN_CAPTURE_PERMISSION_MESSAGE =
  'Screen Recording permission is required. Open macOS System Settings > Privacy & Security > Screen Recording, or Screen & System Audio Recording on newer macOS versions, enable Ghost Designer, Electron, Terminal, or your IDE, then quit and reopen the app.';
const WINDOW_HIDE_BEFORE_CAPTURE_MS = 300;

function getScreenMediaAccessStatus(): ScreenMediaAccessStatus {
  if (process.platform !== 'darwin') {
    return 'granted';
  }

  return systemPreferences.getMediaAccessStatus('screen') as ScreenMediaAccessStatus;
}

function createScreenCapturePermissionError(status: ScreenMediaAccessStatus): Error {
  return new Error(`${SCREEN_CAPTURE_PERMISSION_MESSAGE} Current permission status: ${status}.`);
}

function getCaptureSize(display: Electron.Display): Electron.Size {
  const maxWidth = 3840;
  const maxHeight = 2160;
  const width = Math.round(display.size.width);
  const height = Math.round(display.size.height);
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function logScreenCapture(message: string, details?: Record<string, unknown>): void {
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.log(`[screen-capture] ${message}${payload}`);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getPrimaryScreenSource(
  sources: Electron.DesktopCapturerSource[],
  primaryDisplay: Electron.Display,
): Electron.DesktopCapturerSource | undefined {
  const screenSources = sources.filter((source) => source.id.startsWith('screen:'));
  const primaryDisplayId = String(primaryDisplay.id);

  return (
    screenSources.find((source) => source.display_id === primaryDisplayId) ??
    screenSources.find((source) => source.id === `screen:${primaryDisplayId}:0`) ??
    screenSources[0]
  );
}

async function hideGhostDesignerWindowForCapture(): Promise<{
  shouldRestoreWindow: boolean;
  shouldRestoreDevTools: boolean;
}> {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return {
      shouldRestoreWindow: false,
      shouldRestoreDevTools: false,
    };
  }

  const shouldRestoreWindow = mainWindow.isVisible();
  const shouldRestoreDevTools = mainWindow.webContents.isDevToolsOpened();

  if (shouldRestoreDevTools) {
    mainWindow.webContents.closeDevTools();
  }

  if (shouldRestoreWindow) {
    mainWindow.hide();
  }

  if (shouldRestoreWindow || shouldRestoreDevTools) {
    logScreenCapture('ghost designer window hidden before display capture', {
      shouldRestoreWindow,
      shouldRestoreDevTools,
      waitMs: WINDOW_HIDE_BEFORE_CAPTURE_MS,
    });
    await wait(WINDOW_HIDE_BEFORE_CAPTURE_MS);
  }

  return {
    shouldRestoreWindow,
    shouldRestoreDevTools,
  };
}

function restoreGhostDesignerWindowAfterCapture(options: {
  shouldRestoreWindow: boolean;
  shouldRestoreDevTools: boolean;
}): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (options.shouldRestoreWindow) {
    mainWindow.show();
    mainWindow.focus();
  }

  if (options.shouldRestoreDevTools) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  if (options.shouldRestoreWindow || options.shouldRestoreDevTools) {
    logScreenCapture('ghost designer window restored after display capture', options);
  }
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1040,
    minHeight: 680,
    title: 'Ghost Designer',
    backgroundColor: '#070a12',
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDevelopment && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle('app:ping', () => ({
    ok: true,
    appName: 'Ghost Designer',
  }));

  ipcMain.handle('screen:capture-primary', async (): Promise<ScreenCaptureResult> => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const permissionStatusBeforeCapture = getScreenMediaAccessStatus();
    const captureSize = getCaptureSize(primaryDisplay);

    logScreenCapture('capture requested', {
      platform: process.platform,
      permissionStatus: permissionStatusBeforeCapture,
      displayId: primaryDisplay.id,
      displaySize: primaryDisplay.size,
      displayScaleFactor: primaryDisplay.scaleFactor,
      requestedThumbnailSize: captureSize,
    });

    if (
      process.platform === 'darwin' &&
      ['denied', 'restricted', 'unknown'].includes(permissionStatusBeforeCapture)
    ) {
      const permissionError = createScreenCapturePermissionError(permissionStatusBeforeCapture);
      console.error('[screen-capture] permission blocked capture', permissionError.message);
      throw permissionError;
    }

    const restoreOptions = await hideGhostDesignerWindowForCapture();

    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: captureSize,
        fetchWindowIcons: false,
      });

      logScreenCapture('sources resolved', {
        sourceCount: sources.length,
        sourceNames: sources.map((source) => ({
          id: source.id,
          displayId: source.display_id,
          name: source.name,
          thumbnailSize: source.thumbnail.getSize(),
          thumbnailIsEmpty: source.thumbnail.isEmpty(),
        })),
      });

      const primarySource = getPrimaryScreenSource(sources, primaryDisplay);

      if (!primarySource) {
        throw new Error('No primary screen source is available for capture.');
      }

      if (primarySource.thumbnail.isEmpty()) {
        throw createScreenCapturePermissionError(getScreenMediaAccessStatus());
      }

      const imageSize = primarySource.thumbnail.getSize();

      logScreenCapture('capture succeeded', {
        selectedSourceId: primarySource.id,
        selectedDisplayId: primarySource.display_id,
        selectedSourceName: primarySource.name,
        imageSize,
      });

      return {
        dataUrl: primarySource.thumbnail.toDataURL(),
        sourceName: primarySource.name,
        displayId: primarySource.display_id,
        width: imageSize.width,
        height: imageSize.height,
      };
    } catch (error) {
      const permissionStatusAfterCapture = getScreenMediaAccessStatus();
      const message = error instanceof Error ? error.message : String(error);

      console.error('[screen-capture] capture failed', {
        message,
        permissionStatus: permissionStatusAfterCapture,
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (
        process.platform === 'darwin' &&
        permissionStatusAfterCapture !== 'granted' &&
        /failed to get sources/i.test(message)
      ) {
        throw createScreenCapturePermissionError(permissionStatusAfterCapture);
      }

      throw error;
    } finally {
      restoreGhostDesignerWindowAfterCapture(restoreOptions);
    }
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
