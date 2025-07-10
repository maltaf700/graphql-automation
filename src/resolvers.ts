export const resolvers = {
  Query: {
    hello: () => "Hello world!",
    users: () => [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ],
  },
};
