declare module "@sparticuz/chromium" {
  const chromium: {
    args: string[];
    defaultViewport?: { width: number; height: number };
    executablePath: string | Promise<string>;
  };
  export default chromium;
  export const args: string[];
  export const defaultViewport:
    | { width: number; height: number }
    | undefined;
  export const executablePath: string | Promise<string>;
}
