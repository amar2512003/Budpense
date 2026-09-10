const Loader = ({ fullScreen = false, size = "md" }) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const loader = (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600`}
    />
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {loader}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-6">{loader}</div>;
};

export default Loader;