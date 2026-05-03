import { Spinner } from "@/components/ui/spinner";

const Loader = () => {
  return (
    <div className="flex z-50 justify-center items-center h-full">
      <Spinner />
    </div>
  );
};

export default Loader;
