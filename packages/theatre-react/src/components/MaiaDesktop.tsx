import React from "react";
import { TheatreDesktopViewer, type TheatreDesktopViewerProps } from "./TheatreDesktopViewer";

export interface MaiaDesktopProps extends TheatreDesktopViewerProps {}

export function MaiaDesktop(props: MaiaDesktopProps) {
  return <TheatreDesktopViewer {...props} />;
}
