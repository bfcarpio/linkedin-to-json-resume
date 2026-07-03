// Type declarations for browser-specific saveAs implementations
interface NavigatorWithSave extends Navigator {
  msSaveBlob?: (blob: Blob, defaultName?: string) => boolean;
  msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean;
}

interface WindowWithSave extends Window {
  saveAs?: (blob: Blob, filename: string) => void;
  webkitSaveAs?: (blob: Blob, filename: string) => void;
  mozSaveAs?: (blob: Blob, filename: string) => void;
  msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean;
}

type SaveFn = (blob: Blob, filename: string) => void;

function getSaveAs(
  w: WindowWithSave,
  nav: NavigatorWithSave,
): SaveFn | undefined {
  const s1 = w.saveAs;
  if (s1) return (b, n) => s1(b, n);

  const s2 = nav.msSaveBlob;
  if (s2)
    return (b, n) => {
      s2(b, n);
    };

  const s3 = w.webkitSaveAs;
  if (s3) return (b, n) => s3(b, n);

  const s4 = w.mozSaveAs;
  if (s4) return (b, n) => s4(b, n);

  const s5 = w.msSaveOrOpenBlob;
  if (s5)
    return (b, n) => {
      s5(b, n);
    };

  return undefined;
}

function _save(text: string, fileName: string): void {
  const blob = new Blob([text], { type: "text/plain" });

  const w = window as WindowWithSave;
  const nav = navigator as NavigatorWithSave;

  // saveAs implementation from https://gist.github.com/MrSwitch/3552985
  const saveAs = getSaveAs(w, nav);

  if (saveAs) {
    saveAs(blob, fileName || "resume.json");
    return;
  }

  const url = URL.createObjectURL(blob);
  if ("download" in document.createElement("a")) {
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", fileName || "resume.json");
    a.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
  } else {
    window.open(url, "_blank", "");
  }
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export default _save;
