export type ScreenCaptureResult = {
  dataUrl: string;
  sourceName: string;
  displayId: string;
  width: number;
  height: number;
};

export async function capturePrimaryDisplay(): Promise<ScreenCaptureResult> {
  return window.ghostDesigner.invoke<ScreenCaptureResult>('screen:capture-primary');
}
