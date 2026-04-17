export type OneOf<K extends string = string, V = unknown> = {
  $case: K;
  value: V;
};

/** Extracts all the case names from a oneOf field. */
export type OneOfCases<T extends OneOf> = T["$case"];

/** Extracts a union of all the value types from a oneOf field. */
export type OneOfValues<T extends OneOf> = T["value"];

/** Extracts the specific union member from a oneOf field by case name. */
export type OneOfCase<T extends OneOf, K extends OneOfCases<T>> = T extends {
  $case: K;
}
  ? T
  : never;

/** Extracts the value type from a oneOf field by case name. */
export type OneOfValue<T extends OneOf, K extends OneOfCases<T>> = T extends {
  $case: K;
  value: infer V;
}
  ? V
  : never;
