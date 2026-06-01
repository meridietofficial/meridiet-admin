// utils/inputHelpers.js

export const MAX_LIMIT = 1000000;

export const formatAndLimitInput = (value) => {
  const raw = value.replace(/,/g, "");
  let number = Number(raw);

  if (isNaN(number)) return "";

  if (number > MAX_LIMIT) number = MAX_LIMIT;

  return number;
};
