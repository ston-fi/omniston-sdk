export type Converter<T> = {
  fromJSON(object: unknown): T;
  toJSON(message: T): unknown;
};
