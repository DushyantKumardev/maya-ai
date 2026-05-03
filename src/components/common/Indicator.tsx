const Indicator = ({
  size,
  color,
  message,
  ...props
}: {
  size?: string;
  color?: string;
  message?: string;
  [key: string]: any;
}) => {
  const defaultSize = "h-3 w-3";
  const defaultColor = "bg-primary";
  return (
    <div
      className="flex gap-2 items-center text-sm animate-pulse text-muted-foreground"
      {...props}
    >
      <span className={`relative flex ${size || defaultSize}`}>
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color || defaultColor} opacity-75`}
        ></span>
        <span
          className={`relative inline-flex rounded-full ${size || defaultSize} ${color || defaultColor}`}
        ></span>
      </span>
      {message}
    </div>
  );
};

export { Indicator };
