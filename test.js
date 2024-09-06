const test = {
  role: "user",
  content:
    "Suggestions for improvement:\n\n1. Remove redundant section; already exposes the port.\n2. Consider using a named volume instead of a bind mount for better portability.\n3. Use environment variables for sensitive data or configuration options.\n4. Add healthcheck for the service to ensure it's running correctly.\n5. Consider adding a .dockerignore file to exclude unnecessary files from the build context.",
};

console.log(JSON.parse(JSON.stringify(test.content)));
