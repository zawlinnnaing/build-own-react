import SimpleReact from "./engine";
import "./style.css";

const App = () => {
  const [count, setCount] = SimpleReact.useState(0);
  return (
    <button onClick={() => setCount((prev) => prev + 1)}>
      Count is: {count}
    </button>
  );
};

SimpleReact.render(<App />, document.getElementById("app")!);
