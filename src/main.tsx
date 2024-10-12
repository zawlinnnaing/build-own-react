import SimpleReact from "./engine";
import "./style.css";

const App = () => {
  const [count, setCount] = SimpleReact.useState(0);
  const [count2, setCount2] = SimpleReact.useState(1);

  SimpleReact.useEffect(() => {
    console.log(
      `This effect runs every time count changes. Count is: ${count}`
    );
    return () => {
      console.log("This cleanup runs every time count changes", count);
    };
  }, [count]);

  SimpleReact.useEffect(() => {
    console.log(
      `This effect runs every time count2 changes. Count 2 is: ${count2}`
    );
    return () => {
      console.log("This cleanup runs every time count2 changes", count2);
    };
  }, [count2]);

  return (
    <div>
      <button onClick={() => setCount((prev) => prev + 1)}>
        Count is: {count}
      </button>
      <button onClick={() => setCount2((prev) => prev * 10)}>
        Count 2 is: {count2}
      </button>
    </div>
  );
};

SimpleReact.render(<App />, document.getElementById("app")!);
