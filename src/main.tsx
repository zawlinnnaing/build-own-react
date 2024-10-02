import SimpleReact from "./engine";
import "./style.css";

const example = <div className="red">JSX works!!</div>;

SimpleReact.render(example, document.getElementById("app")!);
