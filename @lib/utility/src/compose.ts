export const compose = (...fns) => (arg) => fns.reduce((args, fn) => fn(args), arg);
