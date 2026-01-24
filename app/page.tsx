
import Image from "next/image";
import Login from "./components/Login";

export default function Home() {
  return (
    <div className="hero  bg-blue-300 min-h-screen flext items-center justify-center px-16 py-28">
      <div className=" flex items-center justify-center mx-auto">
        <div className=" ">
          <Login />
        </div>

      </div>
    </div>
  );
}
