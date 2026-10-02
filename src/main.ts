import { Plugin } from "obsidian";
import "lineupjs/build/LineUpJS.css";
import "./styles/lineup.css";
import { LineUpView } from "./LineUpView";

/* 
Register LineUp as a view for bases if possible
*/
export default class LineUpPlugin extends Plugin {
  async onload(): Promise<void> {
    if (typeof this.registerBasesView === "function") {
      this.registerBasesView("lineup", {
        name: "LineUp",
        icon: "lucide-bar-chart-3",
        factory: (controller, containerEl) => new LineUpView(this.app, controller, containerEl),
      });
    }
  }
}
